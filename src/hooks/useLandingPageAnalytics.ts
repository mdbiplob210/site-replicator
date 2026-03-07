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
}

export function useLandingPageEvents(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-events", pageId],
    queryFn: async () => {
      let query = supabase
        .from("landing_page_events" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

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
      // Get all pages
      const { data: pages, error: pagesError } = await supabase
        .from("landing_pages" as any)
        .select("id, title, slug")
        .order("created_at", { ascending: false });

      if (pagesError) throw pagesError;

      // Get all events
      const { data: events, error: eventsError } = await supabase
        .from("landing_page_events" as any)
        .select("landing_page_id, event_type");

      if (eventsError) throw eventsError;

      const typedPages = pages as unknown as { id: string; title: string; slug: string }[];
      const typedEvents = events as unknown as { landing_page_id: string; event_type: string }[];

      const summaries: PageAnalyticsSummary[] = typedPages.map((page) => {
        const pageEvents = typedEvents.filter((e) => e.landing_page_id === page.id);
        const views = pageEvents.filter((e) => e.event_type === "view").length;
        const clicks = pageEvents.filter((e) => e.event_type === "click").length;
        const conversions = pageEvents.filter((e) => e.event_type === "conversion").length;

        return {
          landing_page_id: page.id,
          title: page.title,
          slug: page.slug,
          views,
          clicks,
          conversions,
          ctr: views > 0 ? (clicks / views) * 100 : 0,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0,
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

      // Group by date
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
