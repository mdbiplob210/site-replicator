import { useEffect } from "react";
import { useTracking, useEngagementTracking } from "@/hooks/useTracking";

/**
 * TrackingInitializer - Place in App.tsx to auto-initialize all tracking scripts
 * and fire PageView on every route change.
 */
export function TrackingInitializer() {
  const { trackPageView, isReady } = useTracking();

  useEffect(() => {
    if (isReady) {
      trackPageView(document.title);
    }
  }, [isReady, trackPageView]);

  return null;
}
