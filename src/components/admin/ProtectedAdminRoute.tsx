import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { user, userRoles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Allow any user with at least one role to access admin panel
  if (userRoles.length === 0) return <Navigate to="/" replace />;

  return <>{children}</>;
}
