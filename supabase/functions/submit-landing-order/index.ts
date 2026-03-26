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

async function hashSHA256(value: string): Promise<string> {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function normalizeAsciiDigits(value: string): string {
  const bengaliDigitMap: Record<string, string> = {
    "০": "0",
    "১": "1",
    "২": "2",
    "৩": "3",
    "৪": "4",
    "৫": "5",
    "৬": "6",
    "৭": "7",
    "৮": "8",
    "৯": "9",
  };

  return String(value || "")
    .split("")
    .map((char) => bengaliDigitMap[char] || char)
    .join("");
}

async function getSettingValue(supabase: any, key: string, envFallback?: string): Promise<string> {
  try {
    const { data } = await supabase
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

function normalizeMetaPhone(phone: string): string {
  const digits = normalizeAsciiDigits(phone).replace(/[^0-9]/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  if (digits.length === 10) return `880${digits}`;
  return digits;
}

function splitCustomerName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" ") || "",
  };
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
      event_id,
      event_url,
      fbp,
      fbc,
    } = body;
    const referer = req.headers.get("referer") || "";
    const inferredSlug = referer.match(/\/lp\/([^/?#]+)/)?.[1] || null;
    const landingSlug = landing_page_slug || inferredSlug;
    const purchaseEventId = event_id || `srv_${Date.now()}`;
    const purchaseEventUrl = event_url || referer || "";

    if (!customer_name || !customer_phone) {
      return new Response(
        JSON.stringify({ error: "নাম ও ফোন নম্বর আবশ্যক" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate phone number (server-side) — allow 11-15 digits
    const normalizedCustomerPhone = normalizeAsciiDigits(customer_phone);
    const cleanedPhone = normalizedCustomerPhone.replace(/^\+?880/, "0").replace(/[^0-9]/g, "");
    if (!/^\d{11,15}$/.test(cleanedPhone)) {
      return new Response(
        JSON.stringify({ error: "অনুগ্রহ করে সঠিক মোবাইল নম্বর দিন (কমপক্ষে ১১ সংখ্যা)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const customerPhone = cleanedPhone;

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
      .eq("phone_number", customerPhone)
      .limit(1);

    if (phoneBlocked && phoneBlocked.length > 0) {
      // Upsert: find existing incomplete order by IP+slug first, then phone
      const incompleteData = {
        customer_name, customer_phone: customerPhone, customer_address: customer_address || null,
        product_name: product_name || null, product_code: product_code || null,
        quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
         notes: notes || null, landing_page_slug: landingSlug || null,
        client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
        block_reason: `স্থায়ীভাবে ব্লক করা নম্বর: ${customerPhone}`,
        status: "processing",
        updated_at: new Date().toISOString(),
      };

      const existingId = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customerPhone);
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
          customer_name, customer_phone: customerPhone, customer_address: customer_address || null,
          product_name: product_name || null, product_code: product_code || null,
          quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
           notes: notes || null, landing_page_slug: landingSlug || null,
          client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
          block_reason: `স্থায়ীভাবে ব্লক করা IP: ${clientIp}`,
          status: "processing", updated_at: new Date().toISOString(),
        };
        const existingId = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customerPhone);
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
        .eq("customer_phone", customerPhone)
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
        if (isPhoneBlocked) blockReason = `একই ফোন (${customerPhone}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
        else if (isIpBlocked) blockReason = `একই IP (${clientIp}) থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;
        else blockReason = `একই ডিভাইস থেকে ${hours}ঘণ্টার মধ্যে আগেই অর্ডার হয়েছে`;

        const incData2 = {
          customer_name, customer_phone: customerPhone, customer_address: customer_address || null,
          product_name: product_name || null, product_code: product_code || null,
          quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
           notes: notes || null, landing_page_slug: landingSlug || null,
          client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
          block_reason: blockReason, status: "processing", updated_at: new Date().toISOString(),
        };
        const existingId2 = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customerPhone);
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
        .eq("customer_phone", customerPhone);

      if (customerOrders && customerOrders.length >= 3) {
        const delivered = customerOrders.filter(o => o.status === "delivered").length;
        const ratio = Math.round((delivered / customerOrders.length) * 100);
        if (ratio < minDeliveryRatio) {
          const incData3 = {
            customer_name, customer_phone: customerPhone, customer_address: customer_address || null,
            product_name: product_name || null, product_code: product_code || null,
            quantity, unit_price, total_amount: totalAmount, delivery_charge, discount,
             notes: notes || null, landing_page_slug: landingSlug || null,
            client_ip: clientIp, user_agent: userAgent, device_info: deviceInfo,
            block_reason: `ডেলিভারি রেশিও কম (${ratio}% < ${minDeliveryRatio}%)`,
            status: "processing", updated_at: new Date().toISOString(),
          };
          const existingId3 = await findExistingIncomplete(supabase, clientIp, landing_page_slug, customerPhone);
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

    // ═══ Duplicate order check — same phone within 60 seconds ═══
    const sixtySecsAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentDup } = await supabase
      .from("orders")
      .select("id, order_number")
      .eq("customer_phone", customerPhone)
      .gte("created_at", sixtySecsAgo)
      .limit(1);

    if (recentDup && recentDup.length > 0) {
      console.log(`[submit-landing-order] Duplicate blocked: phone=${customerPhone}, existing order=${recentDup[0].order_number}`);
      return new Response(
        JSON.stringify({ success: true, order_number: recentDup[0].order_number, duplicate: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ═══ All checks passed - create order ═══
    // order_number is auto-assigned by DB trigger (assign_order_number_on_insert)
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        order_number: "0",
        customer_name,
        customer_phone: customerPhone,
        customer_address: customer_address || null,
        product_cost: totalProductCost,
        delivery_charge,
        discount,
        total_amount: totalAmount,
        notes: null,
        status: "processing",
        source: "landing_page",
        client_ip: clientIp,
        user_agent: userAgent,
        device_info: deviceInfo,
      })
      .select("id, order_number")
      .single();

    const orderNumber = order?.order_number || "0";

    if (orderError) throw orderError;

    const { data: recentOrders, error: recentOrdersError } = await supabase
      .from("orders")
      .select("id, order_number, created_at")
      .eq("customer_phone", customerPhone)
      .gte("created_at", sixtySecsAgo)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(5);

    if (recentOrdersError) {
      console.error("[submit-landing-order] recent orders check error:", recentOrdersError.message);
    }

    const canonicalOrder = recentOrders?.[0];
    if (canonicalOrder && canonicalOrder.id !== order.id) {
      await supabase
        .from("orders")
        .delete()
        .eq("id", order.id);

      console.log(
        `[submit-landing-order] Race duplicate cleaned: phone=${customerPhone}, kept=${canonicalOrder.order_number}, removed=${orderNumber}`,
      );

      return new Response(
        JSON.stringify({
          success: true,
          order_number: canonicalOrder.order_number,
          order_id: canonicalOrder.id,
          duplicate: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (product_name && order) {
      // Look up product_id by product_code for stock deduction
      let productId = null;
      if (product_code) {
        const { data: productData } = await supabase
          .from("products")
          .select("id")
          .eq("product_code", product_code)
          .limit(1)
          .single();
        if (productData) productId = productData.id;
      }

      await supabase.from("order_items").insert({
        order_id: order.id,
        product_name,
        product_code: product_code || "",
        product_id: productId,
        quantity,
        unit_price,
        total_price: totalProductCost,
      });
    }

    // ═══ Delete incomplete/partial orders for this customer ═══
    // By visitor_id
    if (body.visitor_id) {
      await supabase
        .from("incomplete_orders")
        .delete()
        .eq("block_reason", "abandoned_form")
        .ilike("notes", `%visitor:${body.visitor_id}%`);
    }
    // By phone
    if (customerPhone) {
      await supabase
        .from("incomplete_orders")
        .delete()
        .eq("customer_phone", customerPhone)
        .eq("block_reason", "abandoned_form");
    }
    // By IP + slug
    if (clientIp !== "unknown" && landingSlug) {
      await supabase
        .from("incomplete_orders")
        .delete()
        .eq("client_ip", clientIp)
        .eq("block_reason", "abandoned_form")
        .eq("landing_page_slug", landingSlug);
    }

    // ═══ Track landing page conversion & CAPI ═══
    let purchaseTracked = false;
    let purchaseTrackingError: string | null = null;

    if (landingSlug) {
      const { data: lp } = await supabase
        .from("landing_pages")
        .select("id, fb_pixel_id, fb_access_token")
        .eq("slug", landingSlug)
        .single();
      if (lp) {
        await supabase.from("landing_page_events").insert({
          landing_page_id: lp.id,
          event_type: "conversion",
          event_name: "Order",
          visitor_id: body.visitor_id || null,
          session_id: body.session_id || null,
          device_type: body.device_type || null,
        });

        const pixelId = lp.fb_pixel_id || await getSettingValue(supabase, "fb_pixel_id", Deno.env.get("FB_PIXEL_ID"));
        const accessToken = lp.fb_access_token || await getSettingValue(supabase, "fb_access_token", Deno.env.get("FB_ACCESS_TOKEN"));

        if (pixelId && accessToken) {
          try {
            const eventTime = Math.floor(Date.now() / 1000);
            const normalizedPhone = normalizeMetaPhone(customerPhone);
            const { firstName, lastName } = splitCustomerName(customer_name);
            const capiEvent = {
              event_name: "Purchase",
              event_time: eventTime,
              action_source: "website",
               event_id: purchaseEventId,
               event_source_url: purchaseEventUrl || `https://${req.headers.get("host") || "site"}/lp/${landingSlug}`,
              user_data: {
                client_ip_address: clientIp !== "unknown" ? clientIp : undefined,
                client_user_agent: userAgent || undefined,
                fbp: fbp || undefined,
                fbc: fbc || undefined,
                external_id: order.id,
                ph: normalizedPhone ? await hashSHA256(normalizedPhone) : undefined,
                fn: firstName ? await hashSHA256(firstName) : undefined,
                ln: lastName ? await hashSHA256(lastName) : undefined,
              },
              custom_data: {
                value: totalProductCost,
                currency: "BDT",
                content_name: product_name || "",
                content_ids: product_code ? [product_code] : [],
                content_type: "product",
                num_items: quantity,
                order_id: orderNumber,
              },
            };

            const capiResponse = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data: [capiEvent],
                access_token: accessToken,
              }),
            });

            const capiResult = await capiResponse.json();

            if (!capiResponse.ok) {
              if (isInvalidAccessTokenError(capiResult)) {
                purchaseTrackingError = "invalid_access_token";
                console.warn("[submit-landing-order] CAPI skipped due to invalid access token");
              } else {
                throw new Error(JSON.stringify(capiResult));
              }
            } else {
              purchaseTracked = true;
              console.log("[submit-landing-order] CAPI Purchase sent for pixel:", pixelId, "order:", orderNumber, "response:", JSON.stringify(capiResult));
            }
          } catch (capiErr) {
            purchaseTrackingError = capiErr.message;
            console.error("[submit-landing-order] CAPI error:", capiErr.message);
          }
        } else {
           purchaseTrackingError = "pixel_or_token_missing";
           console.warn("[submit-landing-order] CAPI skipped: pixel or access token missing for", landingSlug);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_number: orderNumber,
        order_id: order.id,
        purchase_tracked: purchaseTracked,
        purchase_tracking_error: purchaseTrackingError,
      }),
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
