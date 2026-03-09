import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all active courier providers
    const { data: providers, error: provErr } = await supabase
      .from("courier_providers")
      .select("id, name, slug, api_configs, is_active")
      .eq("is_active", true);

    if (provErr) throw provErr;

    const balances: any[] = [];

    for (const provider of providers || []) {
      const configs = Array.isArray(provider.api_configs)
        ? provider.api_configs
        : JSON.parse(provider.api_configs || "[]");

      const config = configs[0];
      if (!config) {
        balances.push({
          provider_id: provider.id,
          provider_name: provider.name,
          slug: provider.slug,
          api_balance: null,
          estimated_balance: 0,
          error: "No API config",
        });
        continue;
      }

      let apiBalance: number | null = null;
      let apiError: string | null = null;

      // Fetch from API based on slug
      if (provider.slug === "steadfast") {
        try {
          const baseUrl = config.base_url || "https://portal.steadfast.com.bd/api/v1";
          const resp = await fetch(`${baseUrl}/current_balance`, {
            method: "GET",
            headers: {
              "Api-Key": config.api_key || "",
              "Secret-Key": config.secret_key || "",
              "Content-Type": "application/json",
            },
          });

          if (resp.ok) {
            const data = await resp.json();
            apiBalance = data.current_balance ?? null;
          } else {
            const errText = await resp.text();
            apiError = `API error [${resp.status}]: ${errText}`;
          }
        } catch (err: any) {
          apiError = err.message;
        }
      } else if (provider.slug === "pathao") {
        // Pathao doesn't have a direct balance API
        // We'll only show estimated balance from order data
        apiBalance = null;
        apiError = "Pathao এর ব্যালেন্স API নেই — অর্ডার ডেটা থেকে এস্টিমেট দেখানো হচ্ছে";
      } else if (provider.slug === "redx") {
        // RedX - no known balance API
        apiBalance = null;
        apiError = "RedX এর ব্যালেন্স API সাপোর্ট নেই";
      } else if (provider.slug === "ecourier") {
        // eCourier - no known balance API  
        apiBalance = null;
        apiError = "eCourier এর ব্যালেন্স API সাপোর্ট নেই";
      }

      // Calculate estimated balance from order data
      // Orders that are in_courier or delivered via this provider = COD pending
      const { data: courierOrders } = await supabase
        .from("courier_orders")
        .select("order_id")
        .eq("courier_provider_id", provider.id);

      let estimatedBalance = 0;
      let totalInCourier = 0;
      let totalDelivered = 0;

      if (courierOrders && courierOrders.length > 0) {
        const orderIds = courierOrders.map((co: any) => co.order_id);

        // Fetch in batches to avoid URL length limits
        const batchSize = 100;
        for (let i = 0; i < orderIds.length; i += batchSize) {
          const batch = orderIds.slice(i, i + batchSize);
          const { data: orders } = await supabase
            .from("orders")
            .select("id, status, total_amount")
            .in("id", batch)
            .in("status", ["in_courier", "delivered"]);

          if (orders) {
            for (const order of orders) {
              const amount = Number(order.total_amount) || 0;
              estimatedBalance += amount;
              if (order.status === "in_courier") totalInCourier += amount;
              if (order.status === "delivered") totalDelivered += amount;
            }
          }
        }
      }

      balances.push({
        provider_id: provider.id,
        provider_name: provider.name,
        slug: provider.slug,
        api_balance: apiBalance,
        estimated_balance: estimatedBalance,
        in_courier_amount: totalInCourier,
        delivered_amount: totalDelivered,
        error: apiError,
      });
    }

    return new Response(JSON.stringify({ data: balances }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Courier balance error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
