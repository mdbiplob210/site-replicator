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
    const body = await req.json();
    const {
      pixel_id,
      event_name,
      event_id,
      event_url,
      user_agent,
      fbp,
      fbc,
      custom_data = {},
    } = body;

    if (!pixel_id || !event_name) {
      return new Response(
        JSON.stringify({ error: "pixel_id and event_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate pixel_id against server-side allowlist
    const allowedPixelId = Deno.env.get("FB_PIXEL_ID");
    if (allowedPixelId && pixel_id !== allowedPixelId) {
      return new Response(
        JSON.stringify({ error: "Invalid pixel_id" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = Deno.env.get("FB_ACCESS_TOKEN");
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "FB_ACCESS_TOKEN not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Conversions API event
    const eventTime = Math.floor(Date.now() / 1000);

    const userData: Record<string, string> = {};
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    if (user_agent) userData.client_user_agent = user_agent;
    // Get client IP from request headers
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") || "";
    if (clientIp) userData.client_ip_address = clientIp;

    const eventData: Record<string, any> = {
      event_name: event_name,
      event_time: eventTime,
      action_source: "website",
      user_data: userData,
    };

    if (event_id) eventData.event_id = event_id; // For deduplication with browser pixel
    if (event_url) eventData.event_source_url = event_url;

    // Custom data
    if (Object.keys(custom_data).length > 0) {
      const cd: Record<string, any> = {};
      if (custom_data.value) cd.value = custom_data.value;
      if (custom_data.currency) cd.currency = custom_data.currency;
      if (custom_data.content_name) cd.content_name = custom_data.content_name;
      if (custom_data.content_ids && custom_data.content_ids.length > 0) cd.content_ids = custom_data.content_ids;
      if (custom_data.content_type) cd.content_type = custom_data.content_type;
      if (custom_data.content_category) cd.content_category = custom_data.content_category;
      if (custom_data.num_items) cd.num_items = custom_data.num_items;
      if (custom_data.order_id) cd.order_id = custom_data.order_id;

      // Add custom properties
      const customProps: Record<string, any> = {};
      for (const key of Object.keys(custom_data)) {
        if (!["value","currency","content_name","content_ids","content_type","content_category","num_items","order_id","event_id"].includes(key)) {
          customProps[key] = custom_data[key];
        }
      }
      if (Object.keys(customProps).length > 0) {
        cd.custom_properties = customProps;
      }

      eventData.custom_data = cd;
    }

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v21.0/${pixel_id}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: [eventData],
          access_token: accessToken,
        }),
      }
    );

    const fbResult = await fbResponse.json();

    if (!fbResponse.ok) {
      console.error("[CAPI] Error:", JSON.stringify(fbResult));
      return new Response(
        JSON.stringify({ error: "CAPI error", details: fbResult }),
        { status: fbResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CAPI] Success:", event_name, "eventID:", event_id, "response:", JSON.stringify(fbResult));

    return new Response(
      JSON.stringify({ success: true, events_received: fbResult.events_received }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CAPI] Exception:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
