import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const JSON_HEADERS = { ...corsHeaders, "Content-Type": "application/json" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth check
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await authClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: JSON_HEADERS });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json();
    const { action, provider_id, order_id, order_ids, consignment_id } = body;

    // Get provider config
    const { data: provider, error: provErr } = await supabase
      .from("courier_providers")
      .select("*")
      .eq("id", provider_id)
      .single();

    if (provErr || !provider) {
      return new Response(JSON.stringify({ error: "Provider not found" }), { status: 404, headers: JSON_HEADERS });
    }

    const configs = Array.isArray(provider.api_configs) ? provider.api_configs : JSON.parse(provider.api_configs || "[]");
    if (configs.length === 0) {
      return new Response(JSON.stringify({ error: "No API config found" }), { status: 400, headers: JSON_HEADERS });
    }

    const config = configs[0];
    const slug = provider.slug;

    // Route by action
    if (action === "submit-order") {
      if (slug === "pathao") {
        const result = await submitToPathao(supabase, config, provider, body);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: JSON_HEADERS });
      } else if (slug === "steadfast") {
        const result = await submitToSteadfast(supabase, config, provider, body);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: JSON_HEADERS });
      } else if (slug === "redx") {
        const result = await submitToRedx(supabase, config, provider, body);
        return new Response(JSON.stringify(result), { status: result.success ? 200 : 400, headers: JSON_HEADERS });
      } else {
        return new Response(JSON.stringify({ error: `Unsupported courier: ${slug}` }), { status: 400, headers: JSON_HEADERS });
      }
    }

    if (action === "track-order") {
      if (slug === "pathao") {
        const result = await trackPathaoOrder(config, consignment_id);
        return new Response(JSON.stringify(result), { headers: JSON_HEADERS });
      } else if (slug === "steadfast") {
        const result = await trackSteadfastOrder(config, consignment_id);
        return new Response(JSON.stringify(result), { headers: JSON_HEADERS });
      } else {
        return new Response(JSON.stringify({ error: `Tracking not supported for: ${slug}` }), { status: 400, headers: JSON_HEADERS });
      }
    }

    if (action === "bulk-submit") {
      if (!order_ids || !Array.isArray(order_ids)) {
        return new Response(JSON.stringify({ error: "order_ids array required" }), { status: 400, headers: JSON_HEADERS });
      }

      const results: any[] = [];
      for (const oid of order_ids) {
        try {
          let result;
          // Get order data
          const { data: order } = await supabase.from("orders").select("*, order_items(*)").eq("id", oid).single();
          if (!order) { results.push({ order_id: oid, success: false, error: "Order not found" }); continue; }

          const orderBody = { ...body, order_id: oid, order_data: order };
          if (slug === "pathao") result = await submitToPathao(supabase, config, provider, orderBody);
          else if (slug === "steadfast") result = await submitToSteadfast(supabase, config, provider, orderBody);
          else if (slug === "redx") result = await submitToRedx(supabase, config, provider, orderBody);
          else result = { success: false, error: `Unsupported: ${slug}` };

          results.push({ order_id: oid, ...result });
        } catch (e: any) {
          results.push({ order_id: oid, success: false, error: e.message });
        }
      }
      return new Response(JSON.stringify({ results }), { headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: JSON_HEADERS });
  } catch (err: any) {
    console.error("courier-submit error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), { status: 500, headers: JSON_HEADERS });
  }
});

// ========== PATHAO ==========
async function getPathaoToken(config: any): Promise<string> {
  if (config.api_key && config.api_key.length > 50) return config.api_key;

  const baseUrl = config.base_url || "https://api-hermes.pathao.com";
  const resp = await fetch(`${baseUrl}/aladdin/api/v1/issue-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.client_id || "",
      client_secret: config.secret_key || "",
      username: config.email || config.api_key || "",
      password: config.password || config.secret_key || "",
      grant_type: "password",
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Pathao auth failed [${resp.status}]: ${errText}`);
  }
  const data = await resp.json();
  return data.token || data.access_token || "";
}

