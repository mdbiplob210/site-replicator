import { lazy, Suspense } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import type { PermissionKey } from "@/contexts/AuthContext";
import { TrackingInitializer } from "./components/TrackingInitializer";
import { WebsiteEventTracker } from "./components/WebsiteEventTracker";
import { useDynamicMeta } from "@/hooks/useDynamicMeta";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const DynamicMetaProvider = () => { useDynamicMeta(); return null; };

// StorePage also lazy-loaded now for better code splitting
const StorePage = lazy(() => import("./pages/store/StorePage"));

// Lazy-loaded public pages
const ProductDetail = lazy(() => import("./pages/store/ProductDetail"));
const CheckoutPage = lazy(() => import("./pages/store/CheckoutPage"));
const OrderSuccess = lazy(() => import("./pages/store/OrderSuccess"));
const TrackOrder = lazy(() => import("./pages/store/TrackOrder"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const LandingPageView = lazy(() => import("./pages/LandingPageView"));
const LandingPageCheckout = lazy(() => import("./pages/LandingPageCheckout"));
const Landing = lazy(() => import("./pages/Landing"));

// Lazy-loaded admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminOrders = lazy(() => import("./pages/admin/AdminOrders"));
const AdminComingSoon = lazy(() => import("./pages/admin/AdminComingSoon"));
const AdminBackup = lazy(() => import("./pages/admin/AdminBackup"));
const AdminAutomation = lazy(() => import("./pages/admin/AdminAutomation"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const AdminPlaceholder = lazy(() => import("./pages/admin/AdminPlaceholder"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminFinance = lazy(() => import("./pages/admin/AdminFinance"));
const AdminPlanning = lazy(() => import("./pages/admin/AdminPlanning"));
const AdminTasks = lazy(() => import("./pages/admin/AdminTasks"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminMetaAds = lazy(() => import("./pages/admin/AdminMetaAds"));
const AdminApiKeys = lazy(() => import("./pages/admin/AdminApiKeys"));
const AdminCourier = lazy(() => import("./pages/admin/AdminCourier"));
const AdminBackfillOrderItems = lazy(() => import("./pages/admin/AdminBackfillOrderItems"));
const AdminWebsiteSettings = lazy(() => import("./pages/admin/AdminWebsiteSettings"));
const AdminMainTemplate = lazy(() => import("./pages/admin/AdminMainTemplate"));
const AdminCheckoutTemplate = lazy(() => import("./pages/admin/AdminCheckoutTemplate"));
const AdminProductTemplate = lazy(() => import("./pages/admin/AdminProductTemplate"));
const AdminCategoryTemplate = lazy(() => import("./pages/admin/AdminCategoryTemplate"));
const AdminThankYouTemplate = lazy(() => import("./pages/admin/AdminThankYouTemplate"));
const AdminLandingPages = lazy(() => import("./pages/admin/AdminLandingPages"));
const AdminLandingPageAnalytics = lazy(() => import("./pages/admin/AdminLandingPageAnalytics"));
const AdminWebsiteAnalytics = lazy(() => import("./pages/admin/AdminWebsiteAnalytics"));
const AdminPayment = lazy(() => import("./pages/admin/AdminPayment"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));
const AdminMemoTemplate = lazy(() => import("./pages/admin/AdminMemoTemplate"));
const AdminInventory = lazy(() => import("./pages/admin/AdminInventory"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminReviews = lazy(() => import("./pages/admin/AdminReviews"));
const RiderDashboard = lazy(() => import("./components/admin/RiderDashboard"));
const AdminRiderManagement = lazy(() => import("./pages/admin/AdminRiderManagement"));

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce refetches
      gcTime: 15 * 60 * 1000, // 15 minutes garbage collection
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      refetchOnReconnect: false, // Don't refetch on reconnect
      retry: 1, // Only 1 retry on failure
      networkMode: "offlineFirst", // Use cache first
    },
  },
});

const P = (title: string, desc?: string, requiredPermissions?: PermissionKey[]) => (
  <ProtectedAdminRoute requiredPermissions={requiredPermissions}>
    <Suspense fallback={<PageLoader />}>
      <AdminPlaceholder title={title} description={desc} />
    </Suspense>
  </ProtectedAdminRoute>
);

const Admin = ({ children, requiredPermissions }: { children: React.ReactNode; requiredPermissions?: PermissionKey[] }) => (
  <ProtectedAdminRoute requiredPermissions={requiredPermissions}>
    <Suspense fallback={<PageLoader />}>{children}</Suspense>
  </ProtectedAdminRoute>
);

const App = () => {
  // Import and use dynamic meta hook at app level
  return (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <DynamicMetaProvider />
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TrackingInitializer />
        <WebsiteEventTracker />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<StorePage />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/track-order" element={<TrackOrder />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/product/:slug" element={<ProductDetail />} />
            <Route path="/store/checkout" element={<CheckoutPage />} />
            <Route path="/store/order-success" element={<OrderSuccess />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin" element={<Admin requiredPermissions={["view_dashboard"]}><AdminDashboard /></Admin>} />
            <Route path="/admin/orders" element={<Admin requiredPermissions={["view_orders"]}><AdminOrders /></Admin>} />
            <Route path="/admin/orders/backfill-items" element={<Admin requiredPermissions={["edit_orders"]}><AdminBackfillOrderItems /></Admin>} />
            <Route path="/admin/users" element={<Admin requiredPermissions={["manage_users"]}><AdminUsers /></Admin>} />
            <Route path="/admin/roles" element={<Admin requiredPermissions={["manage_users"]}><AdminRoles /></Admin>} />
            <Route path="/admin/settings" element={<Admin requiredPermissions={["manage_settings"]}><AdminSettings /></Admin>} />
            <Route path="/admin/products" element={<Admin requiredPermissions={["view_products"]}><AdminProducts /></Admin>} />
            <Route path="/admin/website" element={<Admin requiredPermissions={["manage_website"]}><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/main-template" element={<Admin requiredPermissions={["manage_website"]}><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/checkout-template" element={<Admin requiredPermissions={["manage_website"]}><AdminCheckoutTemplate /></Admin>} />
            <Route path="/admin/website/product-template" element={<Admin requiredPermissions={["manage_website"]}><AdminProductTemplate /></Admin>} />
            <Route path="/admin/website/category-template" element={<Admin requiredPermissions={["manage_website"]}><AdminCategoryTemplate /></Admin>} />
            <Route path="/admin/website/thank-you" element={<Admin requiredPermissions={["manage_website"]}><AdminThankYouTemplate /></Admin>} />
            <Route path="/admin/website/landing-pages" element={<Admin requiredPermissions={["manage_landing_pages"]}><AdminLandingPages /></Admin>} />
            <Route path="/admin/website/landing-pages/analytics" element={<Admin requiredPermissions={["view_analytics"]}><AdminLandingPageAnalytics /></Admin>} />
            <Route path="/admin/website/analytics" element={<Admin requiredPermissions={["view_analytics"]}><AdminWebsiteAnalytics /></Admin>} />
            <Route path="/admin/website/payment" element={<Admin requiredPermissions={["manage_website"]}><AdminPayment /></Admin>} />
            <Route path="/admin/website/pages" element={<Admin requiredPermissions={["manage_website"]}><AdminPages /></Admin>} />
            <Route path="/admin/website/settings" element={<Admin requiredPermissions={["manage_website"]}><AdminWebsiteSettings /></Admin>} />
            <Route path="/admin/website/memo-template" element={<Admin requiredPermissions={["manage_website"]}><AdminMemoTemplate /></Admin>} />
            <Route path="/admin/reports" element={<Admin requiredPermissions={["view_reports"]}><AdminReports /></Admin>} />
            <Route path="/admin/finance" element={<Admin requiredPermissions={["view_finance"]}><AdminFinance /></Admin>} />
            <Route path="/admin/inventory" element={<Admin requiredPermissions={["view_products"]}><AdminInventory /></Admin>} />
            <Route path="/admin/invoices" element={<Admin requiredPermissions={["view_finance"]}><AdminInvoices /></Admin>} />
            <Route path="/admin/coupons" element={<Admin requiredPermissions={["manage_settings"]}><AdminCoupons /></Admin>} />
            <Route path="/admin/reviews" element={<Admin requiredPermissions={["manage_settings"]}><AdminReviews /></Admin>} />
            <Route path="/admin/planning" element={<Admin requiredPermissions={["manage_settings"]}><AdminPlanning /></Admin>} />
            <Route path="/admin/tasks" element={<Admin requiredPermissions={["view_dashboard"]}><AdminTasks /></Admin>} />
            <Route path="/admin/analytics" element={<Admin requiredPermissions={["view_analytics"]}><AdminAnalytics /></Admin>} />
            <Route path="/admin/meta-ads" element={<Admin requiredPermissions={["manage_meta_ads"]}><AdminMetaAds /></Admin>} />
            <Route path="/admin/api-keys" element={<Admin requiredPermissions={["manage_settings"]}><AdminApiKeys /></Admin>} />
            <Route path="/admin/courier" element={<Admin requiredPermissions={["manage_courier"]}><AdminCourier /></Admin>} />
            <Route path="/admin/automation" element={<Admin requiredPermissions={["manage_automation"]}><AdminAutomation /></Admin>} />
            <Route path="/admin/backup" element={<Admin requiredPermissions={["manage_backup"]}><AdminBackup /></Admin>} />
            <Route path="/admin/profile" element={<Admin><AdminProfile /></Admin>} />
            <Route path="/admin/whatsapp" element={<Admin requiredPermissions={["manage_whatsapp"]}><AdminWhatsApp /></Admin>} />
            <Route path="/admin/rider" element={<Admin requiredPermissions={["view_delivery_assignments"]}><RiderDashboard /></Admin>} />
            <Route path="/admin/delivery-riders" element={<Admin requiredPermissions={["manage_delivery_assignments"]}><AdminRiderManagement /></Admin>} />
            <Route path="/admin/support" element={P("Support", "Customer support", ["manage_settings"])} />
            <Route path="/admin/coming-soon" element={<Admin requiredPermissions={["manage_settings"]}><AdminComingSoon /></Admin>} />
            <Route path="/admin/plan" element={P("Plan", "Subscription management", ["manage_settings"])} />
            <Route path="/lp/:slug" element={<LandingPageView />} />
            <Route path="/lp/:slug/checkout" element={<LandingPageCheckout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
  <Analytics />
  <SpeedInsights />
  </ErrorBoundary>
);
};

export default App;
