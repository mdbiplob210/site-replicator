import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d";

function dateRangeToPreset(range: string): DatePreset {
  switch (range) {
    case "yesterday": return "yesterday";
    case "7days": return "last_7d";
    case "30days": return "last_30d";
    default: return "today";
  }
}

// ─── Read from DB ───

export function useMetaCampaigns(dateRange: string) {
  const preset = dateRangeToPreset(dateRange);
  return useQuery({
    queryKey: ["meta_campaigns_db", preset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_campaigns" as any)
        .select("*")
        .eq("date_preset", preset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });
}

export function useMetaAdSets(campaignId: string | null, dateRange: string) {
  const preset = dateRangeToPreset(dateRange);
  return useQuery({
    queryKey: ["meta_adsets_db", campaignId, preset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_adsets" as any)
        .select("*")
        .eq("campaign_id", campaignId!)
        .eq("date_preset", preset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaignId,
    staleTime: 30_000,
  });
}

export function useMetaAds(adsetId: string | null, dateRange: string) {
  const preset = dateRangeToPreset(dateRange);
  return useQuery({
    queryKey: ["meta_ads_db", adsetId, preset],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meta_ads" as any)
        .select("*")
        .eq("adset_id", adsetId!)
        .eq("date_preset", preset)
        .order("spend", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!adsetId,
    staleTime: 30_000,
  });
}

// ─── Sync from Facebook API → DB ───

export function useSyncMetaAds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dateRange: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("fetch-meta-ads", {
        body: { action: "sync", date_preset: dateRangeToPreset(dateRange) },
      });

      if (res.error) throw new Error(res.error.message || "Sync failed");
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meta_campaigns_db"] });
      queryClient.invalidateQueries({ queryKey: ["meta_adsets_db"] });
      queryClient.invalidateQueries({ queryKey: ["meta_ads_db"] });
      toast.success(
        `সিঙ্ক সফল! ${data.synced?.campaigns || 0} campaigns, ${data.synced?.adsets || 0} ad sets, ${data.synced?.ads || 0} ads`
      );
    },
    onError: (err: Error) => {
      toast.error(`সিঙ্ক ব্যর্থ: ${err.message}`);
    },
  });
}
