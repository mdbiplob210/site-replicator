import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Helper to get or create visitor/session IDs
function getVisitorId(): string {
  let id = localStorage.getItem("wa_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wa_visitor_id", id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem("wa_session_id");
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem("wa_session_id", id);
  }
  return id;
}

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

// Track an event
export async function trackWebsiteEvent(params: {
  event_type: string;
  page_path: string;
  page_title?: string;
  product_id?: string;
  product_name?: string;
  product_code?: string;
}) {
  try {
    await supabase.from("website_events" as any).insert({
      event_type: params.event_type,
      page_path: params.page_path,
      page_title: params.page_title || document.title,
      product_id: params.product_id || null,
      product_name: params.product_name || null,
      product_code: params.product_code || null,
      visitor_id: getVisitorId(),
      session_id: getSessionId(),
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      device_type: getDeviceType(),
    });
  } catch (e) {
    console.error("[WebsiteAnalytics] Track error:", e);
  }
}

// ===================== QUERY HOOKS =====================

export interface WebsiteAnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  totalSessions: number;
  totalProductViews: number;
  totalAddToCart: number;
  totalPurchases: number;
  conversionRate: number;
  bounceRate: number;
  topPages: { path: string; views: number }[];
  topProducts: { name: string; code: string; views: number; purchases: number; conversionRate: number }[];
  deviceBreakdown: { device: string; count: number; percentage: number }[];
  dailyTrend: { date: string; page_views: number; product_views: number; purchases: number }[];
  hourlyHeatmap: { hour: number; count: number }[];
  referrerBreakdown: { source: string; count: number }[];
}

export function useWebsiteAnalytics(days = 7) {
  return useQuery({
    queryKey: ["website-analytics", days],
    queryFn: async (): Promise<WebsiteAnalyticsSummary> => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("website_events" as any)
        .select("*")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      const events = data as any[];

      // Basic counts
      const pageViews = events.filter((e) => e.event_type === "page_view");
      const productViews = events.filter((e) => e.event_type === "product_view");
      const addToCart = events.filter((e) => e.event_type === "add_to_cart");
      const purchases = events.filter((e) => e.event_type === "purchase");

      const uniqueVisitors = new Set(events.map((e) => e.visitor_id).filter(Boolean)).size;
      const totalSessions = new Set(events.map((e) => e.session_id).filter(Boolean)).size;

      // Bounce rate: sessions with only 1 event
      const sessionEvents: Record<string, number> = {};
      events.forEach((e) => {
        if (e.session_id) sessionEvents[e.session_id] = (sessionEvents[e.session_id] || 0) + 1;
      });
      const bounceSessions = Object.values(sessionEvents).filter((c) => c === 1).length;
      const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

      // Top pages
      const pageMap: Record<string, number> = {};
      pageViews.forEach((e) => {
        pageMap[e.page_path] = (pageMap[e.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageMap)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Top products
      const productMap: Record<string, { name: string; code: string; views: number; purchases: number }> = {};
      productViews.forEach((e) => {
        const key = e.product_code || e.product_name || "unknown";
        if (!productMap[key]) productMap[key] = { name: e.product_name || key, code: e.product_code || "", views: 0, purchases: 0 };
        productMap[key].views++;
      });
      purchases.forEach((e) => {
        const key = e.product_code || e.product_name || "unknown";
        if (!productMap[key]) productMap[key] = { name: e.product_name || key, code: e.product_code || "", views: 0, purchases: 0 };
        productMap[key].purchases++;
      });
      const topProducts = Object.values(productMap)
        .map((p) => ({ ...p, conversionRate: p.views > 0 ? (p.purchases / p.views) * 100 : 0 }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 15);

      // Device breakdown
      const deviceMap: Record<string, number> = {};
      events.forEach((e) => {
        const d = e.device_type || "unknown";
        deviceMap[d] = (deviceMap[d] || 0) + 1;
      });
      const totalDeviceEvents = Object.values(deviceMap).reduce((a, b) => a + b, 0);
      const deviceBreakdown = Object.entries(deviceMap).map(([device, count]) => ({
        device,
        count,
        percentage: totalDeviceEvents > 0 ? (count / totalDeviceEvents) * 100 : 0,
      }));

      // Daily trend
      const dailyMap: Record<string, { page_views: number; product_views: number; purchases: number }> = {};
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        dailyMap[d.toISOString().split("T")[0]] = { page_views: 0, product_views: 0, purchases: 0 };
      }
      events.forEach((e) => {
        const key = e.created_at.split("T")[0];
        if (!dailyMap[key]) dailyMap[key] = { page_views: 0, product_views: 0, purchases: 0 };
        if (e.event_type === "page_view") dailyMap[key].page_views++;
        else if (e.event_type === "product_view") dailyMap[key].product_views++;
        else if (e.event_type === "purchase") dailyMap[key].purchases++;
      });
      const dailyTrend = Object.entries(dailyMap).map(([date, stats]) => ({ date, ...stats }));

      // Hourly heatmap
      const hourlyMap: Record<number, number> = {};
      for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
      events.forEach((e) => {
        const hour = new Date(e.created_at).getHours();
        hourlyMap[hour]++;
      });
      const hourlyHeatmap = Object.entries(hourlyMap).map(([hour, count]) => ({ hour: Number(hour), count }));

      // Referrer breakdown
      const refMap: Record<string, number> = {};
      events.forEach((e) => {
        let source = "Direct";
        if (e.referrer) {
          try {
            const url = new URL(e.referrer);
            source = url.hostname.replace("www.", "");
          } catch {
            source = e.referrer.slice(0, 30);
          }
        }
        refMap[source] = (refMap[source] || 0) + 1;
      });
      const referrerBreakdown = Object.entries(refMap)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        totalPageViews: pageViews.length,
        uniqueVisitors,
        totalSessions,
        totalProductViews: productViews.length,
        totalAddToCart: addToCart.length,
        totalPurchases: purchases.length,
        conversionRate: pageViews.length > 0 ? (purchases.length / pageViews.length) * 100 : 0,
        bounceRate,
        topPages,
        topProducts,
        deviceBreakdown,
        dailyTrend,
        hourlyHeatmap,
        referrerBreakdown,
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}
