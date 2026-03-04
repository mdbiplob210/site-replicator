import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export type AdSpend = {
  id: string;
  spend_date: string;
  amount_usd: number;
  amount_bdt: number;
  platform: string;
  created_at: string;
};

function getDateRange(range: string): { from: string; to: string } {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  switch (range) {
    case "yesterday": {
      const y = format(subDays(now, 1), "yyyy-MM-dd");
      return { from: y, to: y };
    }
    case "7days":
      return { from: format(subDays(now, 6), "yyyy-MM-dd"), to: today };
    case "30days":
      return { from: format(subDays(now, 29), "yyyy-MM-dd"), to: today };
    default:
      return { from: today, to: today };
  }
}

export function useAdSpends(dateRange: string, dollarRate: number) {
  const queryClient = useQueryClient();
  const { from, to } = getDateRange(dateRange);

  const query = useQuery({
    queryKey: ["ad_spends", from, to],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spends")
        .select("*")
        .gte("spend_date", from)
        .lte("spend_date", to)
        .order("spend_date", { ascending: false });
      if (error) throw error;
      return data as AdSpend[];
    },
  });

  const allEntriesQuery = useQuery({
    queryKey: ["ad_spends_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_spends")
        .select("*")
        .order("spend_date", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as AdSpend[];
    },
  });

  const addEntry = useMutation({
    mutationFn: async (entry: { spend_date: string; amount_usd: number; amount_bdt: number; platform?: string }) => {
      const { error } = await supabase.from("ad_spends").insert({
        spend_date: entry.spend_date,
        amount_usd: entry.amount_usd,
        amount_bdt: entry.amount_bdt,
        platform: entry.platform || "meta",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_spends"] });
      queryClient.invalidateQueries({ queryKey: ["ad_spends_all"] });
      toast.success("Ad spend entry saved!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteEntry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_spends").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ad_spends"] });
      queryClient.invalidateQueries({ queryKey: ["ad_spends_all"] });
      toast.success("Entry deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const entries = query.data || [];
  const totalUsd = entries.reduce((s, e) => s + Number(e.amount_usd), 0);
  const totalBdt = totalUsd * dollarRate;
  const uniqueDays = new Set(entries.map((e) => e.spend_date)).size;
  const avgDaily = uniqueDays > 0 ? totalUsd / uniqueDays : 0;

  return {
    entries,
    allEntries: allEntriesQuery.data || [],
    isLoading: query.isLoading,
    totalUsd,
    totalBdt,
    avgDaily,
    addEntry,
    deleteEntry,
  };
}
