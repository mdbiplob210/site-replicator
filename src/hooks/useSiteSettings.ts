import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPrefetchedData } from "@/lib/prefetch";

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((r: any) => { map[r.key] = r.value; });
      return map;
    },
    initialData: () => {
      const cached = getPrefetchedData<{ key: string; value: string }[]>("site-settings");
      if (cached) {
        const map: Record<string, string> = {};
        cached.forEach(r => { map[r.key] = r.value; });
        return map;
      }
      return undefined;
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSiteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString(), is_public: true } as any,
          { onConflict: "key" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
