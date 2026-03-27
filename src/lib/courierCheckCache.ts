import { supabase } from "@/integrations/supabase/client";
import { sanitizePhoneInput } from "@/lib/phoneUtils";

const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};
const dbInflight: Record<string, Promise<any>> = {};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const REQUEST_TIMEOUT_MS = 17000;
const DB_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalize Bangladesh phone numbers to 01XXXXXXXXX
 * Supports Bengali digits, +880, 880, 10-digit local input, and extra spaces/symbols.
 */
export function normalizeBDPhone(raw: string): string | null {
  let digits = sanitizePhoneInput(raw || "");

  if (digits.startsWith("+880")) digits = `0${digits.slice(4)}`;
  digits = digits.replace(/\D/g, "");

  if (digits.startsWith("880") && digits.length >= 13) {
    digits = `0${digits.slice(3)}`;
  }

  if (digits.length === 10 && digits.startsWith("1")) {
    digits = `0${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("01")) {
    return digits;
  }

  return null;
}

async function hydrateCourierCacheFromDb(phone: string) {
  if (cache[phone]) return cache[phone];
  if (dbInflight[phone]) return dbInflight[phone];

  const request = (async () => {
    try {
      const { data } = await supabase
        .from("courier_check_cache")
        .select("response_data, created_at")
        .eq("phone", phone)
        .limit(1)
        .maybeSingle();

      if (!data?.response_data) return null;

      const age = Date.now() - new Date(data.created_at).getTime();
      const hydrated = {
        ...(data.response_data as Record<string, unknown>),
        _cached: true,
        _stale: age >= DB_CACHE_TTL_MS,
      };

      cache[phone] = hydrated;
      return hydrated;
    } catch {
      return null;
    } finally {
      delete dbInflight[phone];
    }
  })();

  dbInflight[phone] = request;
  return request;
}

async function requestCourierCheck(phone: string) {
  if (inflight[phone]) return inflight[phone];

  const request = (async () => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/bd-courier-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ phone }),
        signal: controller.signal,
      });

      if (!resp.ok) return null;

      const data = await resp.json();
      cache[phone] = data;
      return data;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timeoutId);
      delete inflight[phone];
    }
  })();

  inflight[phone] = request;
  return request;
}

/**
 * Bulk preload cached courier data from DB into in-memory cache.
 * Call once when orders page loads — avoids individual edge function calls.
 */
export async function preloadCourierCache(phones: string[]): Promise<void> {
  const cleaned = phones
    .map((p) => normalizeBDPhone(p || ""))
    .filter((p): p is string => p !== null && !cache[p]);

  if (cleaned.length === 0) return;

  const unique = [...new Set(cleaned)];

  try {
    const { data } = await supabase
      .from("courier_check_cache")
      .select("phone, response_data, created_at")
      .in("phone", unique);

    if (data) {
      for (const row of data) {
        cache[row.phone] = {
          ...(row.response_data as Record<string, unknown>),
          _cached: true,
          _stale: Date.now() - new Date(row.created_at).getTime() >= DB_CACHE_TTL_MS,
        };
      }
    }
  } catch {
    // Silent fallback — individual calls still work.
  }
}

export async function fetchCourierCheck(phone: string): Promise<any> {
  const clean = normalizeBDPhone(phone);
  if (!clean) return null;

  if (cache[clean]) {
    if (cache[clean]?._stale) void requestCourierCheck(clean);
    return cache[clean];
  }

  const dbPromise = hydrateCourierCacheFromDb(clean);
  const firstResult = await Promise.race([
    dbPromise.then((value) => ({ source: "db" as const, value })),
    new Promise<{ source: "timeout" }>((resolve) => {
      window.setTimeout(() => resolve({ source: "timeout" }), 120);
    }),
  ]);

  if (firstResult.source === "db") {
    if (firstResult.value) {
      if (firstResult.value?._stale) void requestCourierCheck(clean);
      return firstResult.value;
    }

    return requestCourierCheck(clean);
  }

  const networkPromise = requestCourierCheck(clean);
  const dbCached = await dbPromise;
  return dbCached || networkPromise;
}

export function getCourierCacheEntry(phone: string) {
  const clean = normalizeBDPhone(phone);
  return clean ? (cache[clean] || null) : null;
}

export function clearCourierCache(phone: string) {
  const clean = normalizeBDPhone(phone);
  if (clean) delete cache[clean];
}
