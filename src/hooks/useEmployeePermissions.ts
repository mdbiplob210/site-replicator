import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ALL_PERMISSIONS = [
  { key: "view_orders", label: "অর্ডার দেখা", group: "Orders" },
  { key: "edit_orders", label: "অর্ডার এডিট", group: "Orders" },
  { key: "delete_orders", label: "অর্ডার ডিলিট", group: "Orders" },
  { key: "change_order_status", label: "অর্ডার স্ট্যাটাস পরিবর্তন", group: "Orders" },
  { key: "create_orders", label: "নতুন অর্ডার তৈরি", group: "Orders" },
  { key: "view_products", label: "প্রোডাক্ট দেখা", group: "Products" },
  { key: "edit_products", label: "প্রোডাক্ট এডিট", group: "Products" },
  { key: "view_finance", label: "ফিন্যান্স দেখা", group: "Finance" },
  { key: "edit_finance", label: "ফিন্যান্স এডিট", group: "Finance" },
  { key: "view_analytics", label: "এনালিটিক্স দেখা", group: "Analytics" },
  { key: "view_reports", label: "রিপোর্ট দেখা", group: "Reports" },
  { key: "manage_users", label: "ইউজার ম্যানেজ", group: "Admin" },
  { key: "manage_settings", label: "সেটিংস ম্যানেজ", group: "Admin" },
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
      // Get all users with roles (non-admin)
      const { data: userRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const userIds = [...new Set(userRoles?.map(r => r.user_id) || [])];
      if (userIds.length === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      // Get permissions
      const { data: permissions } = await supabase
        .from("employee_permissions")
        .select("user_id, permission")
        .in("user_id", userIds);

      // Get panels
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
      toast.error("পারমিশন আপডেট ব্যর্থ: " + error.message);
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
      toast.success("প্যানেল আপডেট হয়েছে!");
    },
    onError: (error: Error) => {
      toast.error("প্যানেল আপডেট ব্যর্থ: " + error.message);
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
