import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function sanitizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function pickText(value: unknown, previous: string | null | undefined, fallback: string | null = null): string | null {
  const cleaned = sanitizeText(value);
  if (cleaned) return cleaned;
  return previous ?? fallback;
}

function pickNumber(value: unknown, previous: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : previous ?? fallback;
}

async function findExistingPartial(
  supabase: ReturnType<typeof createClient>,
  clientIp: string,
  landingPageSlug: string | null,
  visitorId: string | null,
) {
  const applySlugFilter = (query: any) => {
    if (landingPageSlug) return query.eq("landing_page_slug", landingPageSlug);
    return query.is("landing_page_slug", null);
  };

  if (visitorId) {
    const visitorTag = `visitor:${visitorId}`;
    const { data, error } = await applySlugFilter(
      supabase
        .from("incomplete_orders")
        .select("*")
        .eq("block_reason", "abandoned_form")
        .ilike("notes", `%${visitorTag}%`)
        .order("updated_at", { ascending: false })
        .limit(1),
    ).maybeSingle();

    if (error) {
      console.error("[track-partial-order] Failed visitor lookup:", error.message);
    } else if (data) {
      return data;
    }
  }

  if (clientIp && clientIp !== "unknown") {
    const { data, error } = await applySlugFilter(
      supabase
        .from("incomplete_orders")
        .select("*")
        .eq("block_reason", "abandoned_form")
        .eq("client_ip", clientIp)
        .order("updated_at", { ascending: false })
        .limit(1),
    ).maybeSingle();

    if (error) {
      console.error("[track-partial-order] Failed IP lookup:", error.message);
    } else if (data) {
      return data;
    }
  }

  return null;
}

