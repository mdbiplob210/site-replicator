import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface LandingPageEvent {
  id: string;
  landing_page_id: string;
  event_type: string;
  event_name: string | null;
  visitor_id: string | null;
  referrer: string | null;
  created_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  device_type?: string | null;
  browser?: string | null;
  os?: string | null;
  scroll_depth?: number | null;
  session_id?: string | null;
  time_on_page?: number | null;
  screen_width?: number | null;
  screen_height?: number | null;
  country?: string | null;
  city?: string | null;
}

export interface PageAnalyticsSummary {
  landing_page_id: string;
  title: string;
  slug: string;
  views: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

export function useLandingPageEvents(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-events", pageId],
    queryFn: async () => {
      let query = supabase
        .from("landing_page_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (pageId) {
        query = query.eq("landing_page_id", pageId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as LandingPageEvent[];
    },
  });
}

export function useLandingPageAnalyticsSummary() {
  return useQuery({
    queryKey: ["landing-page-analytics-summary"],
    queryFn: async () => {
      const { data: pages, error: pagesError } = await supabase
        .from("landing_pages" as any)
        .select("id, title, slug")
        .order("created_at", { ascending: false });

      if (pagesError) throw pagesError;

      const { data: events, error: eventsError } = await supabase
        .from("landing_page_events" as any)
        .select("landing_page_id, event_type, visitor_id, session_id, time_on_page");

      if (eventsError) throw eventsError;

      const typedPages = pages as unknown as { id: string; title: string; slug: string }[];
      const typedEvents = events as unknown as { landing_page_id: string; event_type: string; visitor_id: string | null; session_id: string | null; time_on_page: number | null }[];

      const summaries: PageAnalyticsSummary[] = typedPages.map((page) => {
        const pageEvents = typedEvents.filter((e) => e.landing_page_id === page.id);
        const views = pageEvents.filter((e) => e.event_type === "view").length;
        const clicks = pageEvents.filter((e) => e.event_type === "click").length;
        const conversions = pageEvents.filter((e) => e.event_type === "conversion").length;

        // Avg time on page from exit events
        const exitEvents = pageEvents.filter((e) => e.event_type === "exit" && e.time_on_page);
        const avgTime = exitEvents.length > 0 ? exitEvents.reduce((s, e) => s + (e.time_on_page || 0), 0) / exitEvents.length : 0;

        // Bounce rate: sessions with only a view event
        const sessions = new Map<string, Set<string>>();
        pageEvents.forEach((e) => {
          const sid = e.session_id || e.visitor_id || "unknown";
          if (!sessions.has(sid)) sessions.set(sid, new Set());
          sessions.get(sid)!.add(e.event_type);
        });
        let bounces = 0;
        sessions.forEach((types) => {
          if (types.size <= 2 && types.has("view") && (types.size === 1 || types.has("exit"))) bounces++;
        });
        const bounceRate = sessions.size > 0 ? (bounces / sessions.size) * 100 : 0;

        return {
          landing_page_id: page.id,
          title: page.title,
          slug: page.slug,
          views,
          clicks,
          conversions,
          ctr: views > 0 ? (clicks / views) * 100 : 0,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0,
          avgTimeOnPage: Math.round(avgTime),
          bounceRate,
        };
      });

      return summaries;
    },
  });
}

export function useLandingPageDailyStats(pageId?: string, days = 7) {
  return useQuery({
    queryKey: ["landing-page-daily-stats", pageId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_type, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true });

      if (pageId) {
        query = query.eq("landing_page_id", pageId);
      }

      const { data, error } = await query;
      if (error) throw error;

      const typedData = data as unknown as { event_type: string; created_at: string }[];

      const dailyMap: Record<string, { views: number; clicks: number; conversions: number }> = {};

      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const key = d.toISOString().split("T")[0];
        dailyMap[key] = { views: 0, clicks: 0, conversions: 0 };
      }

      typedData.forEach((e) => {
        const key = e.created_at.split("T")[0];
        if (!dailyMap[key]) dailyMap[key] = { views: 0, clicks: 0, conversions: 0 };
        if (e.event_type === "view") dailyMap[key].views++;
        else if (e.event_type === "click") dailyMap[key].clicks++;
        else if (e.event_type === "conversion") dailyMap[key].conversions++;
      });

      return Object.entries(dailyMap).map(([date, stats]) => ({
        date,
        ...stats,
      }));
    },
  });
}

// Advanced analytics hooks

