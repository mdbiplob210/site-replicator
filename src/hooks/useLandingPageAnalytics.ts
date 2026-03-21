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
  click_x?: number | null;
  click_y?: number | null;
  click_element?: string | null;
  page_height?: number | null;
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

// Helper to build date filter
function getDateRange(days: number, startDate?: string, endDate?: string) {
  if (startDate && endDate) {
    return { since: startDate, until: endDate };
  }
  const since = new Date();
  since.setDate(since.getDate() - days);
  return { since: since.toISOString(), until: new Date().toISOString() };
}

export function useLandingPageEvents(pageId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-events", pageId, startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("landing_page_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (pageId) query = query.eq("landing_page_id", pageId);
      if (startDate) query = query.gte("created_at", startDate);
      if (endDate) query = query.lte("created_at", endDate);

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

      return typedPages.map((page) => {
        const pe = typedEvents.filter((e) => e.landing_page_id === page.id);
        const views = pe.filter((e) => e.event_type === "view").length;
        const clicks = pe.filter((e) => e.event_type === "click").length;
        const conversions = pe.filter((e) => e.event_type === "conversion").length;
        const exitEvents = pe.filter((e) => e.event_type === "exit" && e.time_on_page);
        const avgTime = exitEvents.length > 0 ? exitEvents.reduce((s, e) => s + (e.time_on_page || 0), 0) / exitEvents.length : 0;

        const sessions = new Map<string, Set<string>>();
        pe.forEach((e) => {
          const sid = e.session_id || e.visitor_id || "unknown";
          if (!sessions.has(sid)) sessions.set(sid, new Set());
          sessions.get(sid)!.add(e.event_type);
        });
        let bounces = 0;
        sessions.forEach((types) => {
          if (types.size <= 2 && types.has("view") && (types.size === 1 || types.has("exit"))) bounces++;
        });

        return {
          landing_page_id: page.id,
          title: page.title,
          slug: page.slug,
          views, clicks, conversions,
          ctr: views > 0 ? (clicks / views) * 100 : 0,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0,
          avgTimeOnPage: Math.round(avgTime),
          bounceRate: sessions.size > 0 ? (bounces / sessions.size) * 100 : 0,
        } as PageAnalyticsSummary;
      });
    },
  });
}

export function useLandingPageDailyStats(pageId?: string, days = 7, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-daily-stats", pageId, days, startDate, endDate],
    queryFn: async () => {
      const { since } = getDateRange(days, startDate, endDate);

      let query = supabase
        .from("landing_page_events" as any)
        .select("event_type, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (endDate) query = query.lte("created_at", endDate);
      if (pageId) query = query.eq("landing_page_id", pageId);

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

      return Object.entries(dailyMap).map(([date, stats]) => ({ date, ...stats }));
    },
  });
}

export function useLandingPageFunnel(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-funnel", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("event_type, event_name, visitor_id")
        .gte("created_at", since.toISOString());
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { event_type: string; event_name: string | null; visitor_id: string | null }[];
      const steps = ["view", "scroll_50", "form_view", "form_start", "phone_entered", "conversion"];
      const stepLabels: Record<string, string> = {
        view: "পেজ ভিউ", scroll_50: "৫০% স্ক্রল", form_view: "ফর্ম দেখা",
        form_start: "ফর্ম শুরু", phone_entered: "ফোন দেওয়া", conversion: "অর্ডার",
      };

      const visitors = new Map<string, Set<string>>();
      events.forEach((e) => {
        const key = e.event_type === "funnel" ? (e.event_name || "") : (e.event_type === "scroll" ? (e.event_name || "") : e.event_type);
        const vid = e.visitor_id || "unknown";
        if (!visitors.has(key)) visitors.set(key, new Set());
        visitors.get(key)!.add(vid);
      });

      return steps.map((step) => ({ step, label: stepLabels[step] || step, count: visitors.get(step)?.size || 0 }));
    },
  });
}

export function useLandingPageUTM(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-utm", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("event_type, utm_source, utm_medium, utm_campaign, visitor_id")
        .gte("created_at", since.toISOString())
        .in("event_type", ["view", "conversion"]);
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { event_type: string; utm_source: string | null; utm_medium: string | null; utm_campaign: string | null; visitor_id: string | null }[];

      const groupBy = (keyFn: (e: typeof events[0]) => string) => {
        const map = new Map<string, { views: number; conversions: number }>();
        events.forEach((e) => {
          const key = keyFn(e);
          if (!map.has(key)) map.set(key, { views: 0, conversions: 0 });
          const entry = map.get(key)!;
          if (e.event_type === "view") entry.views++;
          else if (e.event_type === "conversion") entry.conversions++;
        });
        return Array.from(map.entries()).map(([name, stats]) => ({
          name, ...stats, rate: stats.views > 0 ? ((stats.conversions / stats.views) * 100) : 0,
        })).sort((a, b) => b.views - a.views);
      };

      return {
        sources: groupBy((e) => e.utm_source || "direct"),
        campaigns: groupBy((e) => e.utm_campaign || "none"),
      };
    },
  });
}

export function useLandingPageDeviceStats(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-devices", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("device_type, browser, os").eq("event_type", "view")
        .gte("created_at", since.toISOString());
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { device_type: string | null; browser: string | null; os: string | null }[];
      const countBy = (key: "device_type" | "browser" | "os") => {
        const map = new Map<string, number>();
        events.forEach((e) => map.set(e[key] || "Unknown", (map.get(e[key] || "Unknown") || 0) + 1));
        return Array.from(map.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
      };
      return { devices: countBy("device_type"), browsers: countBy("browser"), operatingSystems: countBy("os") };
    },
  });
}

