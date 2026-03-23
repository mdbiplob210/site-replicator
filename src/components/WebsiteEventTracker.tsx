import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

/**
 * WebsiteEventTracker - Tracks page_view events on every route change.
 * Also sends heartbeat for live visitor tracking.
 */
export function WebsiteEventTracker() {
  const location = useLocation();
  const lastPath = useRef<string | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Heartbeat for live visitor tracking
  useEffect(() => {
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/login")) return;

    const sendHeartbeat = () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!projectId || !anonKey) return;
        const url = `https://${projectId}.supabase.co/functions/v1/visitor-heartbeat`;
        let vid = localStorage.getItem("wa_visitor_id") || "";
        fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: anonKey },
          body: JSON.stringify({
            visitor_id: vid,
            page_slug: location.pathname,
          }),
          keepalive: true,
        }).catch(() => {});
      } catch {}
    };

    sendHeartbeat();
    heartbeatRef.current = setInterval(sendHeartbeat, 30000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [location.pathname]);

  useEffect(() => {
    // Don't track admin pages or landing pages (they have their own tracking)
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/login") || location.pathname.startsWith("/lp/")) return;

    if (location.pathname !== lastPath.current) {
      lastPath.current = location.pathname;
      const schedule = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 3000));
      schedule(() => {
        import("@/hooks/useWebsiteAnalytics").then(({ trackWebsiteEvent }) => {
          trackWebsiteEvent({
            event_type: "page_view",
            page_path: location.pathname,
            page_title: document.title,
          });
        });
      });
    }
  }, [location.pathname]);

  return null;
}
