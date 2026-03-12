import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, type PermissionKey } from "@/contexts/AuthContext";

interface ProtectedAdminRouteProps {
  children: ReactNode;
  requiredPermissions?: PermissionKey[];
}

export function ProtectedAdminRoute({ children, requiredPermissions }: ProtectedAdminRouteProps) {
  const { user, userRoles, isAdmin, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  
  // Must have at least one role to access admin panel
  if (userRoles.length === 0) return <Navigate to="/" replace />;

  // Admin always has full access
  if (isAdmin) return <>{children}</>;

  // If specific permissions are required, check them
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.some(perm => hasPermission(perm));
    if (!hasAccess) {
      return <Navigate to="/admin" replace />;
    }
  }

  return <>{children}</>;
}