async function submitToPathao(supabase: any, config: any, provider: any, body: any) {
  const { order_id, order_data } = body;

  // Get order if not provided
  let order = order_data;
  if (!order) {
    const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", order_id).single();
    if (error || !data) return { success: false, error: "Order not found" };
    order = data;
  }

  const baseUrl = config.base_url || "https://api-hermes.pathao.com";
  const token = await getPathaoToken(config);

  const storeId = config.store_id || "";
  const items = order.order_items || [];
  const totalWeight = body.weight || Math.max(items.reduce((sum: number, i: any) => sum + (i.quantity || 1) * 0.5, 0), 0.5);

  const pathaoPayload = {
    store_id: storeId,
    merchant_order_id: order.order_number || order.id,
    recipient_name: order.customer_name,
    recipient_phone: order.customer_phone || "",
    recipient_address: order.customer_address || "",
    recipient_city: body.city_id || 1,
    recipient_zone: body.zone_id || 1,
    recipient_area: body.area_id || undefined,
    delivery_type: 48, // Normal delivery
    item_type: 2, // Parcel
    special_instruction: order.courier_note || order.notes || "",
    item_quantity: items.reduce((sum: number, i: any) => sum + (i.quantity || 1), 0) || 1,
    item_weight: totalWeight,
    amount_to_collect: order.total_amount || 0,
    item_description: items.map((i: any) => `${i.product_name} x${i.quantity}`).join(", ") || "Parcel",
  };

  const resp = await fetch(`${baseUrl}/aladdin/api/v1/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(pathaoPayload),
  });

  const data = await resp.json();

  if (!resp.ok) {
    // Pathao returns field-level errors in data.errors object
    let errorMsg = data?.message || `Pathao API error [${resp.status}]`;
    if (data?.errors && typeof data.errors === "object") {
      const fieldErrors = Object.entries(data.errors)
        .map(([field, msgs]: [string, any]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
        .join("; ");
      if (fieldErrors) errorMsg = fieldErrors;
    }
    return { success: false, error: errorMsg, api_response: data };
  }

  const consignmentId = data?.data?.consignment_id || data?.consignment_id || "";
  const trackingId = consignmentId;

  // Save to courier_orders
  await supabase.from("courier_orders").upsert({
    order_id,
    courier_provider_id: provider.id,
    tracking_id: trackingId,
    consignment_id: consignmentId,
    courier_status: "submitted",
    courier_response: data,
  }, { onConflict: "order_id" });

  // Update order status
  await supabase.from("orders").update({ status: "in_courier" }).eq("id", order_id);

  return {
    success: true,
    consignment_id: consignmentId,
    tracking_id: trackingId,
    api_response: data,
  };
}

// ========== STEADFAST ==========
async function submitToSteadfast(supabase: any, config: any, provider: any, body: any) {
  const { order_id, order_data } = body;

  let order = order_data;
  if (!order) {
    const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", order_id).single();
    if (error || !data) return { success: false, error: "Order not found" };
    order = data;
  }

  const baseUrl = config.base_url || "https://portal.steadfast.com.bd/api/v1";
  const resp = await fetch(`${baseUrl}/create_order`, {
    method: "POST",
    headers: {
      "Api-Key": config.api_key || "",
      "Secret-Key": config.secret_key || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      invoice: order.order_number || order.id,
      recipient_name: order.customer_name,
      recipient_phone: order.customer_phone || "",
      recipient_address: order.customer_address || "",
      cod_amount: order.total_amount || 0,
      note: order.courier_note || order.notes || "",
    }),
  });

  const data = await resp.json();

  if (!resp.ok || data?.status !== 200) {
    return { success: false, error: data?.message || data?.errors || `Steadfast error [${resp.status}]`, api_response: data };
  }

  const consignmentId = data?.consignment?.consignment_id || "";
  const trackingId = data?.consignment?.tracking_code || "";

  await supabase.from("courier_orders").upsert({
    order_id,
    courier_provider_id: provider.id,
    tracking_id: trackingId,
    consignment_id: consignmentId,
    courier_status: "submitted",
    courier_response: data,
  }, { onConflict: "order_id" });

  await supabase.from("orders").update({ status: "in_courier" }).eq("id", order_id);

  return { success: true, consignment_id: consignmentId, tracking_id: trackingId, api_response: data };
}

// ========== REDX ==========
async function submitToRedx(supabase: any, config: any, provider: any, body: any) {
  const { order_id, order_data } = body;

  let order = order_data;
  if (!order) {
    const { data, error } = await supabase.from("orders").select("*, order_items(*)").eq("id", order_id).single();
    if (error || !data) return { success: false, error: "Order not found" };
    order = data;
  }

  const baseUrl = config.base_url || "https://openapi.redx.com.bd/v1.0.0-beta";
  const resp = await fetch(`${baseUrl}/parcel`, {
    method: "POST",
    headers: {
      "API-ACCESS-TOKEN": `Bearer ${config.api_key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: order.customer_name,
      customer_phone: order.customer_phone || "",
      delivery_area: order.customer_address || "",
      delivery_area_id: body.area_id || undefined,
      merchant_invoice_id: order.order_number || order.id,
      cash_collection_amount: String(order.total_amount || 0),
      parcel_weight: 500,
      instruction: order.courier_note || order.notes || "",
      value: String(order.total_amount || 0),
    }),
  });

  const data = await resp.json();

  if (!resp.ok) {
    return { success: false, error: data?.message || `RedX error [${resp.status}]`, api_response: data };
  }

  const trackingId = data?.tracking_id || "";

  await supabase.from("courier_orders").upsert({
    order_id,
    courier_provider_id: provider.id,
    tracking_id: trackingId,
    consignment_id: trackingId,
    courier_status: "submitted",
    courier_response: data,
  }, { onConflict: "order_id" });

  await supabase.from("orders").update({ status: "in_courier" }).eq("id", order_id);

  return { success: true, consignment_id: trackingId, tracking_id: trackingId, api_response: data };
}

// ========== TRACKING ==========
async function trackPathaoOrder(config: any, consignmentId: string) {
  const baseUrl = config.base_url || "https://api-hermes.pathao.com";
  const token = await getPathaoToken(config);

  const resp = await fetch(`${baseUrl}/aladdin/api/v1/orders/${consignmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const data = await resp.json();
  return { success: resp.ok, data };
}

async function trackSteadfastOrder(config: any, consignmentId: string) {
  const baseUrl = config.base_url || "https://portal.steadfast.com.bd/api/v1";
  const resp = await fetch(`${baseUrl}/status_by_cid/${consignmentId}`, {
    headers: {
      "Api-Key": config.api_key || "",
      "Secret-Key": config.secret_key || "",
    },
  });

  const data = await resp.json();
  return { success: resp.ok, data };
}