export function useLandingPageFunnel(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-funnel", pageId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_type, event_name, visitor_id")
        .gte("created_at", since.toISOString());

      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { event_type: string; event_name: string | null; visitor_id: string | null }[];

      // Count unique visitors per funnel step
      const steps = ["view", "scroll_50", "form_view", "form_start", "phone_entered", "conversion"];
      const stepLabels: Record<string, string> = {
        view: "পেজ ভিউ",
        scroll_50: "৫০% স্ক্রল",
        form_view: "ফর্ম দেখা",
        form_start: "ফর্ম শুরু",
        phone_entered: "ফোন দেওয়া",
        conversion: "অর্ডার",
      };

      const visitors = new Map<string, Set<string>>();
      events.forEach((e) => {
        const key = e.event_type === "funnel" ? (e.event_name || "") : (e.event_type === "scroll" ? (e.event_name || "") : e.event_type);
        const vid = e.visitor_id || "unknown";
        if (!visitors.has(key)) visitors.set(key, new Set());
        visitors.get(key)!.add(vid);
      });

      return steps.map((step) => ({
        step,
        label: stepLabels[step] || step,
        count: visitors.get(step)?.size || 0,
      }));
    },
  });
}

export function useLandingPageUTM(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-utm", pageId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_type, utm_source, utm_medium, utm_campaign, visitor_id")
        .gte("created_at", since.toISOString())
        .in("event_type", ["view", "conversion"]);

      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { event_type: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; visitor_id: string | null }[];

      // Group by source
      const sourceMap = new Map<string, { views: number; conversions: number }>();
      events.forEach((e) => {
        const src = e.utm_source || (e.visitor_id ? "direct" : "unknown");
        if (!sourceMap.has(src)) sourceMap.set(src, { views: 0, conversions: 0 });
        const entry = sourceMap.get(src)!;
        if (e.event_type === "view") entry.views++;
        else if (e.event_type === "conversion") entry.conversions++;
      });

      // Group by campaign
      const campaignMap = new Map<string, { views: number; conversions: number }>();
      events.forEach((e) => {
        const camp = e.utm_campaign || "none";
        if (!campaignMap.has(camp)) campaignMap.set(camp, { views: 0, conversions: 0 });
        const entry = campaignMap.get(camp)!;
        if (e.event_type === "view") entry.views++;
        else if (e.event_type === "conversion") entry.conversions++;
      });

      return {
        sources: Array.from(sourceMap.entries()).map(([name, stats]) => ({
          name, ...stats, rate: stats.views > 0 ? ((stats.conversions / stats.views) * 100) : 0,
        })).sort((a, b) => b.views - a.views),
        campaigns: Array.from(campaignMap.entries()).map(([name, stats]) => ({
          name, ...stats, rate: stats.views > 0 ? ((stats.conversions / stats.views) * 100) : 0,
        })).sort((a, b) => b.views - a.views),
      };
    },
  });
}

export function useLandingPageDeviceStats(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-devices", pageId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_type, device_type, browser, os, visitor_id")
        .eq("event_type", "view")
        .gte("created_at", since.toISOString());

      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { device_type: string | null; browser: string | null; os: string | null; visitor_id: string | null }[];

      const countBy = (key: "device_type" | "browser" | "os") => {
        const map = new Map<string, number>();
        events.forEach((e) => {
          const val = e[key] || "Unknown";
          map.set(val, (map.get(val) || 0) + 1);
        });
        return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
      };

      return {
        devices: countBy("device_type"),
        browsers: countBy("browser"),
        operatingSystems: countBy("os"),
      };
    },
  });
}

export function useLandingPageScrollStats(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-scroll", pageId, days],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_name, visitor_id")
        .eq("event_type", "scroll")
        .gte("created_at", since.toISOString());

      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { event_name: string | null; visitor_id: string | null }[];

      const milestones = ["scroll_25", "scroll_50", "scroll_75", "scroll_100"];
      const labels: Record<string, string> = { scroll_25: "25%", scroll_50: "50%", scroll_75: "75%", scroll_100: "100%" };

      const visitors = new Map<string, Set<string>>();
      events.forEach((e) => {
        const key = e.event_name || "";
        const vid = e.visitor_id || "unknown";
        if (!visitors.has(key)) visitors.set(key, new Set());
        visitors.get(key)!.add(vid);
      });

      return milestones.map((m) => ({
        milestone: labels[m] || m,
        visitors: visitors.get(m)?.size || 0,
      }));
    },
  });
}

export function useLandingPageLiveVisitors(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-live-visitors", pageId],
    refetchInterval: 15000, // Refresh every 15 seconds
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      let query = supabase
        .from("landing_page_events" as any)
        .select("visitor_id, landing_page_id, event_type, created_at, device_type, utm_source")
        .gte("created_at", fiveMinAgo)
        .eq("event_type", "view");

      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { visitor_id: string | null; landing_page_id: string; device_type: string | null; utm_source: string | null; created_at: string }[];

      const uniqueVisitors = new Set(events.map((e) => e.visitor_id || e.created_at));

      return {
        count: uniqueVisitors.size,
        visitors: events.slice(0, 20),
      };
    },
  });
}
