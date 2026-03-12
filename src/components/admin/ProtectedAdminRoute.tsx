import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, AppRole } from "@/contexts/AuthContext";

interface ProtectedAdminRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
}

export function ProtectedAdminRoute({ children, allowedRoles }: ProtectedAdminRouteProps) {
  const { user, userRoles, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Must have at least one role
  if (userRoles.length === 0) return <Navigate to="/" replace />;

  // Admin always has access to everything
  if (isAdmin) return <>{children}</>;

  // If specific roles are required, check them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasAccess = userRoles.some(role => allowedRoles.includes(role));
    if (!hasAccess) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}