async function cleanupDuplicatePartials(
  supabase: ReturnType<typeof createClient>,
  currentId: string,
  clientIp: string,
  landingPageSlug: string | null,
  visitorId: string | null,
  customerPhone: string | null,
) {
  const applySlugFilter = (query: any) => {
    if (landingPageSlug) return query.eq("landing_page_slug", landingPageSlug);
    return query.is("landing_page_slug", null);
  };

  let query = applySlugFilter(
    supabase
      .from("incomplete_orders")
      .select("id, updated_at, created_at")
      .eq("block_reason", "abandoned_form"),
  );

  if (visitorId) {
    query = query.ilike("notes", `%visitor:${visitorId}%`);
  } else if (clientIp && clientIp !== "unknown") {
    query = query.eq("client_ip", clientIp);
  } else if (customerPhone) {
    query = query.eq("customer_phone", customerPhone);
  } else {
    return currentId;
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("[track-partial-order] Failed duplicate cleanup lookup:", error.message);
    return currentId;
  }

  if (!data || data.length <= 1) return currentId;

  const keepId = data[0].id;
  const duplicateIds = data.slice(1).map((row) => row.id);

  if (duplicateIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("incomplete_orders")
      .delete()
      .in("id", duplicateIds);

    if (deleteError) {
      console.error("[track-partial-order] Failed duplicate cleanup delete:", deleteError.message);
    }
  }

  return keepId;
}

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
      const cleanedName = sanitizeText(customer_name);
      const cleanedPhone = sanitizeText(customer_phone);
      const cleanedAddress = sanitizeText(customer_address);
      const cleanedProductName = sanitizeText(product_name).substring(0, 150);
      const cleanedProductCode = sanitizeText(product_code).substring(0, 50);
      const safeQuantity = typeof quantity === "number" && Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
      const safeUnitPrice = typeof unit_price === "number" && Number.isFinite(unit_price) ? unit_price : 0;
      const safeDeliveryCharge = typeof delivery_charge === "number" && Number.isFinite(delivery_charge) ? delivery_charge : 0;
      const safeDiscount = typeof discount === "number" && Number.isFinite(discount) ? discount : 0;

      // Only need phone number to save
      if (!cleanedPhone) {
        return new Response(
          JSON.stringify({ success: false, error: "No phone number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const totalProductCost = safeUnitPrice * safeQuantity;
      const totalAmount = totalProductCost + safeDeliveryCharge - safeDiscount;
      const visitorNote = visitor_id ? `visitor:${visitor_id}` : null;

      const existing = await findExistingPartial(
        supabase,
        clientIp,
        landing_page_slug || null,
        visitor_id || null,
      );

      if (existing) {
        // Update existing partial
        const updatePayload = {
          customer_name: pickText(cleanedName, existing.customer_name, "(অসম্পূর্ণ)"),
          customer_phone: pickText(cleanedPhone, existing.customer_phone, null),
          customer_address: pickText(cleanedAddress, existing.customer_address, null),
          product_name: pickText(cleanedProductName, existing.product_name, null),
          product_code: pickText(cleanedProductCode, existing.product_code, null),
          quantity: pickNumber(safeQuantity, existing.quantity, 1),
          unit_price: pickNumber(safeUnitPrice, existing.unit_price, 0),
          total_amount: totalAmount || existing.total_amount || 0,
          delivery_charge: pickNumber(safeDeliveryCharge, existing.delivery_charge, 0),
          discount: pickNumber(safeDiscount, existing.discount, 0),
          landing_page_slug: landing_page_slug || existing.landing_page_slug || null,
          client_ip: clientIp === "unknown" ? existing.client_ip : clientIp,
          user_agent: userAgent || existing.user_agent,
          device_info: deviceInfo || existing.device_info,
          notes: visitorNote || existing.notes || null,
          updated_at: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from("incomplete_orders")
          .update(updatePayload)
          .eq("id", existing.id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({ success: true, updated: true, id: existing.id }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        // Insert new partial
        const { data: inserted, error: insertError } = await supabase
          .from("incomplete_orders")
          .insert({
            customer_name: cleanedName || "(অসম্পূর্ণ)",
            customer_phone: cleanedPhone || null,
            customer_address: cleanedAddress || null,
            product_name: cleanedProductName || null,
            product_code: cleanedProductCode || null,
            quantity: safeQuantity,
            unit_price: safeUnitPrice,
            total_amount: totalAmount,
            delivery_charge: safeDeliveryCharge,
            discount: safeDiscount,
            landing_page_slug: landing_page_slug || null,
            client_ip: clientIp === "unknown" ? null : clientIp,
            user_agent: userAgent,
            device_info: deviceInfo,
            block_reason: "abandoned_form",
            status: "processing",
            notes: visitorNote,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;

        const resolvedId = await cleanupDuplicatePartials(
          supabase,
          inserted?.id,
          clientIp,
          landing_page_slug || null,
          visitor_id || null,
          cleanedPhone || null,
        );

        return new Response(
          JSON.stringify({ success: true, created: true, id: resolvedId }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Remove partial on successful order ──
    if (action === "remove_partial") {
      const applySlugFilter = (query: any) => {
        if (landing_page_slug) return query.eq("landing_page_slug", landing_page_slug);
        return query.is("landing_page_slug", null);
      };

      if (visitor_id) {
        const { error: visitorDeleteError } = await applySlugFilter(
          supabase
            .from("incomplete_orders")
            .delete()
            .eq("block_reason", "abandoned_form")
            .ilike("notes", `%visitor:${visitor_id}%`),
        );

        if (visitorDeleteError) {
          console.error("[track-partial-order] Failed visitor delete:", visitorDeleteError.message);
        }
      }

      if (clientIp && clientIp !== "unknown") {
        const { error: ipDeleteError } = await applySlugFilter(
          supabase
            .from("incomplete_orders")
            .delete()
            .eq("block_reason", "abandoned_form")
            .eq("client_ip", clientIp),
        );

        if (ipDeleteError) {
          console.error("[track-partial-order] Failed IP delete:", ipDeleteError.message);
        }
      }

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
    console.error("[track-partial-order] Error:", error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
