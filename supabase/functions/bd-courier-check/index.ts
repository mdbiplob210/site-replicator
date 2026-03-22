import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CACHE_TTL_DAYS = 7;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {

    const body = await req.json();
    const { phone, action } = body;

    const bdcourierKey = Deno.env.get("BDCOURIER_API_KEY");
    if (!bdcourierKey) {
      return new Response(JSON.stringify({ error: "BDCOURIER_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check-connection") {
      const resp = await fetch("https://api.bdcourier.com/check-connection", {
        headers: { Authorization: `Bearer ${bdcourierKey}` },
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "my-plan") {
      const resp = await fetch("https://api.bdcourier.com/my-plan", {
        headers: { Authorization: `Bearer ${bdcourierKey}` },
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ Cache check: look for cached result within TTL ═══
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const ttlCutoff = new Date(Date.now() - CACHE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data: cached } = await supabase
      .from("courier_check_cache")
      .select("response_data, created_at")
      .eq("phone", phone)
      .gte("created_at", ttlCutoff)
      .limit(1)
      .single();

    if (cached) {
      console.log(`[bd-courier-check] Cache HIT for ${phone}`);
      return new Response(JSON.stringify({ ...cached.response_data, _cached: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══ Cache MISS — call BDCourier API ═══
    console.log(`[bd-courier-check] Cache MISS for ${phone}, calling API`);
    const resp = await fetch("https://api.bdcourier.com/courier-check", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bdcourierKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ phone }),
    });

    const data = await resp.json();

    // Save to cache (upsert — update if phone exists with expired data)
    if (resp.ok) {
      await supabase
        .from("courier_check_cache")
        .upsert(
          { phone, response_data: data, created_at: new Date().toISOString() },
          { onConflict: "phone" }
        );
    }

    // Cleanup expired entries in background (don't await)
    supabase
      .from("courier_check_cache")
      .delete()
      .lt("created_at", ttlCutoff)
      .then(() => {});

    return new Response(JSON.stringify(data), {
      status: resp.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[bd-courier-check] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
