import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackWebsiteEvent } from "@/hooks/useWebsiteAnalytics";

/**
 * WebsiteEventTracker - Tracks page_view events on every route change.
 * Place inside BrowserRouter.
 */
export function WebsiteEventTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Don't track admin pages or landing pages (they have their own tracking)
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/login") || location.pathname.startsWith("/lp/")) return;

    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      // Small delay for title to update
      setTimeout(() => {
        trackWebsiteEvent({
          event_type: "page_view",
          page_path: location.pathname,
          page_title: document.title,
        });
      }, 200);
    }
  }, [location.pathname]);

  return null;
}
