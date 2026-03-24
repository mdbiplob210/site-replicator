import type { AppRole, PermissionKey } from "@/contexts/AuthContext";

const DEFAULT_ADMIN_ROUTES: Array<{ permission: PermissionKey; route: string }> = [
  { permission: "view_dashboard", route: "/admin" },
  { permission: "view_orders", route: "/admin/orders" },
  { permission: "edit_orders", route: "/admin/orders/backfill-items" },
  { permission: "view_products", route: "/admin/products" },
  { permission: "view_finance", route: "/admin/finance" },
  { permission: "view_reports", route: "/admin/reports" },
  { permission: "view_analytics", route: "/admin/analytics" },
  { permission: "manage_website", route: "/admin/website" },
  { permission: "manage_landing_pages", route: "/admin/website/landing-pages" },
  { permission: "manage_meta_ads", route: "/admin/meta-ads" },
  { permission: "manage_courier", route: "/admin/courier" },
  { permission: "manage_whatsapp", route: "/admin/whatsapp" },
  { permission: "manage_users", route: "/admin/users" },
  { permission: "manage_settings", route: "/admin/settings" },
  { permission: "manage_automation", route: "/admin/automation" },
  { permission: "manage_backup", route: "/admin/backup" },
  { permission: "view_delivery_assignments", route: "/admin/rider" },
];

interface DefaultAdminRouteOptions {
  isAdmin: boolean;
  userPermissions: PermissionKey[];
  userRoles: AppRole[];
}

export function getDefaultAdminRoute({ isAdmin, userPermissions, userRoles }: DefaultAdminRouteOptions) {
  if (userRoles.length === 0) {
    return null;
  }

  if (isAdmin) {
    return "/admin";
  }

  const permissionSet = new Set(userPermissions);
  const matchedRoute = DEFAULT_ADMIN_ROUTES.find(({ permission }) => permissionSet.has(permission));

  return matchedRoute?.route ?? "/admin/profile";
}
