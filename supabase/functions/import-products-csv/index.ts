import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function parseCsvLine(line: string, delimiter = ";"): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
  }
  result.push(current.trim());
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { csvContent } = await req.json();
    if (!csvContent) {
      return new Response(JSON.stringify({ error: "No CSV content" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lines = csvContent.split("\n").filter((l: string) => l.trim());
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "Empty CSV" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = parseCsvLine(lines[0]);
    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => { colIndex[h.toLowerCase().replace(/"/g, "")] = i; });

    const products: any[] = [];
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length < 3) { skipped++; continue; }

      const get = (key: string) => cols[colIndex[key]] || "";

      const name = get("name");
      const sku = get("sku");
      if (!name && !sku) { skipped++; continue; }

      // Parse gallery images - could be comma or pipe separated URLs
      const galleryRaw = get("gallery_images");
      const additionalImages = galleryRaw
        ? galleryRaw.split(",").map((u: string) => u.trim()).filter(Boolean)
        : [];

      const price = parseFloat(get("price")) || 0;
      const salePrice = parseFloat(get("sale_price")) || 0;
      const purchasePrice = parseFloat(get("purchase_price")) || 0;
      const stock = parseInt(get("stock")) || 0;
      const isFreeShipping = get("is_free_shipping") === "1" || get("is_free_shipping").toLowerCase() === "true";
      const status = get("status") === "1" || get("status").toLowerCase() === "active" ? "active" : "inactive";

      // Clean description - remove HTML tags for short_description
      const descRaw = get("description");
      const shortDesc = descRaw.replace(/<[^>]*>/g, "").substring(0, 500);

      products.push({
        name: name || `Product ${sku}`,
        product_code: sku || `SKU-${i}`,
        slug: get("slug") || null,
        main_image_url: get("image") || get("thumb") || null,
        additional_images: additionalImages,
        original_price: price,
        selling_price: salePrice > 0 ? salePrice : price,
        purchase_price: purchasePrice,
        stock_quantity: stock,
        free_delivery: isFreeShipping,
        status: status,
        short_description: shortDesc || null,
        detailed_description: descRaw || null,
        allow_out_of_stock_orders: false,
      });
    }

    // Insert in batches of 50
    let inserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < products.length; i += 50) {
      const batch = products.slice(i, i + 50);
      const { data, error } = await supabase.from("products").insert(batch).select("id");
      if (error) {
        errors.push(`Batch ${i / 50 + 1}: ${error.message}`);
      } else {
        inserted += (data?.length || 0);
      }
    }

    return new Response(
      JSON.stringify({ inserted, skipped, total: lines.length - 1, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Import error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
