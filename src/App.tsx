import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import { TrackingInitializer } from "./components/TrackingInitializer";
import { useDynamicMeta } from "@/hooks/useDynamicMeta";
import { SpeedInsights } from "@vercel/speed-insights/react";

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
const AdminPayment = lazy(() => import("./pages/admin/AdminPayment"));
const AdminInvoices = lazy(() => import("./pages/admin/AdminInvoices"));
const AdminPages = lazy(() => import("./pages/admin/AdminPages"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminWhatsApp = lazy(() => import("./pages/admin/AdminWhatsApp"));

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

const P = (title: string, desc?: string) => (
  <ProtectedAdminRoute>
    <Suspense fallback={<PageLoader />}>
      <AdminPlaceholder title={title} description={desc} />
    </Suspense>
  </ProtectedAdminRoute>
);

const Admin = ({ children }: { children: React.ReactNode }) => (
  <ProtectedAdminRoute>
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
      <SpeedInsights />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <TrackingInitializer />
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
            <Route path="/admin" element={<Admin><AdminDashboard /></Admin>} />
            <Route path="/admin/orders" element={<Admin><AdminOrders /></Admin>} />
            <Route path="/admin/users" element={<Admin><AdminUsers /></Admin>} />
            <Route path="/admin/roles" element={<Admin><AdminRoles /></Admin>} />
            <Route path="/admin/settings" element={<Admin><AdminSettings /></Admin>} />
            <Route path="/admin/products" element={<Admin><AdminProducts /></Admin>} />
            <Route path="/admin/website" element={<Admin><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/main-template" element={<Admin><AdminMainTemplate /></Admin>} />
            <Route path="/admin/website/checkout-template" element={<Admin><AdminCheckoutTemplate /></Admin>} />
            <Route path="/admin/website/product-template" element={<Admin><AdminProductTemplate /></Admin>} />
            <Route path="/admin/website/category-template" element={<Admin><AdminCategoryTemplate /></Admin>} />
            <Route path="/admin/website/thank-you" element={<Admin><AdminThankYouTemplate /></Admin>} />
            <Route path="/admin/website/landing-pages" element={<Admin><AdminLandingPages /></Admin>} />
            <Route path="/admin/website/landing-pages/analytics" element={<Admin><AdminLandingPageAnalytics /></Admin>} />
            <Route path="/admin/website/payment" element={<Admin><AdminPayment /></Admin>} />
            <Route path="/admin/website/pages" element={<Admin><AdminPages /></Admin>} />
            <Route path="/admin/website/settings" element={<Admin><AdminWebsiteSettings /></Admin>} />
            <Route path="/admin/reports" element={<Admin><AdminReports /></Admin>} />
            <Route path="/admin/finance" element={<Admin><AdminFinance /></Admin>} />
            <Route path="/admin/planning" element={<Admin><AdminPlanning /></Admin>} />
            <Route path="/admin/tasks" element={<Admin><AdminTasks /></Admin>} />
            <Route path="/admin/analytics" element={<Admin><AdminAnalytics /></Admin>} />
            <Route path="/admin/meta-ads" element={<Admin><AdminMetaAds /></Admin>} />
            <Route path="/admin/orders/backfill-items" element={<Admin><AdminBackfillOrderItems /></Admin>} />
            <Route path="/admin/api-keys" element={<Admin><AdminApiKeys /></Admin>} />
            <Route path="/admin/courier" element={<Admin><AdminCourier /></Admin>} />
            <Route path="/admin/automation" element={<Admin><AdminAutomation /></Admin>} />
            <Route path="/admin/backup" element={<Admin><AdminBackup /></Admin>} />
            <Route path="/admin/invoices" element={<Admin><AdminInvoices /></Admin>} />
            <Route path="/admin/profile" element={<Admin><AdminProfile /></Admin>} />
            <Route path="/admin/whatsapp" element={<Admin><AdminWhatsApp /></Admin>} />
            <Route path="/admin/support" element={P("Support", "Customer support")} />
            <Route path="/admin/coming-soon" element={<Admin><AdminComingSoon /></Admin>} />
            <Route path="/admin/plan" element={P("Plan", "Subscription management")} />
            <Route path="/lp/:slug" element={<LandingPageView />} />
            <Route path="/lp/:slug/checkout" element={<LandingPageCheckout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);
};

export default App;
