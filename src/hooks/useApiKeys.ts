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
  source_url: string | null;
  last_synced_at: string | null;
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
    mutationFn: async ({ label, permissions, source_url }: { label: string; permissions: string[]; source_url?: string }) => {
      const insertData: any = { label, permissions };
      if (source_url) insertData.source_url = source_url;
      const { data, error } = await supabase
        .from("api_keys" as any)
        .insert(insertData)
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

export function useSyncOrders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (apiKeyId: string) => {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("লগইন করুন");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/sync-orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ api_key_id: apiKeyId }),
        }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || result.detail || "Sync failed");
      return result;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] });
      toast.success(data.message || `${data.synced} অর্ডার সিঙ্ক হয়েছে`);
    },
    onError: (e: Error) => toast.error("সিঙ্ক ব্যর্থ: " + e.message),
  });
}
