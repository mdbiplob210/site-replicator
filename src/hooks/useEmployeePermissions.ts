import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const ALL_PERMISSIONS = [
  // Orders - অর্ডার ম্যানেজমেন্ট
  { key: "view_orders", label: "অর্ডার দেখা", group: "অর্ডার", description: "সব অর্ডার দেখতে পারবে" },
  { key: "create_orders", label: "নতুন অর্ডার তৈরি", group: "অর্ডার", description: "ম্যানুয়ালি অর্ডার তৈরি করতে পারবে" },
  { key: "edit_orders", label: "অর্ডার এডিট", group: "অর্ডার", description: "অর্ডারের তথ্য পরিবর্তন করতে পারবে" },
  { key: "delete_orders", label: "অর্ডার ডিলিট", group: "অর্ডার", description: "অর্ডার মুছে ফেলতে পারবে" },
  { key: "change_order_status", label: "স্ট্যাটাস পরিবর্তন", group: "অর্ডার", description: "অর্ডার স্ট্যাটাস বদলাতে পারবে" },

  // Products - প্রোডাক্ট ম্যানেজমেন্ট
  { key: "view_products", label: "প্রোডাক্ট দেখা", group: "প্রোডাক্ট", description: "সব প্রোডাক্ট দেখতে পারবে" },
  { key: "create_products", label: "নতুন প্রোডাক্ট তৈরি", group: "প্রোডাক্ট", description: "নতুন প্রোডাক্ট যোগ করতে পারবে" },
  { key: "edit_products", label: "প্রোডাক্ট এডিট", group: "প্রোডাক্ট", description: "প্রোডাক্ট তথ্য পরিবর্তন করতে পারবে" },
  { key: "delete_products", label: "প্রোডাক্ট ডিলিট", group: "প্রোডাক্ট", description: "প্রোডাক্ট মুছে ফেলতে পারবে" },
  { key: "manage_categories", label: "ক্যাটাগরি ম্যানেজ", group: "প্রোডাক্ট", description: "ক্যাটাগরি তৈরি/এডিট/ডিলিট করতে পারবে" },

  // Finance - ফিন্যান্স ও হিসাব
  { key: "view_finance", label: "ফিন্যান্স দেখা", group: "ফিন্যান্স", description: "আয়-ব্যয় ও হিসাব দেখতে পারবে" },
  { key: "edit_finance", label: "ফিন্যান্স এডিট", group: "ফিন্যান্স", description: "আয়-ব্যয় যোগ/এডিট করতে পারবে" },

  // Dashboard & Analytics - ড্যাশবোর্ড ও রিপোর্ট
  { key: "view_dashboard", label: "ড্যাশবোর্ড দেখা", group: "ড্যাশবোর্ড ও রিপোর্ট", description: "ড্যাশবোর্ড পেজ দেখতে পারবে" },
  { key: "view_analytics", label: "এনালিটিক্স দেখা", group: "ড্যাশবোর্ড ও রিপোর্ট", description: "বিস্তারিত এনালিটিক্স দেখতে পারবে" },
  { key: "view_reports", label: "রিপোর্ট দেখা", group: "ড্যাশবোর্ড ও রিপোর্ট", description: "সব রিপোর্ট ডাউনলোড ও দেখতে পারবে" },

  // Website - ওয়েবসাইট ম্যানেজমেন্ট
  { key: "manage_website", label: "ওয়েবসাইট সেটিংস", group: "ওয়েবসাইট", description: "ওয়েবসাইট টেমপ্লেট ও সেটিংস পরিবর্তন করতে পারবে" },
  { key: "manage_landing_pages", label: "ল্যান্ডিং পেজ ম্যানেজ", group: "ওয়েবসাইট", description: "ল্যান্ডিং পেজ তৈরি/এডিট করতে পারবে" },
  { key: "manage_banners", label: "ব্যানার ম্যানেজ", group: "ওয়েবসাইট", description: "ওয়েবসাইটের ব্যানার পরিবর্তন করতে পারবে" },

  // Marketing - মার্কেটিং
  { key: "manage_meta_ads", label: "মেটা অ্যাডস ম্যানেজ", group: "মার্কেটিং", description: "Meta Ads ডেটা দেখা ও সিঙ্ক করতে পারবে" },

  // Courier - কুরিয়ার
  { key: "manage_courier", label: "কুরিয়ার ম্যানেজ", group: "কুরিয়ার", description: "কুরিয়ার সার্ভিস ও শিপমেন্ট ম্যানেজ করতে পারবে" },

  // System - সিস্টেম অ্যাডমিন
  { key: "manage_users", label: "ইউজার ম্যানেজ", group: "সিস্টেম", description: "ইউজার ও এমপ্লয়ি তৈরি/এডিট করতে পারবে" },
  { key: "manage_settings", label: "সেটিংস ম্যানেজ", group: "সিস্টেম", description: "সাইট সেটিংস পরিবর্তন করতে পারবে" },
  { key: "manage_automation", label: "অটোমেশন ম্যানেজ", group: "সিস্টেম", description: "অটোমেশন রুল তৈরি/পরিবর্তন করতে পারবে" },
  { key: "manage_backup", label: "ব্যাকআপ ম্যানেজ", group: "সিস্টেম", description: "ডেটা ব্যাকআপ ও রিস্টোর করতে পারবে" },
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