export function useLandingPageScrollStats(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-scroll", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("event_name, visitor_id").eq("event_type", "scroll")
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
        if (!visitors.has(key)) visitors.set(key, new Set());
        visitors.get(key)!.add(e.visitor_id || "unknown");
      });
      return milestones.map((m) => ({ milestone: labels[m] || m, visitors: visitors.get(m)?.size || 0 }));
    },
  });
}

export function useLandingPageLiveVisitors(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-live-visitors", pageId],
    refetchInterval: 15000,
    queryFn: async () => {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      let query = supabase.from("landing_page_events" as any)
        .select("visitor_id, landing_page_id, device_type, utm_source, created_at")
        .gte("created_at", fiveMinAgo).eq("event_type", "view");
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { visitor_id: string | null; landing_page_id: string; device_type: string | null; utm_source: string | null; created_at: string }[];
      return { count: new Set(events.map((e) => e.visitor_id || e.created_at)).size, visitors: events.slice(0, 20) };
    },
  });
}

// Heatmap data (click positions)
export function useLandingPageHeatmap(pageId?: string, days = 30) {
  return useQuery({
    queryKey: ["landing-page-heatmap", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("click_x, click_y, click_element, page_height, event_type")
        .in("event_type", ["click", "conversion"])
        .gte("created_at", since.toISOString())
        .not("click_x", "is", null);
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown as { click_x: number; click_y: number; click_element: string | null; page_height: number | null; event_type: string }[]) || [];
    },
  });
}

// Hourly heatmap
export function useLandingPageHourlyStats(pageId?: string, days = 7) {
  return useQuery({
    queryKey: ["landing-page-hourly", pageId, days],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - days);
      let query = supabase.from("landing_page_events" as any)
        .select("event_type, created_at")
        .eq("event_type", "view")
        .gte("created_at", since.toISOString());
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { created_at: string }[];
      const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
      const grid: { day: string; hour: number; count: number }[] = [];

      // Initialize grid
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          grid.push({ day: dayNames[d], hour: h, count: 0 });
        }
      }

      events.forEach((e) => {
        const dt = new Date(e.created_at);
        const dayIdx = dt.getDay();
        const hour = dt.getHours();
        const idx = dayIdx * 24 + hour;
        if (grid[idx]) grid[idx].count++;
      });

      return grid;
    },
  });
}

// Cohort / retention data
export function useLandingPageCohort(pageId?: string, weeks = 4) {
  return useQuery({
    queryKey: ["landing-page-cohort", pageId, weeks],
    queryFn: async () => {
      const since = new Date(); since.setDate(since.getDate() - weeks * 7);
      let query = supabase.from("landing_page_events" as any)
        .select("visitor_id, created_at, event_type")
        .eq("event_type", "view")
        .gte("created_at", since.toISOString());
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;

      const events = data as unknown as { visitor_id: string | null; created_at: string }[];

      // Group visitors by their first visit week
      const visitorFirstWeek = new Map<string, number>();
      const visitorWeeks = new Map<string, Set<number>>();

      events.forEach((e) => {
        const vid = e.visitor_id || "unknown";
        const dt = new Date(e.created_at);
        const weekNum = Math.floor((Date.now() - dt.getTime()) / (7 * 24 * 60 * 60 * 1000));
        const invertedWeek = weeks - 1 - weekNum;
        if (invertedWeek < 0 || invertedWeek >= weeks) return;

        if (!visitorFirstWeek.has(vid) || invertedWeek < visitorFirstWeek.get(vid)!) {
          visitorFirstWeek.set(vid, invertedWeek);
        }
        if (!visitorWeeks.has(vid)) visitorWeeks.set(vid, new Set());
        visitorWeeks.get(vid)!.add(invertedWeek);
      });

      // Build cohort matrix
      const cohorts: { week: string; total: number; retention: number[] }[] = [];
      for (let w = 0; w < weeks; w++) {
        const cohortVisitors = new Set<string>();
        visitorFirstWeek.forEach((firstWeek, vid) => {
          if (firstWeek === w) cohortVisitors.add(vid);
        });

        const retention: number[] = [];
        for (let r = 0; r <= weeks - 1 - w; r++) {
          let retained = 0;
          cohortVisitors.forEach((vid) => {
            if (visitorWeeks.get(vid)?.has(w + r)) retained++;
          });
          retention.push(cohortVisitors.size > 0 ? Math.round((retained / cohortVisitors.size) * 100) : 0);
        }

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (weeks - 1 - w) * 7);
        cohorts.push({
          week: `সপ্তাহ ${w + 1}`,
          total: cohortVisitors.size,
          retention,
        });
      }

      // New vs returning
      const allVisitors = new Set<string>();
      const returningVisitors = new Set<string>();
      visitorWeeks.forEach((weeks, vid) => {
        allVisitors.add(vid);
        if (weeks.size > 1) returningVisitors.add(vid);
      });

      return {
        cohorts,
        totalVisitors: allVisitors.size,
        newVisitors: allVisitors.size - returningVisitors.size,
        returningVisitors: returningVisitors.size,
        retentionRate: allVisitors.size > 0 ? ((returningVisitors.size / allVisitors.size) * 100) : 0,
      };
    },
  });
}

// Realtime feed (last 50 events)
export function useLandingPageRealtimeFeed(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-feed", pageId],
    refetchInterval: 10000,
    queryFn: async () => {
      let query = supabase.from("landing_page_events" as any)
        .select("id, event_type, event_name, visitor_id, device_type, utm_source, created_at, click_element")
        .order("created_at", { ascending: false })
        .limit(50);
      if (pageId) query = query.eq("landing_page_id", pageId);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as { id: string; event_type: string; event_name: string | null; visitor_id: string | null; device_type: string | null; utm_source: string | null; created_at: string; click_element: string | null }[];
    },
  });
}
