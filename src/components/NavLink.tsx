import { NavLink as RouterNavLink, NavLinkProps, useLocation, useNavigate } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onClick, ...props }, ref) => {
    const location = useLocation();
    const navigate = useNavigate();

    const handleClick = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        const targetPath = typeof to === "string" ? to : to.pathname || "";
        // If already on this path, force a fresh navigation (resets component state)
        if (location.pathname === targetPath || location.pathname.startsWith(targetPath + "/")) {
          e.preventDefault();
          // Navigate away briefly then back, to force React Router to re-mount
          navigate(targetPath, { replace: true, state: { _refresh: Date.now() } });
        }
        onClick?.(e);
      },
      [to, location.pathname, navigate, onClick],
    );

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onClick={handleClick}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
