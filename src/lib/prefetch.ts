/**
 * Prefetch critical store data before React renders.
 * Uses raw fetch to warm API cache so React Query can render immediately.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const PRODUCT_LIST_FIELDS = "id,name,product_code,selling_price,original_price,main_image_url,category_id,stock_quantity,allow_out_of_stock_orders,free_delivery,slug";
const PRODUCT_DETAIL_FIELDS = `${PRODUCT_LIST_FIELDS},short_description,detailed_description,youtube_url,status,additional_images,created_at,updated_at`;

const headers: Record<string, string> = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const SITE_SETTINGS_QUERY = "select=key,value&is_public=eq.true";

export const prefetchCache: Record<string, { data: any; ts: number }> = {};
const inflightPrefetches: Record<string, Promise<void> | undefined> = {};

function restUrl(table: string, query: string) {
  return `${SUPABASE_URL}/rest/v1/${table}?${query}`;
}

function isStoreHomeRoute(path: string) {
  return path === "/" || path === "/store" || path === "/index";
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
  const cached = prefetchCache[key];
  if (cached && Date.now() - cached.ts < 120_000) return;

  if (!inflightPrefetches[key]) {
    inflightPrefetches[key] = (async () => {
      try {
        const res = await fetch(url, { headers, priority: "high" as any });
        if (!res.ok) return;
        const data = await res.json();
        prefetchCache[key] = { data, ts: Date.now() };

        // Preload first product images for LCP optimization
        if (key === "public-products" && Array.isArray(data)) {
          preloadProductImages(data.slice(0, 4));
        }
      } catch {
        // Silent fail - React Query will fetch as fallback
      } finally {
        delete inflightPrefetches[key];
      }
    })();
  }

  await inflightPrefetches[key];
}

export function prefetchLandingPageData(slug: string) {
  if (!slug) return Promise.resolve();

  return fetchAndCache(
    `landing-page:${slug}`,
    restUrl("landing_pages", `select=*&slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&limit=1`)
  );
}

export function prefetchSiteSettingsData() {
  return fetchAndCache("site-settings", restUrl("site_settings", SITE_SETTINGS_QUERY));
}

/** Inject <link rel="preload"> for first visible product images to reduce LCP delay */
function preloadProductImages(products: any[]) {
  for (const p of products) {
    const imgUrl = p?.main_image_url || (p?.additional_images?.[0]);
    if (imgUrl && typeof imgUrl === "string" && /^https?:\/\//i.test(imgUrl)) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = imgUrl;
      document.head.appendChild(link);
    }
  }
}

export function prefetchCriticalData() {
  const path = window.location.pathname;

  if (path.startsWith("/login")) return;

  // Landing pages — prefetch LP data immediately, nothing else
  if (path.startsWith("/lp/")) {
    const slug = path.replace("/lp/", "").split("/")[0];
    if (slug) {
      void prefetchLandingPageData(slug);
    }
    return; // Don't load anything else for landing pages
  }

  // Admin routes — prefetch core admin data
  if (path.startsWith("/admin")) {
    void prefetchSiteSettingsData();
    return;
  }

  // Always useful and lightweight for public pages
  void prefetchSiteSettingsData();

  // Home/store routes need full listing + banners — fire all in parallel
  if (isStoreHomeRoute(path)) {
    fetchAndCache(
      "public-products",
      restUrl("products_public", `select=${PRODUCT_LIST_FIELDS}&status=eq.active&order=created_at.desc`)
    );
    fetchAndCache(
      "banners-active",
      restUrl("banners", "select=id,image_url,link_url,sort_order,is_active&is_active=eq.true&order=sort_order.asc")
    );
    fetchAndCache(
      "categories",
      restUrl("categories", "select=id,name,slug,image_url&order=name.asc")
    );
    return;
  }

  // Product route: prefetch product + suggested products in parallel
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
    // Also prefetch product list for suggestions
    fetchAndCache(
      "public-products",
      restUrl("products_public", `select=${PRODUCT_LIST_FIELDS}&status=eq.active&order=created_at.desc&limit=12`)
    );
    return;
  }
}

export function getPrefetchedData<T>(key: string): T | undefined {
  const cached = prefetchCache[key];
  if (cached && Date.now() - cached.ts < 120_000) { // 2 min validity
    return cached.data as T;
  }
  return undefined;
}
