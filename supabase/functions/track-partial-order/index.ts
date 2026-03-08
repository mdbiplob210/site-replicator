import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { action, visitor_id, landing_page_slug } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    // Parse device info
    let deviceInfo = "Unknown Device";
    if (userAgent) {
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);
      const isTablet = /iPad|Tablet/i.test(userAgent);
      let os = "Unknown OS";
      if (/Android/i.test(userAgent)) os = "Android";
      else if (/iPhone|iPad|Mac/i.test(userAgent)) os = "iOS/macOS";
      else if (/Windows/i.test(userAgent)) os = "Windows";
      else if (/Linux/i.test(userAgent)) os = "Linux";
      let browser = "Unknown Browser";
      if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = "Chrome";
      else if (/Firefox/i.test(userAgent)) browser = "Firefox";
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";
      else if (/Edg/i.test(userAgent)) browser = "Edge";
      deviceInfo = `${isMobile ? (isTablet ? "Tablet" : "Mobile") : "Desktop"} | ${os} | ${browser}`;
    }

    // ── Save partial form data ──
    if (action === "save_partial") {
      const { customer_name, customer_phone, customer_address, product_name, product_code, quantity, unit_price, delivery_charge, discount } = body;

      // Need at least one field filled
      if (!customer_name && !customer_phone && !customer_address) {
        return new Response(
          JSON.stringify({ success: false, error: "No data to save" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalProductCost = (unit_price || 0) * (quantity || 1);
      const totalAmount = totalProductCost + (delivery_charge || 0) - (discount || 0);

      // Check if there's already a partial entry for this visitor/IP + slug
      const { data: existing } = await supabase
        .from("incomplete_orders")
        .select("id")
        .eq("block_reason", "abandoned_form")
        .eq("landing_page_slug", landing_page_slug || "")
        .or(`client_ip.eq.${clientIp}${visitor_id ? `,notes.ilike.%${visitor_id}%` : ""}`)
        .order("created_at", { ascending: false })
        .limit(1);

      if (existing && existing.length > 0) {
        // Update existing partial
        await supabase
          .from("incomplete_orders")
          .update({
            customer_name: customer_name || "",
            customer_phone: customer_phone || null,
            customer_address: customer_address || null,
            product_name: product_name || null,
            product_code: product_code || null,
            quantity: quantity || 1,
            unit_price: unit_price || 0,
            total_amount: totalAmount,
            delivery_charge: delivery_charge || 0,
            discount: discount || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing[0].id);

        return new Response(
          JSON.stringify({ success: true, updated: true, id: existing[0].id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Insert new partial
        const { data: inserted, error: insertError } = await supabase
          .from("incomplete_orders")
          .insert({
            customer_name: customer_name || "(অসম্পূর্ণ)",
            customer_phone: customer_phone || null,
            customer_address: customer_address || null,
            product_name: product_name || null,
            product_code: product_code || null,
            quantity: quantity || 1,
            unit_price: unit_price || 0,
            total_amount: totalAmount,
            delivery_charge: delivery_charge || 0,
            discount: discount || 0,
            landing_page_slug: landing_page_slug || null,
            client_ip: clientIp,
            user_agent: userAgent,
            device_info: deviceInfo,
            block_reason: "abandoned_form",
            status: "processing",
            notes: visitor_id ? `visitor:${visitor_id}` : null,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify({ success: true, created: true, id: inserted?.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Remove partial on successful order ──
    if (action === "remove_partial") {
      // Delete abandoned_form entries matching this IP + slug
      await supabase
        .from("incomplete_orders")
        .delete()
        .eq("block_reason", "abandoned_form")
        .eq("landing_page_slug", landing_page_slug || "")
        .eq("client_ip", clientIp);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[track-partial-order] Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
