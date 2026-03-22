import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL_DAYS = 7;
const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

// Pre-initialize supabase client at module level (reused across requests)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);
const bdcourierKey = Deno.env.get("BDCOURIER_API_KEY");

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

    // Cache check — only fetch response_data column for speed
    const ttlCutoff = new Date(Date.now() - CACHE_TTL_DAYS * 86400000).toISOString();

    const { data: cached } = await supabase
      .from("courier_check_cache")
      .select("response_data")
      .eq("phone", phone)
      .gte("created_at", ttlCutoff)
      .limit(1)
      .maybeSingle();

    if (cached) {
      return new Response(JSON.stringify({ ...cached.response_data as Record<string, unknown>, _cached: true }), {
        status: 200, headers: JSON_HEADERS,
      });
    }

    // Cache MISS — call BDCourier API
    const resp = await fetch("https://api.bdcourier.com/courier-check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bdcourierKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await resp.json();

    // Save to cache in background (don't block response)
    if (resp.ok) {
      supabase
        .from("courier_check_cache")
        .upsert(
          { phone, response_data: data, created_at: new Date().toISOString() },
          { onConflict: "phone" }
        )
        .then(() => {});
    }

    return new Response(JSON.stringify(data), {
      status: resp.status, headers: JSON_HEADERS,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
});
