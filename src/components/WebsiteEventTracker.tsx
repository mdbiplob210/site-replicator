import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackWebsiteEvent } from "@/hooks/useWebsiteAnalytics";

/**
 * WebsiteEventTracker - Tracks page_view events on every route change.
 * Uses requestIdleCallback to avoid blocking main thread.
 */
export function WebsiteEventTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Don't track admin pages or landing pages (they have their own tracking)
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/login") || location.pathname.startsWith("/lp/")) return;

    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      // Use requestIdleCallback to avoid blocking rendering
      const schedule = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 150));
      schedule(() => {
        trackWebsiteEvent({
          event_type: "page_view",
          page_path: location.pathname,
          page_title: document.title,
        });
      });
    }
  }, [location.pathname]);

  return null;
}
