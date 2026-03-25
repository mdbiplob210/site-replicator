import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function parseUA(ua: string) {
  let browser = "Unknown", os = "Unknown";
  if (/Chrome\//.test(ua) && !/Edg/.test(ua)) browser = "Chrome";
  else if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  else if (/Opera|OPR/.test(ua)) browser = "Opera";

  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return { browser, os };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle both application/json and text/plain (sendBeacon uses text/plain to avoid CORS preflight)
    const contentType = req.headers.get("content-type") || "";
    let body: any;
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      body = JSON.parse(text);
    }
    const {
      slug, event_type, event_name, visitor_id, referrer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      scroll_depth, device_type, screen_width, screen_height,
      session_id, time_on_page,
      click_x, click_y, click_element, page_height
    } = body;

    if (!slug || !event_type) {
      return new Response(JSON.stringify({ error: "slug and event_type required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: page, error: pageError } = await supabase
      .from("landing_pages")
      .select("id")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (pageError || !page) {
      return new Response(JSON.stringify({ error: "Page not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userAgent = req.headers.get("user-agent") || "";
    const { browser, os } = parseUA(userAgent);

    // Try to get country from CF headers
    const country = req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || null;
    const city = req.headers.get("x-vercel-ip-city") || null;

    const { error } = await supabase.from("landing_page_events").insert({
      landing_page_id: page.id,
      event_type,
      event_name: event_name || null,
      visitor_id: visitor_id || null,
      referrer: referrer || null,
      user_agent: userAgent || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_content: utm_content || null,
      utm_term: utm_term || null,
      scroll_depth: scroll_depth != null ? Math.min(Math.max(scroll_depth, 0), 100) : null,
      device_type: device_type || null,
      screen_width: screen_width || null,
      screen_height: screen_height || null,
      browser: browser !== "Unknown" ? browser : null,
      os: os !== "Unknown" ? os : null,
      country: country,
      city: city,
      session_id: session_id || null,
      time_on_page: time_on_page || null,
      click_x: click_x != null ? click_x : null,
      click_y: click_y != null ? click_y : null,
      click_element: click_element || null,
      page_height: page_height || null,
    });

    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[track-landing-event] Error:", e.message);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
