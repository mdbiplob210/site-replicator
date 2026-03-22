import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_TIMEOUT_MS = 6000;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
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

    // Step 1: Check DB cache first — if fresh (< 7 days), return immediately, NO API call
    const { data: cached } = await supabase
      .from("courier_check_cache")
      .select("response_data, created_at")
      .eq("phone", phone)
      .limit(1)
      .maybeSingle();

    if (cached) {
      const cacheAge = Date.now() - new Date(cached.created_at).getTime();
      if (cacheAge < CACHE_TTL_MS) {
        // Cache is fresh — return directly, zero API calls
        return new Response(
          JSON.stringify({ ...(cached.response_data as Record<string, unknown>), _cached: true }),
          { status: 200, headers: JSON_HEADERS }
        );
      }
    }

    // Step 2: Cache miss or stale — call external API
    const abortCtrl = new AbortController();
    const apiResult = await Promise.race([
      fetchFromApi(phone, abortCtrl.signal).catch(() => null),
      new Promise<null>((r) => setTimeout(() => r(null), API_TIMEOUT_MS)),
    ]);

    if (!apiResult) {
      // API timed out — return stale cache if available
      if (cached) {
        return new Response(
          JSON.stringify({ ...(cached.response_data as Record<string, unknown>), _cached: true }),
          { status: 200, headers: JSON_HEADERS }
        );
      }
      return new Response(JSON.stringify({ error: "Request timeout" }), {
        status: 504, headers: JSON_HEADERS,
      });
    }

    // Step 3: Save fresh result to cache
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
