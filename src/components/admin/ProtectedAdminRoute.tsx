import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, type PermissionKey } from "@/contexts/AuthContext";
import { getDefaultAdminRoute } from "@/lib/adminAccess";

interface ProtectedAdminRouteProps {
  children: ReactNode;
  requiredPermissions?: PermissionKey[];
}

export function ProtectedAdminRoute({ children, requiredPermissions }: ProtectedAdminRouteProps) {
  const location = useLocation();
  const { user, userRoles, userPermissions, isAdmin, hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (userRoles.length === 0) return <Navigate to="/" replace />;

  if (isAdmin) return <>{children}</>;

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.some((perm) => hasPermission(perm));

    if (!hasAccess) {
      const fallbackRoute = getDefaultAdminRoute({
        isAdmin,
        userRoles,
        userPermissions,
      });

      if (!fallbackRoute) {
        return <Navigate to="/" replace />;
      }

      if (location.pathname !== fallbackRoute) {
        return <Navigate to={fallbackRoute} replace />;
      }
    }
  }

  return <>{children}</>;
}
