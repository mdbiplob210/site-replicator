// Shared courier check fetcher — permanent in-memory cache + DB cache preloading
import { supabase } from "@/integrations/supabase/client";

const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Track which phones have been preloaded from DB (to avoid re-querying)
let preloadedFromDb = false;

/**
 * Bulk preload cached courier data from DB into in-memory cache.
 * Call once when orders page loads — avoids individual edge function calls.
 */
export async function preloadCourierCache(phones: string[]): Promise<void> {
  const cleaned = phones
    .map((p) => p?.replace(/\D/g, "") || "")
    .filter((p) => p.length >= 11 && !cache[p]); // Only phones not already in memory

  if (cleaned.length === 0) return;

  // Remove duplicates
  const unique = [...new Set(cleaned)];

  try {
    const { data } = await supabase
      .from("courier_check_cache")
      .select("phone, response_data, created_at")
      .in("phone", unique);

    if (data) {
      const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
      for (const row of data) {
        const age = Date.now() - new Date(row.created_at).getTime();
        if (age < ONE_WEEK) {
          // Fresh cache — store in memory, no edge function needed
          cache[row.phone] = { ...(row.response_data as Record<string, unknown>), _cached: true };
        }
      }
    }
    preloadedFromDb = true;
  } catch {
    // Silently fail — individual calls will still work
  }
}

export async function fetchCourierCheck(phone: string): Promise<any> {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 11) return null;

  // In-memory cache hit (permanent)
  if (cache[clean]) return cache[clean];

  // Deduplicate concurrent requests for same phone
  if (inflight[clean]) return inflight[clean];

  const p = (async () => {
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/bd-courier-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ phone: clean }),
      });
      if (!resp.ok) throw new Error("API error");
      const data = await resp.json();
      cache[clean] = data;
      return data;
    } catch {
      return null;
    } finally {
      delete inflight[clean];
    }
  })();

  inflight[clean] = p;
  return p;
}

export function getCourierCacheEntry(phone: string) {
  const clean = phone.replace(/\D/g, "");
  return cache[clean] || null;
}

export function clearCourierCache(phone: string) {
  const clean = phone.replace(/\D/g, "");
  delete cache[clean];
}
