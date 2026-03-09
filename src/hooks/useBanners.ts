import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useBanners() {
  return useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useActiveBanners() {
  return useQuery({
    queryKey: ["banners-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAddBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ image_url, link_url, sort_order }: { image_url: string; link_url?: string; sort_order?: number }) => {
      const { error } = await supabase.from("banners").insert({ image_url, link_url: link_url || "", sort_order: sort_order || 0 } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("ব্যানার যোগ হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; link_url?: string; sort_order?: number }) => {
      const { error } = await supabase.from("banners").update({ ...updates, updated_at: new Date().toISOString() } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("ব্যানার আপডেট হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBanner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["banners"] });
      toast.success("ব্যানার মুছে ফেলা হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
