import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackLoginActivity } from "@/hooks/useUserTracking";

export type AppRole = "admin" | "super_admin" | "moderator" | "manager" | "user" | "accounting" | "ad_analytics" | "delivery_rider";

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
  | "manage_settings" | "manage_automation" | "manage_backup"
  | "view_delivery_assignments" | "manage_delivery_assignments";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  userRoles: AppRole[];
  userPermissions: PermissionKey[];
  loading: boolean;
  rolesLoading: boolean;
  rolesResolved: boolean;
  hasPermission: (perm: PermissionKey) => boolean;
  ensureRolesLoaded: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  userRoles: [],
  userPermissions: [],
  loading: true,
  rolesLoading: false,
  rolesResolved: false,
  hasPermission: () => false,
  ensureRolesLoaded: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Display name map for roles
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  admin: "Admin",
  moderator: "Moderator",
  manager: "Manager",
  user: "Employee",
  accounting: "Accounting",
  ad_analytics: "Ad Analytics",
  delivery_rider: "Delivery Rider",
};

// Check if current route needs auth - public store pages don't
function isPublicRoute(): boolean {
  const path = window.location.pathname;
  return !path.startsWith("/admin") && !path.startsWith("/login");
}

function shouldEagerlyResolveRoles(): boolean {
  return !isPublicRoute();
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(() => shouldEagerlyResolveRoles());
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesResolved, setRolesResolved] = useState(() => !shouldEagerlyResolveRoles());

  const hasPermission = (perm: PermissionKey): boolean => {
    if (isAdmin) return true;
    return userPermissions.includes(perm);
  };

  const loginTrackedRef = useRef<Set<string>>(new Set());
  const rolesCheckedRef = useRef<string | null>(null);
  const roleLoadPromiseRef = useRef<Promise<void> | null>(null);

  const clearRoleData = useCallback(() => {
    setIsAdmin(false);
    setUserRoles([]);
    setUserPermissions([]);
  }, []);

  const resolveRolesAndPermissions = useCallback(async (userId: string) => {
    if (rolesCheckedRef.current === userId && rolesResolved) {
      return;
    }

    if (roleLoadPromiseRef.current) {
      return roleLoadPromiseRef.current;
    }

    setRolesLoading(true);

    const loadPromise = (async () => {
      try {
        const queryPromise = Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId),
          supabase.from("employee_permissions").select("permission").eq("user_id", userId),
        ]);

        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => reject(new Error("Role lookup timed out")), 5000);
        });

        const [rolesResult, permissionsResult] = await Promise.race([queryPromise, timeoutPromise]);
        const { data: rolesData, error: rolesError } = rolesResult;
        const { data: permissionsData, error: permissionsError } = permissionsResult;

        if (rolesError) throw rolesError;
        if (permissionsError) throw permissionsError;

        const roles = (rolesData || []).map((row) => row.role as AppRole);
        const admin = roles.includes("admin");

        setUserRoles(roles);
        setIsAdmin(admin);
        setUserPermissions(
          admin ? [] : (permissionsData || []).map((row) => row.permission as PermissionKey),
        );
      } catch (error) {
        console.error("Failed to resolve user roles/permissions:", error);
        clearRoleData();
      } finally {
        rolesCheckedRef.current = userId;
        setRolesResolved(true);
        setRolesLoading(false);
        roleLoadPromiseRef.current = null;
      }
    })();

    roleLoadPromiseRef.current = loadPromise;
    return loadPromise;
  }, [clearRoleData, rolesResolved]);

  const ensureRolesLoaded = useCallback(async () => {
    if (!user?.id) {
      setRolesResolved(true);
      return;
    }

    await resolveRolesAndPermissions(user.id);
  }, [resolveRolesAndPermissions, user?.id]);

  const applySession = useCallback(async (nextSession: Session | null, event?: string) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      rolesCheckedRef.current = null;
      roleLoadPromiseRef.current = null;
      clearRoleData();
      setRolesResolved(true);
      setRolesLoading(false);
      setLoading(false);
      return;
    }

    if (event === "SIGNED_IN" && !loginTrackedRef.current.has(nextSession.user.id)) {
      loginTrackedRef.current.add(nextSession.user.id);
      const schedule = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 2000));
      schedule(() => {
        trackLoginActivity(nextSession.user.id, nextSession.user.email || "", "success");
      });
    }

    if (shouldEagerlyResolveRoles()) {
      setLoading(true);
      await resolveRolesAndPermissions(nextSession.user.id);
      setLoading(false);
      return;
    }

    setLoading(false);

    if (rolesCheckedRef.current !== nextSession.user.id) {
      clearRoleData();
      setRolesResolved(false);
    }
  }, [clearRoleData, resolveRolesAndPermissions]);

  useEffect(() => {
    let disposed = false;
    let bootstrapComplete = false;

    const bootstrap = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!disposed) {
          await applySession(session, "INITIAL_SESSION");
        }
      } finally {
        bootstrapComplete = true;
        if (!disposed && isPublicRoute()) {
          setLoading(false);
        }
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === "INITIAL_SESSION" && bootstrapComplete) return;
      void applySession(nextSession, event);
    });

    void bootstrap();

    return () => {
      disposed = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isAdmin, userRoles, userPermissions, loading, rolesLoading, rolesResolved, hasPermission, ensureRolesLoaded, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
