// Shared courier check fetcher — permanent cache, API called only once per phone
import { supabase } from "@/integrations/supabase/client";

const cache: Record<string, any> = {};
const inflight: Record<string, Promise<any>> = {};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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