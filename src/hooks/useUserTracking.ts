import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

// Parse user agent for device info
function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = "desktop";

  if (/Mobile|Android|iPhone|iPad/i.test(ua)) deviceType = "mobile";
  if (/Tablet|iPad/i.test(ua)) deviceType = "tablet";

  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";
  else if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Opera|OPR/.test(ua)) browser = "Opera";

  if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac OS/.test(ua)) os = "macOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/iOS|iPhone|iPad/.test(ua)) os = "iOS";
  else if (/Linux/.test(ua)) os = "Linux";

  return { browser, os, deviceType };
}

// Track login activity
export async function trackLoginActivity(userId: string, email: string, status: "success" | "failed", failReason?: string) {
  const ua = navigator.userAgent;
  const { browser, os, deviceType } = parseUserAgent(ua);

  await supabase.from("login_activity" as any).insert({
    user_id: userId,
    email,
    user_agent: ua,
    browser,
    os,
    device_type: deviceType,
    status,
    fail_reason: failReason || null,
  } as any);
}

// Hook to update user presence periodically
export function useUserPresence() {
  const location = useLocation();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const updatePresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { browser, os, deviceType } = parseUserAgent(navigator.userAgent);

      await supabase.from("user_presence" as any).upsert({
        user_id: user.id,
        last_seen_at: new Date().toISOString(),
        current_page: location.pathname,
        is_online: true,
        device_info: `${browser}/${os} (${deviceType})`,
      } as any, { onConflict: "user_id" });
    };

    updatePresence();
    intervalRef.current = setInterval(updatePresence, 30000); // Every 30s

    // Set offline on unmount
    return () => {
      clearInterval(intervalRef.current);
      const setOffline = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from("user_presence" as any)
            .update({ is_online: false, last_seen_at: new Date().toISOString() } as any)
            .eq("user_id", user.id);
        }
      };
      setOffline();
    };
  }, [location.pathname]);
}

// Hook for admin to view all user presence (realtime)
export function useUserPresenceList() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("user-presence-changes")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "user_presence",
      }, () => {
        queryClient.invalidateQueries({ queryKey: ["user-presence"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return useQuery({
    queryKey: ["user-presence"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_presence" as any)
        .select("*")
        .order("last_seen_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    refetchInterval: 30000,
  });
}

// Hook for login activity logs
export function useLoginActivity(filters?: {
  dateRange?: string;
  status?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: ["login-activity", filters],
    queryFn: async () => {
      let query = supabase
        .from("login_activity" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.dateRange) {
        const now = new Date();
        let startDate: Date;
        switch (filters.dateRange) {
          case "today":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case "yesterday":
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }
        query = query.gte("created_at", startDate.toISOString());
      }

      if (filters?.search) {
        query = query.ilike("email", `%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });
}

// Hook for user order performance with date filter
export function useUserPerformance(dateRange: string) {
  return useQuery({
    queryKey: ["user-performance", dateRange],
    queryFn: async () => {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (dateRange) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "yesterday":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case "last7":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "last30":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "thisMonth":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "lastMonth":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "thisYear":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0);
      }

      // Get activity logs in date range
      const { data: logs, error: logsError } = await supabase
        .from("order_activity_logs")
        .select("user_id, user_name, action, new_value, created_at")
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .in("action", ["status_change", "created"]);
      if (logsError) throw logsError;

      // Aggregate by user
      const userMap: Record<string, {
        user_id: string;
        user_name: string;
        confirmed: number;
        cancelled: number;
        returned: number;
        delivered: number;
        processing: number;
        in_courier: number;
        total: number;
      }> = {};

      (logs || []).forEach((log: any) => {
        if (!log.user_id) return;
        if (!userMap[log.user_id]) {
          userMap[log.user_id] = {
            user_id: log.user_id,
            user_name: log.user_name || "Unknown",
            confirmed: 0,
            cancelled: 0,
            returned: 0,
            delivered: 0,
            processing: 0,
            in_courier: 0,
            total: 0,
          };
        }
        const u = userMap[log.user_id];

        if (log.action === "created") {
          u.processing++;
          u.total++;
        } else if (log.action === "status_change") {
          const newStatus = log.new_value?.toLowerCase();
          if (newStatus === "confirmed") u.confirmed++;
          else if (newStatus === "cancelled") u.cancelled++;
          else if (newStatus === "returned" || newStatus === "pending_return") u.returned++;
          else if (newStatus === "delivered") u.delivered++;
          else if (newStatus === "in_courier") u.in_courier++;
          u.total++;
        }
      });

      return Object.values(userMap);
    },
  });
}

// Block/unblock user
export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, block }: { userId: string; block: boolean }) => {
      // We'll use user_roles - remove all roles to effectively block
      if (block) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId);
        if (error) throw error;
      }
      // Unblock would need re-assigning roles - handled separately
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["login-activity"] });
    },
  });
}
