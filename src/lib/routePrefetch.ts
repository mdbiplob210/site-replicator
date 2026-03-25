/**
 * Route-based chunk prefetching.
 * Preloads lazy-loaded route chunks on link hover/touch for instant navigation.
 */

const prefetchedRoutes = new Set<string>();

// Map route patterns to their dynamic import functions
const routeImportMap: Record<string, () => Promise<any>> = {
  "/": () => import("../pages/store/StorePage"),
  "/store": () => import("../pages/store/StorePage"),
  "/checkout": () => import("../pages/store/CheckoutPage"),
  "/store/checkout": () => import("../pages/store/CheckoutPage"),
  "/order-success": () => import("../pages/store/OrderSuccess"),
  "/track-order": () => import("../pages/store/TrackOrder"),
  "/login": () => import("../pages/Login"),
  "/admin": () => import("../pages/admin/AdminDashboard"),
  "/admin/orders": () => import("../pages/admin/AdminOrders"),
  "/admin/products": () => import("../pages/admin/AdminProducts"),
  "/admin/finance": () => import("../pages/admin/AdminFinance"),
  "/admin/analytics": () => import("../pages/admin/AdminAnalytics"),
  "/admin/settings": () => import("../pages/admin/AdminSettings"),
  "/admin/courier": () => import("../pages/admin/AdminCourier"),
  "/admin/users": () => import("../pages/admin/AdminUsers"),
  "/admin/reports": () => import("../pages/admin/AdminReports"),
  "/admin/inventory": () => import("../pages/admin/AdminInventory"),
  "/admin/invoices": () => import("../pages/admin/AdminInvoices"),
  "/admin/coupons": () => import("../pages/admin/AdminCoupons"),
  "/admin/reviews": () => import("../pages/admin/AdminReviews"),
  "/admin/tasks": () => import("../pages/admin/AdminTasks"),
  "/admin/meta-ads": () => import("../pages/admin/AdminMetaAds"),
  "/admin/profile": () => import("../pages/admin/AdminProfile"),
  "/admin/whatsapp": () => import("../pages/admin/AdminWhatsApp"),
  "/admin/planning": () => import("../pages/admin/AdminPlanning"),
  "/admin/automation": () => import("../pages/admin/AdminAutomation"),
  "/admin/backup": () => import("../pages/admin/AdminBackup"),
  "/admin/coming-soon": () => import("../pages/admin/AdminComingSoon"),
  "/admin/delivery-riders": () => import("../pages/admin/AdminRiderManagement"),
  "/admin/website": () => import("../pages/admin/AdminMainTemplate"),
  "/admin/website/settings": () => import("../pages/admin/AdminWebsiteSettings"),
  "/admin/website/landing-pages": () => import("../pages/admin/AdminLandingPages"),
  "/admin/website/analytics": () => import("../pages/admin/AdminWebsiteAnalytics"),
  "/admin/website/landing-pages/analytics": () => import("../pages/admin/AdminLandingPageAnalytics"),
  "/admin/website/main-template": () => import("../pages/admin/AdminMainTemplate"),
  "/admin/website/checkout-template": () => import("../pages/admin/AdminCheckoutTemplate"),
  "/admin/website/product-template": () => import("../pages/admin/AdminProductTemplate"),
  "/admin/website/category-template": () => import("../pages/admin/AdminCategoryTemplate"),
  "/admin/website/thank-you": () => import("../pages/admin/AdminThankYouTemplate"),
  "/admin/website/payment": () => import("../pages/admin/AdminPayment"),
  "/admin/website/pages": () => import("../pages/admin/AdminPages"),
  "/admin/website/memo-template": () => import("../pages/admin/AdminMemoTemplate"),
};

/** Prefetch a route's JS chunk. Call on hover/touchstart for instant navigation. */
export function prefetchRoute(path: string) {
  const cleanPath = path.split("?")[0].split("#")[0];

  if (prefetchedRoutes.has(cleanPath)) return;
  prefetchedRoutes.add(cleanPath);

  const importFn = routeImportMap[cleanPath];
  if (importFn) {
    importFn().catch(() => {});
    return;
  }

  // Product detail route
  if (cleanPath.startsWith("/product/") || cleanPath.startsWith("/store/product/")) {
    import("../pages/store/ProductDetail").catch(() => {});
    return;
  }

  // Landing page route
  if (cleanPath.startsWith("/lp/")) {
    import("../pages/LandingPageView").catch(() => {});
  }
}

/**
 * Attach prefetch listeners to all internal links.
 * Uses event delegation on document for efficiency.
 */
export function initLinkPrefetching() {
  let hoverTimer: ReturnType<typeof setTimeout> | null = null;

  function handlePointerEnter(e: Event) {
    const target = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!target) return;

    const href = target.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

    // Small delay to avoid prefetching on scroll-through
    hoverTimer = setTimeout(() => prefetchRoute(href), 50);
  }

  function handlePointerLeave() {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }

  // Touch devices: prefetch on touchstart (no delay)
  document.addEventListener("touchstart", (e) => {
    const target = (e.target as HTMLElement)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute("href");
    if (href && !href.startsWith("http") && !href.startsWith("//")) {
      prefetchRoute(href);
    }
  }, { passive: true });

  document.addEventListener("pointerenter", handlePointerEnter, true);
  document.addEventListener("pointerleave", handlePointerLeave, true);
}
