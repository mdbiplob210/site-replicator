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

    const body = await req.json();
    const csvUrl = body.csvUrl;
    const offset = body.offset || 0; // skip first N data lines
    const limit = body.limit || 20; // process N lines at a time

    if (!csvUrl) {
      return new Response(JSON.stringify({ error: "csvUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resp = await fetch(csvUrl);
    const csvContent = await resp.text();
    const lines = csvContent.split(/\r?\n/).filter((l: string) => l.trim());
    
    console.log(`Total CSV lines: ${lines.length}`);

    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: "Empty CSV" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const headers = parseCsvLine(lines[0]);
    const colIndex: Record<string, number> = {};
    headers.forEach((h, i) => { colIndex[h.toLowerCase().replace(/"/g, "")] = i; });
    console.log(`Headers: ${JSON.stringify(Object.keys(colIndex))}`);

    const dataLines = lines.slice(1);
    const sliced = dataLines.slice(offset, offset + limit);
    
    const products: any[] = [];
    let skipped = 0;

    for (const line of sliced) {
      const cols = parseCsvLine(line);
      if (cols.length < 3) { skipped++; continue; }

      const get = (key: string) => cols[colIndex[key]] ?? "";

      const name = get("name");
      const sku = get("sku");
      if (!name && !sku) { skipped++; continue; }

      const galleryRaw = get("gallery_images");
      const additionalImages = galleryRaw
        ? galleryRaw.split(",").map((u: string) => u.trim()).filter(Boolean)
        : [];

      const price = parseFloat(get("price")) || 0;
      const salePrice = parseFloat(get("sale_price")) || 0;
      const purchasePrice = parseFloat(get("purchase_price")) || 0;
      const stock = parseInt(get("stock")) || 0;
      const isFreeShipping = get("is_free_shipping") === "1" || get("is_free_shipping").toLowerCase() === "true";
      const statusRaw = get("status");
      const status = statusRaw === "1" || statusRaw.toLowerCase() === "active" || statusRaw === "" ? "active" : "inactive";

      // Truncate description to avoid huge payloads
      const descRaw = get("description");
      const shortDesc = descRaw.replace(/<[^>]*>/g, "").substring(0, 500);

      products.push({
        name: name || `Product ${sku}`,
        product_code: sku || `SKU-${offset + products.length}`,
        slug: get("slug") || null,
        main_image_url: get("image") || get("thumb") || null,
        additional_images: additionalImages.length > 0 ? additionalImages : [],
        original_price: price,
        selling_price: salePrice > 0 ? salePrice : price,
        purchase_price: purchasePrice,
        stock_quantity: stock,
        free_delivery: isFreeShipping,
        status: status,
        short_description: shortDesc || null,
        detailed_description: descRaw ? descRaw.substring(0, 5000) : null,
        allow_out_of_stock_orders: false,
      });
    }

    console.log(`Processing ${products.length} products (offset: ${offset}, limit: ${limit})`);
    if (products.length > 0) {
      console.log(`First product: ${JSON.stringify({ name: products[0].name, sku: products[0].product_code })}`);
    }

    let inserted = 0;
    const errors: string[] = [];
    for (let i = 0; i < products.length; i += 10) {
      const batch = products.slice(i, i + 10);
      const { data, error } = await supabase.from("products").insert(batch).select("id");
      if (error) {
        errors.push(`Batch ${i / 10 + 1}: ${error.message}`);
        console.error(`Insert error:`, error.message);
      } else {
        inserted += (data?.length || 0);
      }
    }

    return new Response(
      JSON.stringify({ 
        inserted, 
        skipped, 
        processed: sliced.length,
        totalDataLines: dataLines.length,
        hasMore: offset + limit < dataLines.length,
        nextOffset: offset + limit,
        errors 
      }),
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
