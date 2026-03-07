import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedAdminRoute } from "@/components/admin/ProtectedAdminRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminRoles from "./pages/admin/AdminRoles";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminScreenshots from "./pages/admin/AdminScreenshots";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminComingSoon from "./pages/admin/AdminComingSoon";
import AdminBackup from "./pages/admin/AdminBackup";
import AdminAutomation from "./pages/admin/AdminAutomation";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";
import AdminReports from "./pages/admin/AdminReports";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminPlanning from "./pages/admin/AdminPlanning";
import AdminTasks from "./pages/admin/AdminTasks";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminMetaAds from "./pages/admin/AdminMetaAds";
import AdminBackfillOrderItems from "./pages/admin/AdminBackfillOrderItems";
import AdminWebsiteSettings from "./pages/admin/AdminWebsiteSettings";
import AdminMainTemplate from "./pages/admin/AdminMainTemplate";
import AdminCheckoutTemplate from "./pages/admin/AdminCheckoutTemplate";
import AdminProductTemplate from "./pages/admin/AdminProductTemplate";
import AdminCategoryTemplate from "./pages/admin/AdminCategoryTemplate";
import AdminThankYouTemplate from "./pages/admin/AdminThankYouTemplate";
import AdminLandingPages from "./pages/admin/AdminLandingPages";
import AdminPayment from "./pages/admin/AdminPayment";
import AdminPages from "./pages/admin/AdminPages";
import LandingPageView from "./pages/LandingPageView";
import StorePage from "./pages/store/StorePage";
import ProductDetail from "./pages/store/ProductDetail";
import CheckoutPage from "./pages/store/CheckoutPage";
import OrderSuccess from "./pages/store/OrderSuccess";

const queryClient = new QueryClient();

const P = (title: string, desc?: string) => (
  <ProtectedAdminRoute>
    <AdminPlaceholder title={title} description={desc} />
  </ProtectedAdminRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/store" element={<StorePage />} />
          <Route path="/store/product/:id" element={<ProductDetail />} />
          <Route path="/store/checkout" element={<CheckoutPage />} />
          <Route path="/store/order-success" element={<OrderSuccess />} />
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
          <Route path="/admin/roles" element={<ProtectedAdminRoute><AdminRoles /></ProtectedAdminRoute>} />
          <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
          <Route path="/admin/screenshots" element={<ProtectedAdminRoute><AdminScreenshots /></ProtectedAdminRoute>} />
          <Route path="/admin/products" element={<ProtectedAdminRoute><AdminProducts /></ProtectedAdminRoute>} />
          <Route path="/admin/website" element={<ProtectedAdminRoute><AdminMainTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/main-template" element={<ProtectedAdminRoute><AdminMainTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/checkout-template" element={<ProtectedAdminRoute><AdminCheckoutTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/product-template" element={<ProtectedAdminRoute><AdminProductTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/category-template" element={<ProtectedAdminRoute><AdminCategoryTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/thank-you" element={<ProtectedAdminRoute><AdminThankYouTemplate /></ProtectedAdminRoute>} />
          <Route path="/admin/website/landing-pages" element={<ProtectedAdminRoute><AdminLandingPages /></ProtectedAdminRoute>} />
          <Route path="/admin/website/payment" element={<ProtectedAdminRoute><AdminPayment /></ProtectedAdminRoute>} />
          <Route path="/admin/website/pages" element={<ProtectedAdminRoute><AdminPages /></ProtectedAdminRoute>} />
          <Route path="/admin/website/settings" element={<ProtectedAdminRoute><AdminWebsiteSettings /></ProtectedAdminRoute>} />
          <Route path="/admin/reports" element={<ProtectedAdminRoute><AdminReports /></ProtectedAdminRoute>} />
          <Route path="/admin/finance" element={<ProtectedAdminRoute><AdminFinance /></ProtectedAdminRoute>} />
          <Route path="/admin/planning" element={<ProtectedAdminRoute><AdminPlanning /></ProtectedAdminRoute>} />
          <Route path="/admin/tasks" element={<ProtectedAdminRoute><AdminTasks /></ProtectedAdminRoute>} />
          <Route path="/admin/analytics" element={<ProtectedAdminRoute><AdminAnalytics /></ProtectedAdminRoute>} />
          <Route path="/admin/meta-ads" element={<ProtectedAdminRoute><AdminMetaAds /></ProtectedAdminRoute>} />
          <Route path="/admin/orders/backfill-items" element={<ProtectedAdminRoute><AdminBackfillOrderItems /></ProtectedAdminRoute>} />
          <Route path="/admin/automation" element={<ProtectedAdminRoute><AdminAutomation /></ProtectedAdminRoute>} />
          <Route path="/admin/backup" element={<ProtectedAdminRoute><AdminBackup /></ProtectedAdminRoute>} />
          <Route path="/admin/support" element={P("Support", "Customer support")} />
          <Route path="/admin/coming-soon" element={<ProtectedAdminRoute><AdminComingSoon /></ProtectedAdminRoute>} />
          <Route path="/admin/plan" element={P("Plan", "Subscription management")} />
          <Route path="/lp/:slug" element={<LandingPageView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
