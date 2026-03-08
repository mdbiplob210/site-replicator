import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get site settings for store info
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "site_url", "site_description"]);

    const settings: Record<string, string> = {};
    settingsData?.forEach((r: any) => { settings[r.key] = r.value; });

    const siteName = settings.site_name || "My Store";
    const siteUrl = settings.site_url || "https://example.com";
    const siteDesc = settings.site_description || "Online Store";

    // Get all categories
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, parent_id");

    const categoryMap: Record<string, string> = {};
    const categoryParentMap: Record<string, string | null> = {};
    categories?.forEach((c: any) => {
      categoryMap[c.id] = c.name;
      categoryParentMap[c.id] = c.parent_id;
    });

    // Build full category path (e.g. "Electronics > Phones > Android")
    function getCategoryPath(categoryId: string | null): string {
      if (!categoryId || !categoryMap[categoryId]) return "";
      const parts: string[] = [];
      let current: string | null = categoryId;
      const visited = new Set<string>();
      while (current && categoryMap[current] && !visited.has(current)) {
        visited.add(current);
        parts.unshift(categoryMap[current]);
        current = categoryParentMap[current] || null;
      }
      return parts.join(" > ");
    }

    // Get active products with stock > 0 or allow_out_of_stock_orders
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Build XML
    const items = (products || []).map((p: any) => {
      const categoryPath = getCategoryPath(p.category_id);
      const availability = (p.stock_quantity > 0 || p.allow_out_of_stock_orders) 
        ? "in stock" 
        : "out of stock";
      const condition = "new";
      const imageUrl = p.main_image_url || "";
      const productUrl = `${siteUrl}/product/${p.id}`;
      const salePrice = p.selling_price;
      const originalPrice = p.original_price > p.selling_price ? p.original_price : null;

      // Additional images (max 10 for FB)
      const additionalImages = (p.additional_images || [])
        .slice(0, 10)
        .map((img: string) => `      <g:additional_image_link>${escapeXml(img)}</g:additional_image_link>`)
        .join("\n");

      return `    <item>
      <g:id>${escapeXml(p.product_code || p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.short_description || p.detailed_description || p.name)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
${additionalImages ? additionalImages + "\n" : ""}      <g:availability>${availability}</g:availability>
      <g:price>${salePrice.toFixed(2)} BDT</g:price>${originalPrice ? `\n      <g:sale_price>${salePrice.toFixed(2)} BDT</g:sale_price>` : ""}
      <g:condition>${condition}</g:condition>
      <g:brand>${escapeXml(siteName)}</g:brand>
      <g:item_group_id>${escapeXml(p.category_id || "general")}</g:item_group_id>${categoryPath ? `\n      <g:product_type>${escapeXml(categoryPath)}</g:product_type>` : ""}
      <g:inventory>${p.stock_quantity}</g:inventory>
    </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(siteDesc)}</description>
${items.join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Product feed error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
