import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { visitor_id, customer_phone, page_slug } = await req.json();

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Clean up stale visitors (older than 90 seconds)
    await supabase
      .from("live_visitors")
      .delete()
      .lt("last_seen_at", new Date(Date.now() - 90 * 1000).toISOString());

    // Upsert current visitor by visitor_id or IP
    const lookupKey = visitor_id || clientIp;
    const { data: existing } = await supabase
      .from("live_visitors")
      .select("id")
      .or(`visitor_id.eq.${lookupKey},client_ip.eq.${clientIp}`)
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("live_visitors")
        .update({
          last_seen_at: new Date().toISOString(),
          customer_phone: customer_phone || null,
          page_slug: page_slug || null,
          client_ip: clientIp,
          visitor_id: visitor_id || null,
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("live_visitors").insert({
        client_ip: clientIp,
        visitor_id: visitor_id || null,
        customer_phone: customer_phone || null,
        page_slug: page_slug || null,
        last_seen_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("visitor-heartbeat error:", error);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
