import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getPrefetchedData } from "@/lib/prefetch";

export interface LandingPage {
  id: string;
  title: string;
  slug: string;
  html_content: string;
  checkout_html: string | null;
  is_active: boolean;
  fb_pixel_id: string | null;
  fb_access_token: string | null;
  tiktok_pixel_id: string | null;
  gtm_id: string | null;
  custom_head_scripts: string | null;
  exit_popup_enabled: boolean;
  exit_popup_discount: number;
  exit_popup_timer: number;
  exit_popup_message: string;
  created_at: string;
  updated_at: string;
}

export function useLandingPages() {
  return useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as LandingPage[];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useLandingPageBySlug(slug: string) {
  return useQuery({
    queryKey: ["landing-page", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as unknown as LandingPage;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useCreateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Partial<LandingPage>) => {
      const { error } = await supabase
        .from("landing_pages" as any)
        .insert(page as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("Landing page তৈরি হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LandingPage> & { id: string }) => {
      const { error } = await supabase
        .from("landing_pages" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("আপডেট হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteLandingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("landing_pages" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["landing-pages"] });
      toast.success("ডিলিট হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
