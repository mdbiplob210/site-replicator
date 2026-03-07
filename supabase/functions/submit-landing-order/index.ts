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
      customer_name,
      customer_phone,
      customer_address,
      product_name,
      product_code,
      quantity = 1,
      unit_price = 0,
      delivery_charge = 0,
      discount = 0,
      notes,
      landing_page_slug,
    } = body;

    if (!customer_name || !customer_phone) {
      return new Response(
        JSON.stringify({ error: "নাম ও ফোন নম্বর আবশ্যক" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Extract client info
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("cf-connecting-ip") ||
                     req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    // Parse device info from user agent
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

    const totalProductCost = unit_price * quantity;
    const totalAmount = totalProductCost + delivery_charge - discount;

    // Check 24-hour IP block: has this IP placed an order in last 24 hours?
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: recentOrders } = await supabase
      .from("orders")
      .select("id, order_number, created_at, customer_phone")
      .eq("client_ip", clientIp)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    // Also check by phone number in last 24h
    const { data: recentPhoneOrders } = await supabase
      .from("orders")
      .select("id, order_number, created_at, client_ip")
      .eq("customer_phone", customer_phone)
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    const isIpBlocked = recentOrders && recentOrders.length > 0;
    const isPhoneBlocked = recentPhoneOrders && recentPhoneOrders.length > 0;

    if (isIpBlocked || isPhoneBlocked) {
      // Store as incomplete order
      let blockReason = "";
      if (isIpBlocked && isPhoneBlocked) {
        blockReason = `IP ও ফোন নম্বর ২৪ ঘণ্টার মধ্যে আগেই অর্ডার করেছে (IP: ${clientIp}, Phone: ${customer_phone})`;
      } else if (isIpBlocked) {
        blockReason = `একই IP (${clientIp}) থেকে ২৪ ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
      } else {
        blockReason = `একই ফোন নম্বর (${customer_phone}) থেকে ২৪ ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
      }

      await supabase.from("incomplete_orders").insert({
        customer_name,
        customer_phone,
        customer_address: customer_address || null,
        product_name: product_name || null,
        product_code: product_code || null,
        quantity,
        unit_price,
        total_amount: totalAmount,
        delivery_charge,
        discount,
        notes: notes || null,
        landing_page_slug: landing_page_slug || null,
        client_ip: clientIp,
        user_agent: userAgent,
        device_info: deviceInfo,
        block_reason: blockReason,
        status: "processing",
      });

      return new Response(
        JSON.stringify({
          success: false,
          blocked: true,
          error: "আপনি ইতিমধ্যে একটি অর্ডার করেছেন। ২৪ ঘণ্টা পর আবার অর্ডার করতে পারবেন।",
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate order number
    const orderNumber = `LP-${Date.now().toString(36).toUpperCase()}`;

    // Insert order with tracking info
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_name,
        customer_phone,
        customer_address: customer_address || null,
        product_cost: totalProductCost,
        delivery_charge,
        discount,
        total_amount: totalAmount,
        notes: notes
          ? `[LP: ${landing_page_slug || "unknown"}] ${notes}`
          : `[LP: ${landing_page_slug || "unknown"}]`,
        status: "processing",
        client_ip: clientIp,
        user_agent: userAgent,
        device_info: deviceInfo,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order item
    if (product_name && order) {
      await supabase.from("order_items").insert({
        order_id: order.id,
        product_name,
        product_code: product_code || "",
        quantity,
        unit_price,
        total_price: totalProductCost,
      });
    }

    // Track conversion event
    if (landing_page_slug) {
      const { data: lp } = await supabase
        .from("landing_pages")
        .select("id")
        .eq("slug", landing_page_slug)
        .single();

      if (lp) {
        await supabase.from("landing_page_events").insert({
          landing_page_id: lp.id,
          event_type: "conversion",
          event_name: "Order",
          visitor_id: body.visitor_id || null,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_number: orderNumber, order_id: order.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
