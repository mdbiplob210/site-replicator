import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type DatePreset = "today" | "yesterday" | "last_7d" | "last_30d";

function dateRangeToPreset(range: string): DatePreset {
  switch (range) {
    case "yesterday": return "yesterday";
    case "7days": return "last_7d";
    case "30days": return "last_30d";
    default: return "today";
  }
}

async function fetchMetaAds(action: string, dateRange: string, extra: Record<string, string> = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not authenticated");

  const res = await supabase.functions.invoke("fetch-meta-ads", {
    body: {
      action,
      date_preset: dateRangeToPreset(dateRange),
      ...extra,
    },
  });

  if (res.error) throw new Error(res.error.message || "Failed to fetch");
  return res.data;
}

export function useMetaCampaigns(dateRange: string, enabled: boolean) {
  return useQuery({
    queryKey: ["meta_campaigns", dateRange],
    queryFn: () => fetchMetaAds("campaigns", dateRange),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMetaAdSets(campaignId: string | null, dateRange: string) {
  return useQuery({
    queryKey: ["meta_adsets", campaignId, dateRange],
    queryFn: () => fetchMetaAds("adsets", dateRange, { campaign_id: campaignId! }),
    enabled: !!campaignId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMetaAds(adsetId: string | null, dateRange: string) {
  return useQuery({
    queryKey: ["meta_ads", adsetId, dateRange],
    queryFn: () => fetchMetaAds("ads", dateRange, { adset_id: adsetId! }),
    enabled: !!adsetId,
    staleTime: 60_000,
    retry: 1,
  });
}

export function useMetaSummary(dateRange: string, enabled: boolean) {
  return useQuery({
    queryKey: ["meta_summary", dateRange],
    queryFn: () => fetchMetaAds("summary", dateRange),
    enabled,
    staleTime: 60_000,
    retry: 1,
  });
}
