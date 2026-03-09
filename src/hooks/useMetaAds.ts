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

// ─── List Ad Accounts from Business Manager ───

export type AdAccount = {
  id: string;
  act_id: string;
  name: string;
  business_id: string;
  business_name: string;
  currency: string;
  timezone: string;
  status: number;
};

export function useAdAccounts() {
  return useQuery({
    queryKey: ["meta_ad_accounts"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("fetch-meta-ads", {
        body: { action: "list_accounts" },
      });

      if (res.error) throw new Error(res.error.message || "Failed to fetch accounts");
      if (res.data?.error) throw new Error(res.data.error);
      return (res.data?.accounts || []) as AdAccount[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
  });
}

// ─── Read from DB ───

export function useMetaCampaigns(dateRange: string, adAccountId?: string) {
  const preset = dateRangeToPreset(dateRange);
  return useQuery({
    queryKey: ["meta_campaigns_db", preset, adAccountId],
    queryFn: async () => {
      let query = supabase
        .from("meta_campaigns" as any)
        .select("*")
        .eq("date_preset", preset)
        .order("spend", { ascending: false });
      
      if (adAccountId) {
        query = query.eq("ad_account_id", adAccountId);
      }

      const { data, error } = await query;
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

// ─── Exchange short-lived → long-lived token ───

export function useExchangeToken() {
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("fetch-meta-ads", {
        body: { action: "exchange_token" },
      });

      if (res.error) throw new Error(res.error.message || "Token exchange failed");
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(`Long-lived token পাওয়া গেছে! মেয়াদ: ${Math.round((data.expires_in || 0) / 86400)} দিন`);
    },
    onError: (err: Error) => {
      toast.error(`Token exchange ব্যর্থ: ${err.message}`);
    },
  });
}

// ─── Sync from Facebook API → DB (supports multi-account) ───

export function useSyncMetaAds() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ dateRange, adAccountIds }: { dateRange: string; adAccountIds?: string[] }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const bodyObj: any = { action: "sync", date_preset: dateRangeToPreset(dateRange) };
      if (adAccountIds && adAccountIds.length > 0) {
        bodyObj.ad_account_ids = adAccountIds;
      }

      const res = await supabase.functions.invoke("fetch-meta-ads", {
        body: bodyObj,
      });

      if (res.error) throw new Error(res.error.message || "Sync failed");
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["meta_campaigns_db"] });
      queryClient.invalidateQueries({ queryKey: ["meta_adsets_db"] });
      queryClient.invalidateQueries({ queryKey: ["meta_ads_db"] });
      const acCount = data.synced_accounts?.length || 0;
      toast.success(
        `সিঙ্ক সফল! ${acCount} account, ${data.synced?.campaigns || 0} campaigns, ${data.synced?.adsets || 0} ad sets, ${data.synced?.ads || 0} ads`
      );
    },
    onError: (err: Error) => {
      toast.error(`সিঙ্ক ব্যর্থ: ${err.message}`);
    },
  });
}