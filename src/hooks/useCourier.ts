import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type CourierProvider = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  auth_token: string | null;
  api_configs: ApiConfig[];
  created_at: string;
  updated_at: string;
};

export type ApiConfig = {
  label: string;
  base_url: string;
  api_key: string;
  secret_key?: string;
  client_id?: string;
  store_id?: string;
  extra?: Record<string, string>;
};

export type CourierOrder = {
  id: string;
  order_id: string;
  courier_provider_id: string;
  tracking_id: string | null;
  consignment_id: string | null;
  courier_status: string;
  courier_response: any;
  submitted_at: string;
  updated_at: string;
};

export function useCourierProviders() {
  return useQuery({
    queryKey: ["courier-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courier_providers" as any)
        .select("*")
        .order("name");
      if (error) throw error;
      return (data as any[]).map((d) => ({
        ...d,
        api_configs: Array.isArray(d.api_configs) ? d.api_configs : JSON.parse(d.api_configs || "[]"),
      })) as CourierProvider[];
    },
  });
}

export function useUpdateCourierProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CourierProvider> }) => {
      const { error } = await supabase
        .from("courier_providers" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courier-providers"] });
      toast.success("Courier provider updated!");
    },
    onError: (e: Error) => toast.error("Update failed: " + e.message),
  });
}

export function useCourierOrders(orderId?: string) {
  return useQuery({
    queryKey: ["courier-orders", orderId],
    queryFn: async () => {
      let query = supabase
        .from("courier_orders" as any)
        .select("*")
        .order("submitted_at", { ascending: false });
      if (orderId) query = query.eq("order_id", orderId);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as CourierOrder[];
    },
    enabled: orderId ? !!orderId : true,
  });
}

export function useSubmitToCourier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      providerId,
      trackingId,
      consignmentId,
      courierResponse,
    }: {
      orderId: string;
      providerId: string;
      trackingId?: string;
      consignmentId?: string;
      courierResponse?: any;
    }) => {
      const { data, error } = await supabase
        .from("courier_orders" as any)
        .insert({
          order_id: orderId,
          courier_provider_id: providerId,
          tracking_id: trackingId || null,
          consignment_id: consignmentId || null,
          courier_status: "submitted",
          courier_response: courierResponse || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      await supabase
        .from("orders")
        .update({ status: "in_courier" as any })
        .eq("id", orderId);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courier-orders"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order-counts"] });
      toast.success("Submitted to courier!");
    },
    onError: (e: Error) => toast.error("Submit failed: " + e.message),
  });
}
