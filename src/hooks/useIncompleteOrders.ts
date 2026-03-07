import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface IncompleteOrder {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_address: string | null;
  product_name: string | null;
  product_code: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  delivery_charge: number;
  discount: number;
  notes: string | null;
  landing_page_slug: string | null;
  client_ip: string | null;
  user_agent: string | null;
  device_info: string | null;
  block_reason: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export function useIncompleteOrders(status?: string) {
  return useQuery({
    queryKey: ["incomplete-orders", status],
    queryFn: async () => {
      let query = supabase
        .from("incomplete_orders" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as IncompleteOrder[];
    },
  });
}

export function useIncompleteOrderCounts() {
  return useQuery({
    queryKey: ["incomplete-order-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_orders" as any)
        .select("status");
      if (error) throw error;
      const counts: Record<string, number> = { total: 0 };
      (data as any[]).forEach((row) => {
        counts.total++;
        counts[row.status] = (counts[row.status] || 0) + 1;
      });
      return counts;
    },
  });
}

export function useUpdateIncompleteOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("incomplete_orders" as any)
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] });
      qc.invalidateQueries({ queryKey: ["incomplete-order-counts"] });
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteIncompleteOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("incomplete_orders" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] });
      qc.invalidateQueries({ queryKey: ["incomplete-order-counts"] });
      toast.success("ডিলিট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useConvertIncompleteToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: IncompleteOrder) => {
      // Create real order
      const orderNumber = `LP-${Date.now().toString(36).toUpperCase()}`;
      const { error: orderError } = await supabase.from("orders").insert({
        order_number: orderNumber,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        customer_address: order.customer_address,
        product_cost: order.unit_price * order.quantity,
        delivery_charge: order.delivery_charge,
        discount: order.discount,
        total_amount: order.total_amount,
        notes: order.notes || `[Converted from incomplete] [LP: ${order.landing_page_slug || "unknown"}]`,
        status: "processing" as any,
        client_ip: order.client_ip,
        user_agent: order.user_agent,
        device_info: order.device_info,
      });
      if (orderError) throw orderError;

      // Mark incomplete as converted
      const { error: updateError } = await supabase
        .from("incomplete_orders" as any)
        .update({ status: "converted", updated_at: new Date().toISOString() } as any)
        .eq("id", order.id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["incomplete-orders"] });
      qc.invalidateQueries({ queryKey: ["incomplete-order-counts"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("অর্ডারে কনভার্ট হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
