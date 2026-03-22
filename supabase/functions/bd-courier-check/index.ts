import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Permanent cache — no TTL, once fetched never expires
const API_TIMEOUT_MS = 6000;
const CACHE_RACE_MS = 150; // max ms to wait for DB cache before firing API
const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);
const bdcourierKey = Deno.env.get("BDCOURIER_API_KEY");

async function fetchFromApi(phone: string, signal?: AbortSignal): Promise<{ data: any; ok: boolean }> {
  const resp = await fetch("https://api.bdcourier.com/courier-check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bdcourierKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone }),
    signal,
  });
  const data = await resp.json();
  return { data, ok: resp.ok };
}

async function fetchFromCache(phone: string): Promise<any | null> {
  const { data: cached } = await supabase
    .from("courier_check_cache")
    .select("response_data")
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();
  return cached?.response_data ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { phone, action } = body;

    if (!bdcourierKey) {
      return new Response(JSON.stringify({ error: "BDCOURIER_API_KEY not configured" }), {
        status: 500, headers: JSON_HEADERS,
      });
    }

    if (action === "check-connection") {
      const resp = await fetch("https://api.bdcourier.com/check-connection", {
        headers: { Authorization: `Bearer ${bdcourierKey}` },
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), { status: resp.status, headers: JSON_HEADERS });
    }

    if (action === "my-plan") {
      const resp = await fetch("https://api.bdcourier.com/my-plan", {
        headers: { Authorization: `Bearer ${bdcourierKey}` },
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), { status: resp.status, headers: JSON_HEADERS });
    }

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400, headers: JSON_HEADERS,
      });
    }

    // RACE: DB cache vs API — fire both in parallel
    // If cache resolves within CACHE_RACE_MS, use it and skip API
    // Otherwise wait for API result
    const abortCtrl = new AbortController();

    const cachePromise = fetchFromCache(phone).catch(() => null);
    const apiPromise = fetchFromApi(phone, abortCtrl.signal).catch(() => null);

    // Wait for cache with a short timeout
    const cacheResult = await Promise.race([
      cachePromise,
      new Promise<null>((r) => setTimeout(() => r(null), CACHE_RACE_MS)),
    ]);

    if (cacheResult) {
      // Cache hit — abort API call, return cached data
      abortCtrl.abort();
      return new Response(
        JSON.stringify({ ...(cacheResult as Record<string, unknown>), _cached: true }),
        { status: 200, headers: JSON_HEADERS }
      );
    }

    // Cache miss or slow — wait for API
    const apiResult = await Promise.race([
      apiPromise,
      new Promise<null>((r) => setTimeout(() => r(null), API_TIMEOUT_MS)),
    ]);

    if (!apiResult) {
      // Both timed out — check if cache eventually returned
      const lateCacheResult = await cachePromise;
      if (lateCacheResult) {
        return new Response(
          JSON.stringify({ ...(lateCacheResult as Record<string, unknown>), _cached: true }),
          { status: 200, headers: JSON_HEADERS }
        );
      }
      return new Response(JSON.stringify({ error: "Request timeout" }), {
        status: 504, headers: JSON_HEADERS,
      });
    }

    // Save to cache in background
    if (apiResult.ok) {
      supabase
        .from("courier_check_cache")
        .upsert(
          { phone, response_data: apiResult.data, created_at: new Date().toISOString() },
          { onConflict: "phone" }
        )
        .then(() => {});
    }

    return new Response(JSON.stringify(apiResult.data), {
      status: apiResult.ok ? 200 : 400, headers: JSON_HEADERS,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
