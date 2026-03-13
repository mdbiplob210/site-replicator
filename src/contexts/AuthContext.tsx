import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackLoginActivity } from "@/hooks/useUserTracking";

export type AppRole = "admin" | "moderator" | "manager" | "user" | "accounting" | "ad_analytics";

export type PermissionKey =
  | "view_orders" | "create_orders" | "edit_orders" | "delete_orders" | "change_order_status"
  | "view_products" | "create_products" | "edit_products" | "delete_products" | "manage_categories"
  | "view_finance" | "edit_finance"
  | "view_dashboard" | "view_analytics" | "view_reports"
  | "manage_website" | "manage_landing_pages" | "manage_banners"
  | "manage_meta_ads"
  | "manage_courier" | "print_memo" | "transfer_orders"
  | "manage_whatsapp"
  | "manage_users" | "create_users" | "create_admin_users" | "create_moderator_users" | "create_basic_users"
  | "manage_settings" | "manage_automation" | "manage_backup";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  userRoles: AppRole[];
  userPermissions: PermissionKey[];
  loading: boolean;
  hasPermission: (perm: PermissionKey) => boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  userRoles: [],
  userPermissions: [],
  loading: true,
  hasPermission: () => false,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Display name map for roles
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  manager: "Manager",
  user: "User",
  accounting: "Accounting",
  ad_analytics: "Ad Analytics",
};

// Check if current route needs auth - public store pages don't
function isPublicRoute(): boolean {
  const path = window.location.pathname;
  return !path.startsWith("/admin") && !path.startsWith("/login");
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(() => !isPublicRoute()); // Public pages don't need to wait

  const checkRolesAndPermissions = async (userId: string) => {
    // Fetch roles
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const roles = (rolesData || []).map(r => r.role as AppRole);
    setUserRoles(roles);
    const admin = roles.includes("admin");
    setIsAdmin(admin);

    // Fetch explicit permissions
    if (!admin) {
      const { data: permsData } = await supabase
        .from("employee_permissions")
        .select("permission")
        .eq("user_id", userId);
      
      const perms = (permsData || []).map(p => p.permission as PermissionKey);
      setUserPermissions(perms);
    } else {
      // Admin has all permissions
      setUserPermissions([]);
    }
  };

  const hasPermission = (perm: PermissionKey): boolean => {
    if (isAdmin) return true;
    return userPermissions.includes(perm);
  };

  const loginTrackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let initialSessionResolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkRolesAndPermissions(session.user.id), 0);

          if (event === "SIGNED_IN" && !loginTrackedRef.current.has(session.user.id)) {
            loginTrackedRef.current.add(session.user.id);
            setTimeout(() => {
              trackLoginActivity(session.user.id, session.user.email || "", "success");
            }, 100);
          }
        } else {
          setIsAdmin(false);
          setUserRoles([]);
          setUserPermissions([]);
        }
        if (initialSessionResolved) {
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkRolesAndPermissions(session.user.id).finally(() => {
          initialSessionResolved = true;
          setLoading(false);
        });
      } else {
        initialSessionResolved = true;
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, userRoles, userPermissions, loading, hasPermission, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
