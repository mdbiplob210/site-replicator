import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
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

    // Generate order number
    const orderNumber = `LP-${Date.now().toString(36).toUpperCase()}`;
    const totalProductCost = unit_price * quantity;
    const totalAmount = totalProductCost + delivery_charge - discount;

    // Insert order
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
          ? `[Landing Page: ${landing_page_slug || "unknown"}] ${notes}`
          : `[Landing Page: ${landing_page_slug || "unknown"}]`,
        status: "processing",
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    // Insert order item if product info provided
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
