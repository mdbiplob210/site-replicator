import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ApiKey = {
  id: string;
  label: string;
  api_key: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as ApiKey[];
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ label, permissions }: { label: string; permissions: string[] }) => {
      const { data, error } = await supabase
        .from("api_keys" as any)
        .insert({ label, permissions } as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as ApiKey;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key তৈরি হয়েছে!");
    },
    onError: (e: Error) => toast.error("তৈরি ব্যর্থ: " + e.message),
  });
}

export function useUpdateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ApiKey> }) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("আপডেট হয়েছে!");
    },
    onError: (e: Error) => toast.error("আপডেট ব্যর্থ: " + e.message),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API Key ডিলিট হয়েছে!");
    },
    onError: (e: Error) => toast.error("ডিলিট ব্যর্থ: " + e.message),
  });
}
