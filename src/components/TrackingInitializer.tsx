import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTracking } from "@/hooks/useTracking";

/**
 * TrackingInitializer - Placed inside BrowserRouter in App.tsx
 * Auto-initializes all tracking scripts and fires PageView on every route change.
 * Uses requestIdleCallback to avoid blocking the main thread.
 */
export function TrackingInitializer() {
  const { trackPageView, isReady } = useTracking();
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    // Don't fire global website tracking on admin/login/landing routes
    if (
      location.pathname.startsWith("/admin") ||
      location.pathname.startsWith("/login") ||
      location.pathname.startsWith("/lp/")
    ) return;
    // Fire if path changed
    if (location.pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = location.pathname;
      // Small delay to let pixel SDK finish loading, but not too long
      setTimeout(() => trackPageView(document.title), 500);
    }
  }, [isReady, location.pathname, trackPageView]);

  return null;
}
