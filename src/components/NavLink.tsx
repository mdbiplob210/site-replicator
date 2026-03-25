import { NavLink as RouterNavLink, NavLinkProps, useLocation, useNavigate } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/lib/routePrefetch";

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
        if (location.pathname === targetPath || location.pathname.startsWith(targetPath + "/")) {
          e.preventDefault();
          navigate(targetPath, { replace: true, state: { _refresh: Date.now() } });
        }
        onClick?.(e);
      },
      [to, location.pathname, navigate, onClick],
    );

    const handleMouseEnter = useCallback(() => {
      const targetPath = typeof to === "string" ? to : to.pathname || "";
      if (targetPath) prefetchRoute(targetPath);
    }, [to]);

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onTouchStart={handleMouseEnter}
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
