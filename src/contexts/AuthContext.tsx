import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { trackLoginActivity } from "@/hooks/useUserTracking";

export type AppRole = "admin" | "moderator" | "manager" | "user" | "accounting" | "ad_analytics";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  userRoles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isAdmin: false,
  userRoles: [],
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

// Display name map for roles
export const ROLE_DISPLAY_NAMES: Record<AppRole, string> = {
  admin: "অ্যাডমিন",
  moderator: "ম্যানেজার",
  manager: "ম্যানেজার",
  user: "ইউজার",
  accounting: "অ্যাকাউন্টিং",
  ad_analytics: "অ্যাড অ্যানালিটিক্স",
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    
    const roles = (data || []).map(r => r.role as AppRole);
    setUserRoles(roles);
    setIsAdmin(roles.includes("admin"));
  };

  const loginTrackedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let initialSessionResolved = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => checkRoles(session.user.id), 0);

          if (event === "SIGNED_IN" && !loginTrackedRef.current.has(session.user.id)) {
            loginTrackedRef.current.add(session.user.id);
            setTimeout(() => {
              trackLoginActivity(session.user.id, session.user.email || "", "success");
            }, 100);
          }
        } else {
          setIsAdmin(false);
          setUserRoles([]);
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
        checkRoles(session.user.id).finally(() => {
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
    <AuthContext.Provider value={{ session, user, isAdmin, userRoles, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
