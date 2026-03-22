// Shared courier check fetcher — single cache, direct fetch for speed
import { supabase } from "@/integrations/supabase/client";

const cache: Record<string, { d: any; t: number }> = {};
const TTL = 30 * 60 * 1000;
const inflight: Record<string, Promise<any>> = {};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function fetchCourierCheck(phone: string): Promise<any> {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 11) return null;

  // In-memory cache hit
  const c = cache[clean];
  if (c && Date.now() - c.t < TTL) return c.d;

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
      cache[clean] = { d: data, t: Date.now() };
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
  const c = cache[clean];
  return c && Date.now() - c.t < TTL ? c.d : null;
}

export function clearCourierCache(phone: string) {
  const clean = phone.replace(/\D/g, "");
  delete cache[clean];
}
