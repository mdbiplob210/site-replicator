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
import AdminPlaceholder from "./pages/admin/AdminPlaceholder";

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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="/admin/orders" element={<ProtectedAdminRoute><AdminOrders /></ProtectedAdminRoute>} />
          <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
          <Route path="/admin/roles" element={<ProtectedAdminRoute><AdminRoles /></ProtectedAdminRoute>} />
          <Route path="/admin/settings" element={<ProtectedAdminRoute><AdminSettings /></ProtectedAdminRoute>} />
          <Route path="/admin/screenshots" element={<ProtectedAdminRoute><AdminScreenshots /></ProtectedAdminRoute>} />
          <Route path="/admin/products" element={P("Products", "Manage your product catalog")} />
          <Route path="/admin/website" element={P("Website", "Manage your website settings")} />
          <Route path="/admin/reports" element={P("Reports", "View business reports")} />
          <Route path="/admin/finance" element={P("Finance", "Manage finances and accounting")} />
          <Route path="/admin/planning" element={P("Planning", "Business planning tools")} />
          <Route path="/admin/tasks" element={P("Tasks", "Task management")} />
          <Route path="/admin/analytics" element={P("Analytics", "Business analytics and insights")} />
          <Route path="/admin/meta-ads" element={P("Meta Ads", "Facebook & Instagram advertising")} />
          <Route path="/admin/automation" element={P("Automation", "Automate your workflows")} />
          <Route path="/admin/backup" element={P("Backup", "Data backup management")} />
          <Route path="/admin/support" element={P("Support", "Customer support")} />
          <Route path="/admin/coming-soon" element={<ProtectedAdminRoute><AdminComingSoon /></ProtectedAdminRoute>} />
          <Route path="/admin/plan" element={P("Plan", "Subscription management")} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
