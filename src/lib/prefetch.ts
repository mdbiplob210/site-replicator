/**
 * Prefetch critical store data before React renders.
 * Uses raw fetch to warm API cache so React Query can render immediately.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PRODUCT_LIST_FIELDS = "id,name,product_code,selling_price,original_price,main_image_url,additional_images,category_id,stock_quantity,allow_out_of_stock_orders,free_delivery,slug";
const PRODUCT_DETAIL_FIELDS = `${PRODUCT_LIST_FIELDS},short_description,detailed_description,youtube_url,status,created_at,updated_at`;

const headers: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const prefetchCache: Record<string, { data: any; ts: number }> = {};

function restUrl(table: string, query: string) {
  return `${SUPABASE_URL}/rest/v1/${table}?${query}`;
}

function isStoreHomeRoute(path: string) {
  return path === "/" || path === "/store";
}

function isProductRoute(path: string) {
  return path.startsWith("/product/") || path.startsWith("/store/product/");
}

function extractProductSlug(path: string) {
  if (path.startsWith("/product/")) return path.replace("/product/", "");
  if (path.startsWith("/store/product/")) return path.replace("/store/product/", "");
  return "";
}

async function fetchAndCache(key: string, url: string) {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return;

    const data = await res.json();
    prefetchCache[key] = { data, ts: Date.now() };
  } catch {
    // Silent fail - React Query will fetch as fallback
  }
}

export function prefetchCriticalData() {
  const path = window.location.pathname;

  if (path.startsWith("/admin") || path.startsWith("/login")) return;

  // Always useful and lightweight for public pages
  fetchAndCache("site-settings", restUrl("site_settings", "select=key,value&is_public=eq.true"));

  // Home/store routes need full listing + banners
  if (isStoreHomeRoute(path)) {
    fetchAndCache(
      "public-products",
      restUrl("products_public", `select=${PRODUCT_LIST_FIELDS}&status=eq.active&order=created_at.desc`)
    );

    fetchAndCache(
      "banners-active",
      restUrl("banners", "select=id,image_url,link_url,sort_order,is_active&is_active=eq.true&order=sort_order.asc")
    );

    return;
  }

  // Product route: prefetch only current product (avoid downloading entire catalog)
  if (isProductRoute(path)) {
    const slug = extractProductSlug(path);
    if (!slug) return;

    fetchAndCache(
      `product-detail:${slug}`,
      restUrl(
        "products_public",
        `select=${PRODUCT_DETAIL_FIELDS}&status=eq.active&slug=eq.${encodeURIComponent(slug)}&limit=1`
      )
    );
  }
}

export function getPrefetchedData<T>(key: string): T | undefined {
  const cached = prefetchCache[key];
  if (cached && Date.now() - cached.ts < 60_000) {
    return cached.data as T;
  }
  return undefined;
}
