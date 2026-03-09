import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getDurationHours(duration: string): number {
  const map: Record<string, number> = { "1h": 1, "6h": 6, "12h": 12, "24h": 24 };
  return map[duration] || 24;
}

// Find existing incomplete order by IP+slug first, then by phone — prevents duplicates when phone changes
async function findExistingIncomplete(supabase: any, clientIp: string, slug: string | null, phone: string): Promise<string | null> {
  // 1. Try matching by IP + slug (same session, even if phone changed)
  if (clientIp && clientIp !== "unknown") {
    const { data: byIp } = await supabase
      .from("incomplete_orders")
      .select("id")
      .eq("client_ip", clientIp)
      .eq("status", "processing")
      .order("updated_at", { ascending: false })
      .limit(1);
    if (byIp && byIp.length > 0) return byIp[0].id;
  }
  // 2. Fallback: match by phone
  if (phone) {
    const { data: byPhone } = await supabase
      .from("incomplete_orders")
      .select("id")
      .eq("customer_phone", phone)
      .eq("status", "processing")
      .limit(1);
    if (byPhone && byPhone.length > 0) return byPhone[0].id;
  }
  return null;
}

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
      device_fingerprint,
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

    let deviceInfo = "Unknown Device";
    if (userAgent) {
      const isMobile = /Mobile|Android|iPhone|iPod/i.test(userAgent);
      const isTablet = /iPad|Tablet/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent));
      const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop";

      let os = "Unknown OS";
      if (/Android/i.test(userAgent)) {
        const ver = userAgent.match(/Android\s([\d.]+)/)?.[1] || "";
        os = `Android ${ver}`.trim();
      } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
        const ver = userAgent.match(/OS\s([\d_]+)/)?.[1]?.replace(/_/g, ".") || "";
        os = `iOS ${ver}`.trim();
      } else if (/Mac OS X/i.test(userAgent)) {
        const ver = userAgent.match(/Mac OS X\s([\d_.]+)/)?.[1]?.replace(/_/g, ".") || "";
        os = `macOS ${ver}`.trim();
      } else if (/Windows/i.test(userAgent)) {
        const ver = userAgent.match(/Windows NT\s([\d.]+)/)?.[1] || "";
        const winMap: Record<string, string> = { "10.0": "10/11", "6.3": "8.1", "6.2": "8", "6.1": "7" };
        os = `Windows ${winMap[ver] || ver}`.trim();
      } else if (/Linux/i.test(userAgent)) os = "Linux";
      else if (/CrOS/i.test(userAgent)) os = "Chrome OS";

      let browser = "Unknown Browser";
      if (/Edg\//i.test(userAgent)) browser = "Edge";
      else if (/OPR|Opera/i.test(userAgent)) browser = "Opera";
      else if (/SamsungBrowser/i.test(userAgent)) browser = "Samsung Browser";
      else if (/UCBrowser/i.test(userAgent)) browser = "UC Browser";
      else if (/Firefox/i.test(userAgent)) browser = "Firefox";
      else if (/Chrome/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = "Chrome";
      else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = "Safari";

      // Device model detection
      let model = "";
      if (/iPhone/i.test(userAgent)) model = "iPhone";
      else if (/iPad/i.test(userAgent)) model = "iPad";
      else if (/SM-[A-Z]\d+/i.test(userAgent)) model = userAgent.match(/SM-[A-Z]\d+/i)?.[0] || "Samsung";
      else if (/Pixel/i.test(userAgent)) model = "Google Pixel";
      else if (/Xiaomi|Redmi|POCO/i.test(userAgent)) model = userAgent.match(/Xiaomi|Redmi\s?\w+|POCO\s?\w+/i)?.[0] || "Xiaomi";
      else if (/OPPO|CPH/i.test(userAgent)) model = "OPPO";
      else if (/vivo/i.test(userAgent)) model = "Vivo";
      else if (/realme/i.test(userAgent)) model = "Realme";
      else if (/OnePlus/i.test(userAgent)) model = "OnePlus";

      const parts = [device, os, browser];
      if (model) parts.push(model);
      deviceInfo = parts.join(" | ");
    }

    const totalProductCost = unit_price * quantity;
    const totalAmount = totalProductCost + delivery_charge - discount;

    // ═══ Load fraud settings ═══
    const { data: fraudSettings } = await supabase
      .from("fraud_settings")
      .select("*")
      .limit(1)
      .single();

    const protectionEnabled = fraudSettings?.protection_enabled || false;
    const blockDuration = fraudSettings?.repeat_block_duration || "24h";
    const deviceFingerprintEnabled = fraudSettings?.device_fingerprint_enabled || false;
    const deliveryRatioEnabled = fraudSettings?.delivery_ratio_enabled || false;
    const minDeliveryRatio = fraudSettings?.min_delivery_ratio || 0;
    const blockPopupMessage = fraudSettings?.block_popup_message || "আপনি ইতিমধ্যে একটি অর্ডার করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।";

    // ═══ Check permanent phone block ═══
    const { data: phoneBlocked } = await supabase
      .from("blocked_phones")
      .select("id")
      .eq("phone_number", customer_phone)
      .limit(1);

    if (phoneBlocked && phoneBlocked.length > 0) {
      // Upsert: find existing incomplete order by IP+slug first, then phone
      const incompleteData = {
        customer_name, customer_phone, customer_address: customer_address || null,
        product_name: product_name || null, product_code: product_code || null,
        quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
        notes: notes || null, landing_page_slug: landing_page_slug || null,
        client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
        block_reason: `স্থায়ীভাবে ব্লক করা নম্বর: ${customer_phone}`,
        status: "processing",
        updated_at: new Date().toISOString(),
      };

      const existingId = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customer_phone);
      if (existingId) {
        await supabase.from("incomplete_orders").update(incompleteData).eq("id", existingId);
      } else {
        await supabase.from("incomplete_orders").insert(incompleteData);
      }
      return new Response(
        JSON.stringify({ success: false, blocked: true, error: blockPopupMessage }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══ Check permanent IP block ═══
    if (clientIp !== "unknown") {
      const { data: ipBlocked } = await supabase
        .from("blocked_ips")
        .select("id")
        .eq("ip_address", clientIp)
        .limit(1);

      if (ipBlocked && ipBlocked.length > 0) {
        const incData = {
          customer_name, customer_phone, customer_address: customer_address || null,
          product_name: product_name || null, product_code: product_code || null,
          quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
          notes: notes || null, landing_page_slug: landing_page_slug || null,
          client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
          block_reason: `স্থায়ীভাবে ব্লক করা IP: ${clientIp}`,
          status: "processing", updated_at: new Date().toISOString(),
        };
        const existingId = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customer_phone);
        if (existingId) {
          await supabase.from("incomplete_orders").update(incData).eq("id", existingId);
        } else {
          await supabase.from("incomplete_orders").insert(incData);
        }
        return new Response(
          JSON.stringify({ success: false, blocked: true, error: blockPopupMessage }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ═══ Protection mode checks (only if enabled) ═══
    if (protectionEnabled && blockDuration !== "off") {
      const hours = getDurationHours(blockDuration);
      const windowAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

      // Check by phone
      const { data: recentPhoneOrders } = await supabase
        .from("orders")
        .select("id, order_number, created_at")
        .eq("customer_phone", customer_phone)
        .gte("created_at", windowAgo)
        .limit(1);

      // Check by IP
      const { data: recentIpOrders } = await supabase
        .from("orders")
        .select("id, order_number, created_at")
        .eq("client_ip", clientIp)
        .gte("created_at", windowAgo)
        .limit(1);

      // Check by device fingerprint
      let deviceBlocked = false;
      if (deviceFingerprintEnabled && device_fingerprint) {
        const { data: deviceOrders } = await supabase
          .from("orders")
          .select("id")
          .eq("device_info", deviceInfo)
          .gte("created_at", windowAgo)
          .limit(1);
        deviceBlocked = !!(deviceOrders && deviceOrders.length > 0);
      }

      const isPhoneBlocked = recentPhoneOrders && recentPhoneOrders.length > 0;
      const isIpBlocked = recentIpOrders && recentIpOrders.length > 0;

      if (isPhoneBlocked || isIpBlocked || deviceBlocked) {
        let blockReason = "";
        if (isPhoneBlocked) blockReason = `একই ফোন (${customer_phone}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
        else if (isIpBlocked) blockReason = `একই IP (${clientIp}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
        else blockReason = `একই ডিভাইস থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;

        const incData2 = {
          customer_name, customer_phone, customer_address: customer_address || null,
          product_name: product_name || null, product_code: product_code || null,
          quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
          notes: notes || null, landing_page_slug: landing_page_slug || null,
          client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
          block_reason: blockReason, status: "processing", updated_at: new Date().toISOString(),
        };
        const existingId2 = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customer_phone);
        if (existingId2) {
          await supabase.from("incomplete_orders").update(incData2).eq("id", existingId2);
        } else {
          await supabase.from("incomplete_orders").insert(incData2);
        }

        return new Response(
          JSON.stringify({ success: false, blocked: true, error: blockPopupMessage }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ═══ Delivery ratio check ═══
    if (protectionEnabled && deliveryRatioEnabled && minDeliveryRatio > 0) {
      const { data: customerOrders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("customer_phone", customer_phone);

      if (customerOrders && customerOrders.length >= 3) {
        const delivered = customerOrders.filter(o => o.status === "delivered").length;
        const ratio = Math.round((delivered / customerOrders.length) * 100);
        if (ratio < minDeliveryRatio) {
          const incData3 = {
            customer_name, customer_phone, customer_address: customer_address || null,
            product_name: product_name || null, product_code: product_code || null,
            quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
            notes: notes || null, landing_page_slug: landing_page_slug || null,
            client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
            block_reason: `ডেলিভারি রেশিও কম (${ratio}% < ${minDeliveryRatio}%)`,
            status: "processing", updated_at: new Date().toISOString(),
          };
          const existingId3 = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customer_phone);
          if (existingId3) {
            await supabase.from("incomplete_orders").update(incData3).eq("id", existingId3);
          } else {
            await supabase.from("incomplete_orders").insert(incData3);
          }
          return new Response(
            JSON.stringify({ success: false, blocked: true, error: blockPopupMessage }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // ═══ All checks passed - create order ═══
    const { data: seqNum } = await supabase.rpc("generate_order_number");
    const orderNumber = String(seqNum || Date.now());

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
        notes: notes ? `[LP: ${landing_page_slug || "unknown"}] ${notes}` : `[LP: ${landing_page_slug || "unknown"}]`,
        status: "processing",
        source: "landing_page",
        client_ip: clientIp,
        user_agent: userAgent,
        device_info: deviceInfo,
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

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
    console.error("[submit-landing-order] Error:", error.message);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
