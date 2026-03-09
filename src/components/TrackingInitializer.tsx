import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useTracking } from "@/hooks/useTracking";

/**
 * TrackingInitializer - Placed inside BrowserRouter in App.tsx
 * Auto-initializes all tracking scripts and fires PageView on every route change.
 */
export function TrackingInitializer() {
  const { trackPageView, isReady } = useTracking();
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    // Fire if path changed OR if this is the first fire after isReady
    if (location.pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = location.pathname;
      // Small delay to let page title update
      setTimeout(() => trackPageView(document.title), 100);
    }
  }, [isReady, location.pathname, trackPageView]);

  return null;
}
