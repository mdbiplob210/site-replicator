import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeXml(str: string): string {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get site URL from settings
    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_url"]);

    const settings: Record<string, string> = {};
    settingsData?.forEach((r: any) => { settings[r.key] = r.value; });
    const siteUrl = settings.site_url || "https://example.com";

    // Get all active products
    const { data: products } = await supabase
      .from("products")
      .select("slug, id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false });

    // Get all active categories
    const { data: categories } = await supabase
      .from("categories")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false });

    // Get active landing pages
    const { data: landingPages } = await supabase
      .from("landing_pages")
      .select("slug, updated_at")
      .eq("is_active", true);

    const now = new Date().toISOString();

    let urls = `  <url>
    <loc>${escapeXml(siteUrl)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${escapeXml(siteUrl)}/checkout</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;

    // Product URLs
    (products || []).forEach((p: any) => {
      const slug = p.slug || p.id;
      urls += `
  <url>
    <loc>${escapeXml(siteUrl)}/product/${escapeXml(slug)}</loc>
    <lastmod>${p.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Landing page URLs
    (landingPages || []).forEach((lp: any) => {
      urls += `
  <url>
    <loc>${escapeXml(siteUrl)}/lp/${escapeXml(lp.slug)}</loc>
    <lastmod>${lp.updated_at || now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Sitemap error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
