/**
 * Prefetch critical store data before React renders.
 * Uses raw fetch to warm Supabase cache so React Query picks up data instantly.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const headers: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Cache for prefetched data - consumed by React Query hooks
export const prefetchCache: Record<string, { data: any; ts: number }> = {};

function restUrl(table: string, query: string) {
  return `${SUPABASE_URL}/rest/v1/${table}?${query}`;
}

async function fetchAndCache(key: string, url: string) {
  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      prefetchCache[key] = { data, ts: Date.now() };
    }
  } catch {
    // Silent fail - React Query will fetch as fallback
  }
}

/**
 * Start fetching products, settings, and banners immediately.
 * Called in main.tsx BEFORE createRoot().
 */
export function prefetchCriticalData() {
  // Only prefetch for store pages (not admin)
  const path = window.location.pathname;
  if (path.startsWith("/admin") || path.startsWith("/login")) return;

  // Products (public view)
  fetchAndCache(
    "public-products",
    restUrl(
      "products_public",
      "select=id,name,product_code,selling_price,original_price,main_image_url,additional_images,short_description,detailed_description,youtube_url,category_id,status,stock_quantity,allow_out_of_stock_orders,free_delivery,created_at,updated_at,slug&status=eq.active&order=created_at.desc"
    )
  );

  // Site settings (public)
  fetchAndCache(
    "site-settings",
    restUrl("site_settings", "select=key,value&is_public=eq.true")
  );

  // Active banners
  fetchAndCache(
    "banners-active",
    restUrl("banners", "select=*&is_active=eq.true&order=sort_order.asc")
  );
}

/**
 * Get prefetched data if available and fresh (< 60s old).
 * Returns undefined if no cached data.
 */
export function getPrefetchedData<T>(key: string): T | undefined {
  const cached = prefetchCache[key];
  if (cached && Date.now() - cached.ts < 60_000) {
    return cached.data as T;
  }
  return undefined;
}
