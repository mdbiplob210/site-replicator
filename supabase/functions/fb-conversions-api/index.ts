import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// SHA-256 hash for PII data (Facebook requires hashed user data)
async function hashSHA256(value: string): Promise<string> {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getSettingValue(supabaseAdmin: any, key: string, envFallback?: string): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (data?.value) return data.value;
  } catch (_) {}
  return envFallback || "";
}

function isInvalidAccessTokenError(result: any): boolean {
  const errorCode = Number(result?.error?.code || 0);
  const message = String(result?.error?.message || "");
  return errorCode === 190 || /invalid oauth access token/i.test(message);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const contentType = req.headers.get("content-type") || "";
    let body: any;
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }
    const {
      pixel_id,
      event_name,
      event_id,
      event_url,
      user_agent,
      fbp,
      fbc,
      custom_data = {},
      landing_page_slug,
      // User data for advanced matching
      user_phone,
      user_email,
      user_external_id,
      user_fb_login_id,
      user_fn,
      user_ln,
      user_ct,
      user_st,
      user_zp,
      user_country,
    } = body;

    if (!pixel_id || !event_name) {
      return new Response(
        JSON.stringify({ error: "pixel_id and event_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let accessToken = "";

    // If landing_page_slug is provided, look up per-page access token
    if (landing_page_slug) {
      const { data: lpData } = await supabaseAdmin
        .from("landing_pages")
        .select("fb_pixel_id, fb_access_token")
        .eq("slug", landing_page_slug)
        .eq("is_active", true)
        .maybeSingle();

      if (lpData?.fb_access_token) {
        // Use per-page access token — validate pixel matches
        if (lpData.fb_pixel_id && lpData.fb_pixel_id === pixel_id) {
          accessToken = lpData.fb_access_token;
        }
      }
    }

    // Fallback to global access token if no per-page token found
    if (!accessToken) {
      const allowedPixelId = await getSettingValue(supabaseAdmin, "fb_pixel_id", Deno.env.get("FB_PIXEL_ID"));
      if (allowedPixelId && pixel_id !== allowedPixelId) {
        return new Response(
          JSON.stringify({ error: "Invalid pixel_id" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      accessToken = await getSettingValue(supabaseAdmin, "fb_access_token", Deno.env.get("FB_ACCESS_TOKEN"));
    }

    if (!accessToken) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "FB_ACCESS_TOKEN not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build Conversions API event
    const eventTime = Math.floor(Date.now() / 1000);

    const userData: Record<string, string> = {};
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    if (user_agent) userData.client_user_agent = user_agent;
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") || "";
    if (clientIp) userData.client_ip_address = clientIp;

    // External ID (not hashed, sent as-is per FB docs)
    if (user_external_id) userData.external_id = user_external_id;

    // Facebook Login ID (not hashed)
    if (user_fb_login_id) userData.fb_login_id = user_fb_login_id;

    // Hashed PII fields
    if (user_phone) userData.ph = await hashSHA256(user_phone.replace(/[^0-9]/g, ""));
    if (user_email) userData.em = await hashSHA256(user_email);
    if (user_fn) userData.fn = await hashSHA256(user_fn);
    if (user_ln) userData.ln = await hashSHA256(user_ln);
    if (user_ct) userData.ct = await hashSHA256(user_ct);
    if (user_st) userData.st = await hashSHA256(user_st);
    if (user_zp) userData.zp = await hashSHA256(user_zp);
    if (user_country) userData.country = await hashSHA256(user_country);

    const eventData: Record<string, any> = {
      event_name: event_name,
      event_time: eventTime,
      action_source: "website",
      user_data: userData,
    };

    if (event_id) eventData.event_id = event_id;
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

      if (isInvalidAccessTokenError(fbResult)) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "invalid_access_token" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to send conversion event" }),
        { status: fbResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[CAPI] Success:", event_name, "eventID:", event_id, "pixel:", pixel_id, "slug:", landing_page_slug || "main", "response:", JSON.stringify(fbResult));

    return new Response(
      JSON.stringify({ success: true, events_received: fbResult.events_received }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[CAPI] Exception:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
