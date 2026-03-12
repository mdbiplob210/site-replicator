import { lazy, Suspense } from "react";
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

const DynamicMetaProvider = () => { useDynamicMeta(); return null; };

// StorePage also lazy-loaded now for better code splitting
const StorePage = lazy(() => import("./pages/store/StorePage"));

// Lazy-loaded public pages
const ProductDetail = lazy(() => import("./pages/store/ProductDetail"));
const CheckoutPage = lazy(() => import("./pages/store/CheckoutPage"));
const OrderSuccess = lazy(() => import("./pages/store/OrderSuccess"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
const LandingPageView = lazy(() => import("./pages/LandingPageView"));
// LandingPageCheckout removed - checkout is now handled within single HTML
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
      gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
      refetchOnWindowFocus: false, // Don't refetch on tab switch
      retry: 1, // Only 1 retry on failure
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
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/store/product/:slug" element={<ProductDetail />} />
            <Route path="/store/checkout" element={<CheckoutPage />} />
            <Route path="/store/order-success" element={<OrderSuccess />} />
            <Route path="/login" element={<Login />} />
            {/* Dashboard - all roles */}
            <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
            {/* Orders - admin, manager, moderator, user */}
            <Route path="/admin/orders" element={<Admin allowedRoles={["manager", "moderator", "user"]}><AdminOrders /></Admin>} />
            <Route path="/admin/orders/backfill-items" element={<Admin><AdminBackfillOrderItems /></Admin>} />
            {/* Users & Roles - admin only */}
            <Route path="/admin/users" element={<Admin allowedRoles={[]}><AdminUsers /></Admin>} />
            <Route path="/admin/roles" element={<Admin allowedRoles={[]}><AdminRoles /></Admin>} />
            <Route path="/admin/settings" element={<Admin allowedRoles={[]}><AdminSettings /></Admin>} />
            {/* Products - admin, manager, moderator */}
            <Route path="/admin/products" element={<Admin allowedRoles={["manager", "moderator"]}><AdminProducts /></Admin>} />
            {/* Website - admin only */}
            <Route path="/admin/website" element={<Admin allowedRoles={[]}><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/main-template" element={<Admin allowedRoles={[]}><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/checkout-template" element={<Admin allowedRoles={[]}><AdminCheckoutTemplate /></Admin>} />
            <Route path="/admin/website/product-template" element={<Admin allowedRoles={[]}><AdminProductTemplate /></Admin>} />
            <Route path="/admin/website/category-template" element={<Admin allowedRoles={[]}><AdminCategoryTemplate /></Admin>} />
            <Route path="/admin/website/thank-you" element={<Admin allowedRoles={[]}><AdminThankYouTemplate /></Admin>} />
            <Route path="/admin/website/landing-pages" element={<Admin allowedRoles={[]}><AdminLandingPages /></Admin>} />
            <Route path="/admin/website/landing-pages/analytics" element={<Admin allowedRoles={[]}><AdminLandingPageAnalytics /></Admin>} />
            <Route path="/admin/website/analytics" element={<Admin allowedRoles={[]}><AdminWebsiteAnalytics /></Admin>} />
            <Route path="/admin/website/payment" element={<Admin allowedRoles={[]}><AdminPayment /></Admin>} />
            <Route path="/admin/website/pages" element={<Admin allowedRoles={[]}><AdminPages /></Admin>} />
            <Route path="/admin/website/settings" element={<Admin allowedRoles={[]}><AdminWebsiteSettings /></Admin>} />
            <Route path="/admin/website/memo-template" element={<Admin allowedRoles={[]}><AdminMemoTemplate /></Admin>} />
            {/* Reports - admin only */}
            <Route path="/admin/reports" element={<Admin allowedRoles={[]}><AdminReports /></Admin>} />
            {/* Finance - admin, accounting */}
            <Route path="/admin/finance" element={<Admin allowedRoles={["accounting"]}><AdminFinance /></Admin>} />
            {/* Invoices - admin, accounting */}
            <Route path="/admin/invoices" element={<Admin allowedRoles={["accounting"]}><AdminInvoices /></Admin>} />
            {/* Planning - admin only */}
            <Route path="/admin/planning" element={<Admin allowedRoles={[]}><AdminPlanning /></Admin>} />
            {/* Tasks - admin, manager, moderator */}
            <Route path="/admin/tasks" element={<Admin allowedRoles={["manager", "moderator"]}><AdminTasks /></Admin>} />
            {/* Analytics - admin, ad_analytics */}
            <Route path="/admin/analytics" element={<Admin allowedRoles={["ad_analytics"]}><AdminAnalytics /></Admin>} />
            {/* Meta Ads - admin, ad_analytics */}
            <Route path="/admin/meta-ads" element={<Admin allowedRoles={["ad_analytics"]}><AdminMetaAds /></Admin>} />
            {/* API Keys - admin only */}
            <Route path="/admin/api-keys" element={<Admin allowedRoles={[]}><AdminApiKeys /></Admin>} />
            {/* Courier - admin only */}
            <Route path="/admin/courier" element={<Admin allowedRoles={[]}><AdminCourier /></Admin>} />
            {/* Automation - admin only */}
            <Route path="/admin/automation" element={<Admin allowedRoles={[]}><AdminAutomation /></Admin>} />
            {/* Backup - admin only */}
            <Route path="/admin/backup" element={<Admin allowedRoles={[]}><AdminBackup /></Admin>} />
            {/* Profile - all roles */}
            <Route path="/admin/profile" element={<Admin><AdminProfile /></Admin>} />
            {/* WhatsApp - admin, moderator, user */}
            <Route path="/admin/whatsapp" element={<Admin allowedRoles={["moderator", "user"]}><AdminWhatsApp /></Admin>} />
            {/* Admin only pages */}
            <Route path="/admin/support" element={P("Support", "Customer support", [])} />
            <Route path="/admin/coming-soon" element={<Admin allowedRoles={[]}><AdminComingSoon /></Admin>} />
            <Route path="/admin/plan" element={P("Plan", "Subscription management", [])} />
            <Route path="/lp/:slug" element={<LandingPageView />} />
            {/* /lp/:slug/checkout route removed - single HTML handles everything */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);
};

export default App;
