import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const LANDING_EVENT_PAGE_SIZE = 1000;
const ORDER_INTENT_KEYWORDS = ["অর্ডার", "order", "confirm", "buy", "checkout", "submit", "purchase"];
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

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
  orderClicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  avgTimeOnPage: number;
  bounceRate: number;
}

interface DateRange {
  since: string;
  until: string;
  totalDays: number;
}

interface FetchLandingEventsOptions {
  select: string;
  pageId?: string;
  since?: string;
  until?: string;
  limit?: number;
  orderBy?: string;
  ascending?: boolean;
  applyQuery?: (query: any) => any;
}

function toDateBoundary(dateString: string, endOfDay = false) {
  const value = new Date(`${dateString}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return value.toISOString();
}

function getDateRange(days: number, startDate?: string, endDate?: string): DateRange {
  if (startDate && endDate) {
    const since = toDateBoundary(startDate, false);
    const until = toDateBoundary(endDate, true);
    const totalDays = Math.max(
      Math.round((new Date(until).getTime() - new Date(since).getTime()) / (24 * 60 * 60 * 1000)) + 1,
      1
    );

    return { since, until, totalDays };
  }

  const untilDate = new Date();
  untilDate.setHours(23, 59, 59, 999);

  const sinceDate = new Date(untilDate);
  sinceDate.setDate(sinceDate.getDate() - Math.max(days - 1, 0));
  sinceDate.setHours(0, 0, 0, 0);

  return {
    since: sinceDate.toISOString(),
    until: untilDate.toISOString(),
    totalDays: Math.max(days, 1),
  };
}

async function fetchLandingEvents<T>({
  select,
  pageId,
  since,
  until,
  limit,
  orderBy,
  ascending = false,
  applyQuery,
}: FetchLandingEventsOptions): Promise<T[]> {
  let from = 0;
  const rows: T[] = [];

  while (true) {
    let query = supabase.from("landing_page_events" as any).select(select);

    if (pageId) query = query.eq("landing_page_id", pageId);
    if (since) query = query.gte("created_at", since);
    if (until) query = query.lte("created_at", until);
    if (applyQuery) query = applyQuery(query);
    if (orderBy) query = query.order(orderBy, { ascending });

    const upperBound = limit
      ? Math.min(from + LANDING_EVENT_PAGE_SIZE - 1, limit - 1)
      : from + LANDING_EVENT_PAGE_SIZE - 1;

    const { data, error } = await query.range(from, upperBound);
    if (error) throw error;

    const batch = (data ?? []) as T[];
    if (batch.length === 0) break;

    rows.push(...batch);

    if (batch.length < LANDING_EVENT_PAGE_SIZE) break;
    if (limit && rows.length >= limit) break;

    from += LANDING_EVENT_PAGE_SIZE;
  }

  return limit ? rows.slice(0, limit) : rows;
}

function buildDailyMap(range: DateRange) {
  const map: Record<string, { views: number; clicks: number; conversions: number }> = {};
  const date = new Date(range.since);

  for (let i = 0; i < range.totalDays; i++) {
    const key = date.toISOString().split("T")[0];
    map[key] = { views: 0, clicks: 0, conversions: 0 };
    date.setDate(date.getDate() + 1);
  }

  return map;
}

function isOrderIntentClick(eventName: string | null, clickElement?: string | null) {
  const content = `${eventName ?? ""} ${clickElement ?? ""}`.toLowerCase();
  return ORDER_INTENT_KEYWORDS.some((keyword) => content.includes(keyword.toLowerCase()));
}

export function useLandingPageEvents(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-events", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      return fetchLandingEvents<LandingPageEvent>({
        select: "*",
        pageId,
        since: range.since,
        until: range.until,
        orderBy: "created_at",
        ascending: false,
      });
    },
  });
}

export function useLandingPageAnalyticsSummary(days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-analytics-summary", days, startDate, endDate],
    queryFn: async () => {
      const { data: pages, error: pagesError } = await supabase
        .from("landing_pages" as any)
        .select("id, title, slug")
        .order("created_at", { ascending: false });

      if (pagesError) throw pagesError;

      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{
        landing_page_id: string;
        event_type: string;
        event_name: string | null;
        visitor_id: string | null;
        session_id: string | null;
        time_on_page: number | null;
        click_element: string | null;
      }>({
        select: "landing_page_id, event_type, event_name, visitor_id, session_id, time_on_page, click_element",
        since: range.since,
        until: range.until,
      });

      const eventsByPage = new Map<string, typeof events>();
      events.forEach((event) => {
        const existing = eventsByPage.get(event.landing_page_id) ?? [];
        existing.push(event);
        eventsByPage.set(event.landing_page_id, existing);
      });

      const typedPages = (pages ?? []) as { id: string; title: string; slug: string }[];

      return typedPages.map((page) => {
        const pageEvents = eventsByPage.get(page.id) ?? [];
        const views = pageEvents.filter((event) => event.event_type === "view").length;
        const clicks = pageEvents.filter((event) => event.event_type === "click").length;
        const orderClicks = pageEvents.filter(
          (event) => event.event_type === "click" && isOrderIntentClick(event.event_name, event.click_element)
        ).length;
        const conversions = pageEvents.filter((event) => event.event_type === "conversion").length;
        const exitEvents = pageEvents.filter((event) => event.event_type === "exit" && event.time_on_page);
        const avgTimeOnPage =
          exitEvents.length > 0
            ? exitEvents.reduce((sum, event) => sum + (event.time_on_page || 0), 0) / exitEvents.length
            : 0;

        const sessions = new Map<string, Set<string>>();
        pageEvents.forEach((event) => {
          const sessionKey = event.session_id || event.visitor_id || `anonymous-${event.landing_page_id}`;
          const types = sessions.get(sessionKey) ?? new Set<string>();
          types.add(event.event_type);
          sessions.set(sessionKey, types);
        });

        let bounces = 0;
        sessions.forEach((types) => {
          if (types.size <= 2 && types.has("view") && (types.size === 1 || types.has("exit"))) {
            bounces += 1;
          }
        });

        return {
          landing_page_id: page.id,
          title: page.title,
          slug: page.slug,
          views,
          clicks,
          orderClicks,
          conversions,
          ctr: views > 0 ? (clicks / views) * 100 : 0,
          conversionRate: views > 0 ? (conversions / views) * 100 : 0,
          avgTimeOnPage: Math.round(avgTimeOnPage),
          bounceRate: sessions.size > 0 ? (bounces / sessions.size) * 100 : 0,
        } satisfies PageAnalyticsSummary;
      });
    },
  });
}

export function useLandingPageDailyStats(pageId?: string, days = 7, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-daily-stats", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{ event_type: string; created_at: string }>({
        select: "event_type, created_at",
        pageId,
        since: range.since,
        until: range.until,
        orderBy: "created_at",
        ascending: true,
      });

      const dailyMap = buildDailyMap(range);

      events.forEach((event) => {
        const key = event.created_at.split("T")[0];
        if (!dailyMap[key]) dailyMap[key] = { views: 0, clicks: 0, conversions: 0 };
        if (event.event_type === "view") dailyMap[key].views += 1;
        if (event.event_type === "click") dailyMap[key].clicks += 1;
        if (event.event_type === "conversion") dailyMap[key].conversions += 1;
      });

      return Object.entries(dailyMap).map(([date, stats]) => ({ date, ...stats }));
    },
  });
}

export function useLandingPageFunnel(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-funnel", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{ event_type: string; event_name: string | null; visitor_id: string | null }>({
        select: "event_type, event_name, visitor_id",
        pageId,
        since: range.since,
        until: range.until,
      });

      const steps = ["view", "scroll_50", "form_view", "form_start", "phone_entered", "conversion"];
      const stepLabels: Record<string, string> = {
        view: "পেজ ভিউ",
        scroll_50: "৫০% স্ক্রল",
        form_view: "ফর্ম দেখা",
        form_start: "ফর্ম শুরু",
        phone_entered: "ফোন দেওয়া",
        conversion: "অর্ডার",
      };

      const visitorsByStep = new Map<string, Set<string>>();
      events.forEach((event) => {
        const stepKey =
          event.event_type === "funnel" || event.event_type === "scroll"
            ? event.event_name || ""
            : event.event_type;
        const visitorId = event.visitor_id || "unknown";
        const visitors = visitorsByStep.get(stepKey) ?? new Set<string>();
        visitors.add(visitorId);
        visitorsByStep.set(stepKey, visitors);
      });

      return steps.map((step) => ({
        step,
        label: stepLabels[step] || step,
        count: visitorsByStep.get(step)?.size || 0,
      }));
    },
  });
}

export function useLandingPageUTM(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-utm", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{
        event_type: string;
        utm_source: string | null;
        utm_medium: string | null;
        utm_campaign: string | null;
        visitor_id: string | null;
      }>({
        select: "event_type, utm_source, utm_medium, utm_campaign, visitor_id",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.in("event_type", ["view", "conversion"]),
      });

      const groupBy = (keyFn: (event: (typeof events)[number]) => string) => {
        const map = new Map<string, { views: number; conversions: number }>();
        events.forEach((event) => {
          const key = keyFn(event);
          const current = map.get(key) ?? { views: 0, conversions: 0 };
          if (event.event_type === "view") current.views += 1;
          if (event.event_type === "conversion") current.conversions += 1;
          map.set(key, current);
        });

        return Array.from(map.entries())
          .map(([name, stats]) => ({
            name,
            ...stats,
            rate: stats.views > 0 ? (stats.conversions / stats.views) * 100 : 0,
          }))
          .sort((a, b) => b.views - a.views);
      };

      return {
        sources: groupBy((event) => event.utm_source || "direct"),
        campaigns: groupBy((event) => event.utm_campaign || "none"),
      };
    },
  });
}

export function useLandingPageDeviceStats(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-devices", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{ device_type: string | null; browser: string | null; os: string | null }>({
        select: "device_type, browser, os",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.eq("event_type", "view"),
      });

      const countBy = (key: "device_type" | "browser" | "os") => {
        const map = new Map<string, number>();
        events.forEach((event) => {
          const label = event[key] || "Unknown";
          map.set(label, (map.get(label) || 0) + 1);
        });
        return Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      };

      return {
        devices: countBy("device_type"),
        browsers: countBy("browser"),
        operatingSystems: countBy("os"),
      };
    },
  });
}

export function useLandingPageScrollStats(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-scroll", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{ event_name: string | null; visitor_id: string | null }>({
        select: "event_name, visitor_id",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.eq("event_type", "scroll"),
      });

      const milestones = ["scroll_25", "scroll_50", "scroll_75", "scroll_100"];
      const labels: Record<string, string> = {
        scroll_25: "25%",
        scroll_50: "50%",
        scroll_75: "75%",
        scroll_100: "100%",
      };

      const visitorsByMilestone = new Map<string, Set<string>>();
      events.forEach((event) => {
        const milestone = event.event_name || "";
        const visitors = visitorsByMilestone.get(milestone) ?? new Set<string>();
        visitors.add(event.visitor_id || "unknown");
        visitorsByMilestone.set(milestone, visitors);
      });

      return milestones.map((milestone) => ({
        milestone: labels[milestone] || milestone,
        visitors: visitorsByMilestone.get(milestone)?.size || 0,
      }));
    },
  });
}

export function useLandingPageLiveVisitors(pageId?: string) {
  return useQuery({
    queryKey: ["landing-page-live-visitors", pageId],
    refetchInterval: 15000,
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const events = await fetchLandingEvents<{
        visitor_id: string | null;
        landing_page_id: string;
        device_type: string | null;
        utm_source: string | null;
        created_at: string;
      }>({
        select: "visitor_id, landing_page_id, device_type, utm_source, created_at",
        pageId,
        since: fiveMinutesAgo,
        until: new Date().toISOString(),
        applyQuery: (query) => query.eq("event_type", "view"),
      });

      return {
        count: new Set(events.map((event) => event.visitor_id || event.created_at)).size,
        visitors: events.slice(0, 20),
      };
    },
  });
}

export function useLandingPageHeatmap(pageId?: string, days = 30, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-heatmap", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      return fetchLandingEvents<{
        click_x: number;
        click_y: number;
        click_element: string | null;
        page_height: number | null;
        event_type: string;
      }>({
        select: "click_x, click_y, click_element, page_height, event_type",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.in("event_type", ["click", "conversion"]).not("click_x", "is", null),
      });
    },
  });
}

export function useLandingPageHourlyStats(pageId?: string, days = 7, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-hourly", pageId, days, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(days, startDate, endDate);
      const events = await fetchLandingEvents<{ created_at: string }>({
        select: "created_at",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.eq("event_type", "view"),
      });

      const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
      const grid: { day: string; hour: number; count: number }[] = [];

      for (let day = 0; day < 7; day += 1) {
        for (let hour = 0; hour < 24; hour += 1) {
          grid.push({ day: dayNames[day], hour, count: 0 });
        }
      }

      events.forEach((event) => {
        const timestamp = new Date(event.created_at);
        const index = timestamp.getDay() * 24 + timestamp.getHours();
        if (grid[index]) grid[index].count += 1;
      });

      return grid;
    },
  });
}

export function useLandingPageCohort(pageId?: string, weeks = 4, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-cohort", pageId, weeks, startDate, endDate],
    queryFn: async () => {
      const range = getDateRange(weeks * 7, startDate, endDate);
      const events = await fetchLandingEvents<{ visitor_id: string | null; created_at: string }>({
        select: "visitor_id, created_at",
        pageId,
        since: range.since,
        until: range.until,
        applyQuery: (query) => query.eq("event_type", "view"),
      });

      const rangeEndTime = new Date(range.until).getTime();
      const visitorFirstWeek = new Map<string, number>();
      const visitorWeeks = new Map<string, Set<number>>();

      events.forEach((event) => {
        const visitorId = event.visitor_id || "unknown";
        const weekOffset = Math.floor((rangeEndTime - new Date(event.created_at).getTime()) / WEEK_IN_MS);
        const invertedWeek = weeks - 1 - weekOffset;
        if (invertedWeek < 0 || invertedWeek >= weeks) return;

        const currentFirstWeek = visitorFirstWeek.get(visitorId);
        if (currentFirstWeek === undefined || invertedWeek < currentFirstWeek) {
          visitorFirstWeek.set(visitorId, invertedWeek);
        }

        const trackedWeeks = visitorWeeks.get(visitorId) ?? new Set<number>();
        trackedWeeks.add(invertedWeek);
        visitorWeeks.set(visitorId, trackedWeeks);
      });

      const cohorts: { week: string; total: number; retention: number[] }[] = [];
      for (let week = 0; week < weeks; week += 1) {
        const cohortVisitors = new Set<string>();
        visitorFirstWeek.forEach((firstWeek, visitorId) => {
          if (firstWeek === week) cohortVisitors.add(visitorId);
        });

        const retention: number[] = [];
        for (let offset = 0; offset <= weeks - 1 - week; offset += 1) {
          let retained = 0;
          cohortVisitors.forEach((visitorId) => {
            if (visitorWeeks.get(visitorId)?.has(week + offset)) retained += 1;
          });
          retention.push(cohortVisitors.size > 0 ? Math.round((retained / cohortVisitors.size) * 100) : 0);
        }

        cohorts.push({
          week: `সপ্তাহ ${week + 1}`,
          total: cohortVisitors.size,
          retention,
        });
      }

      const allVisitors = new Set<string>();
      const returningVisitors = new Set<string>();
      visitorWeeks.forEach((trackedWeeks, visitorId) => {
        allVisitors.add(visitorId);
        if (trackedWeeks.size > 1) returningVisitors.add(visitorId);
      });

      return {
        cohorts,
        totalVisitors: allVisitors.size,
        newVisitors: allVisitors.size - returningVisitors.size,
        returningVisitors: returningVisitors.size,
        retentionRate: allVisitors.size > 0 ? (returningVisitors.size / allVisitors.size) * 100 : 0,
      };
    },
  });
}

export function useLandingPageRealtimeFeed(pageId?: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ["landing-page-feed", pageId, startDate, endDate],
    refetchInterval: 10000,
    queryFn: async () => {
      const range = startDate && endDate ? getDateRange(1, startDate, endDate) : undefined;
      return fetchLandingEvents<{
        id: string;
        event_type: string;
        event_name: string | null;
        visitor_id: string | null;
        device_type: string | null;
        utm_source: string | null;
        created_at: string;
        click_element: string | null;
      }>({
        select: "id, event_type, event_name, visitor_id, device_type, utm_source, created_at, click_element",
        pageId,
        since: range?.since,
        until: range?.until,
        orderBy: "created_at",
        ascending: false,
        limit: 50,
      });
    },
  });
}
