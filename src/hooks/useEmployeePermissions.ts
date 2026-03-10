import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ALL_PERMISSIONS = [
  // Orders
  { key: "view_orders", label: "View Orders", group: "Orders", description: "Can view all orders" },
  { key: "create_orders", label: "Create Orders", group: "Orders", description: "Can manually create orders" },
  { key: "edit_orders", label: "Edit Orders", group: "Orders", description: "Can modify order details" },
  { key: "delete_orders", label: "Delete Orders", group: "Orders", description: "Can delete orders" },
  { key: "change_order_status", label: "Change Status", group: "Orders", description: "Can change order status" },

  // Products
  { key: "view_products", label: "View Products", group: "Products", description: "Can view all products" },
  { key: "create_products", label: "Create Products", group: "Products", description: "Can add new products" },
  { key: "edit_products", label: "Edit Products", group: "Products", description: "Can modify product details" },
  { key: "delete_products", label: "Delete Products", group: "Products", description: "Can delete products" },
  { key: "manage_categories", label: "Manage Categories", group: "Products", description: "Can create/edit/delete categories" },

  // Finance
  { key: "view_finance", label: "View Finance", group: "Finance", description: "Can view income/expenses and accounts" },
  { key: "edit_finance", label: "Edit Finance", group: "Finance", description: "Can add/edit income and expenses" },

  // Dashboard & Analytics
  { key: "view_dashboard", label: "View Dashboard", group: "Dashboard & Reports", description: "Can view the dashboard page" },
  { key: "view_analytics", label: "View Analytics", group: "Dashboard & Reports", description: "Can view detailed analytics" },
  { key: "view_reports", label: "View Reports", group: "Dashboard & Reports", description: "Can download and view all reports" },

  // Website
  { key: "manage_website", label: "Website Settings", group: "Website", description: "Can change website templates and settings" },
  { key: "manage_landing_pages", label: "Manage Landing Pages", group: "Website", description: "Can create/edit landing pages" },
  { key: "manage_banners", label: "Manage Banners", group: "Website", description: "Can change website banners" },

  // Marketing
  { key: "manage_meta_ads", label: "Manage Meta Ads", group: "Marketing", description: "Can view and sync Meta Ads data" },

  // Courier
  { key: "manage_courier", label: "Manage Courier", group: "Courier", description: "Can manage courier services and shipments" },
  { key: "print_memo", label: "Print Memo", group: "Orders", description: "Can print order memos" },

  // System
  { key: "manage_users", label: "Manage Users", group: "System", description: "Can edit/delete users and employees" },
  { key: "create_users", label: "Create Users", group: "System", description: "Can create new user accounts" },
  { key: "create_admin_users", label: "Create Admins", group: "System", description: "Can create admin role users" },
  { key: "create_moderator_users", label: "Create Moderators", group: "System", description: "Can create moderator role users" },
  { key: "create_basic_users", label: "Create Basic Users", group: "System", description: "Can create basic (user) role users" },
  { key: "manage_settings", label: "Manage Settings", group: "System", description: "Can change site settings" },
  { key: "manage_automation", label: "Manage Automation", group: "System", description: "Can create/modify automation rules" },
  { key: "manage_backup", label: "Manage Backup", group: "System", description: "Can backup and restore data" },
] as const;

export type PermissionKey = typeof ALL_PERMISSIONS[number]["key"];

export interface EmployeeWithPermissions {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  permissions: string[];
  panel?: {
    id: string;
    panel_name: string;
    is_active: boolean;
    max_orders: number;
  } | null;
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const userIds = [...new Set(userRoles?.map(r => r.user_id) || [])];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      const { data: permissions } = await supabase
        .from("employee_permissions")
        .select("user_id, permission")
        .in("user_id", userIds);

      const { data: panels } = await supabase
        .from("employee_panels")
        .select("*")
        .in("user_id", userIds);

      return userIds.map(uid => {
        const profile = profiles?.find(p => p.user_id === uid);
        const userPerms = permissions?.filter(p => p.user_id === uid).map(p => p.permission) || [];
        const panel = panels?.find(p => p.user_id === uid);
        const role = userRoles?.find(r => r.user_id === uid);

        return {
          user_id: uid,
          full_name: profile?.full_name || `User (${uid.slice(0, 8)})`,
          avatar_url: profile?.avatar_url,
          role: role?.role || "user",
          permissions: userPerms,
          panel: panel ? {
            id: panel.id,
            panel_name: panel.panel_name,
            is_active: panel.is_active,
            max_orders: panel.max_orders,
          } : null,
        };
      });
    },
  });
}

export function useTogglePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, permission, grant }: { userId: string; permission: string; grant: boolean }) => {
      if (grant) {
        const { error } = await supabase
          .from("employee_permissions")
          .insert({ user_id: userId, permission: permission as any, granted_by: (await supabase.auth.getUser()).data.user?.id } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_permissions")
          .delete()
          .eq("user_id", userId)
          .eq("permission", permission as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
    },
    onError: (error: Error) => {
      toast.error("Permission update failed: " + error.message);
    },
  });
}

export function useTogglePanel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, panelName, isActive }: { userId: string; panelName: string; isActive: boolean }) => {
      const { data: existing } = await supabase
        .from("employee_panels")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("employee_panels")
          .update({ is_active: isActive, panel_name: panelName } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("employee_panels")
          .insert({ user_id: userId, panel_name: panelName, is_active: isActive } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Panel updated!");
    },
    onError: (error: Error) => {
      toast.error("Panel update failed: " + error.message);
    },
  });
}

export function useOrderAssignments(userId?: string) {
  return useQuery({
    queryKey: ["order-assignments", userId],
    queryFn: async () => {
      let query = supabase
        .from("order_assignments")
        .select("*, orders(*)")
        .order("assigned_at", { ascending: false });

      if (userId) {
        query = query.eq("assigned_to", userId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!userId || userId === undefined,
  });
}

export function usePanelStats() {
  return useQuery({
    queryKey: ["panel-stats"],
    queryFn: async () => {
      const { data: panels, error: panelError } = await supabase
        .from("employee_panels")
        .select("*");
      if (panelError) throw panelError;

      const { data: assignments, error: assignError } = await supabase
        .from("order_assignments")
        .select("assigned_to, status, orders(status)")
        .order("assigned_at", { ascending: false });
      if (assignError) throw assignError;

      const userIds = panels?.map(p => p.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

      return (panels || []).map(panel => {
        const panelAssignments = assignments?.filter(a => a.assigned_to === panel.user_id) || [];
        const pendingCount = panelAssignments.filter(a => a.status === "pending").length;
        const completedCount = panelAssignments.filter(a => a.status === "completed").length;
        const totalCount = panelAssignments.length;
        const profile = profiles?.find(p => p.user_id === panel.user_id);

        return {
          ...panel,
          full_name: profile?.full_name || panel.panel_name,
          pending_orders: pendingCount,
          completed_orders: completedCount,
          total_orders: totalCount,
        };
      });
    },
  });
}
