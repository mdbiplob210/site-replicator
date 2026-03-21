import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { startOfDay, subDays, startOfMonth, startOfYear } from "date-fns";

export type IncompleteDateFilter = "today" | "yesterday" | "7days" | "30days" | "all";

function getDateRange(filter: IncompleteDateFilter): { from: string | null; to: string | null } {
  const now = new Date();
  switch (filter) {
    case "today":
      return { from: startOfDay(now).toISOString(), to: null };
    case "yesterday": {
      const yd = subDays(now, 1);
      return { from: startOfDay(yd).toISOString(), to: startOfDay(now).toISOString() };
    }
    case "7days":
      return { from: startOfDay(subDays(now, 7)).toISOString(), to: null };
    case "30days":
      return { from: startOfDay(subDays(now, 30)).toISOString(), to: null };
    default:
      return { from: null, to: null };
  }
}

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

export function useIncompleteOrders(status?: string, sourceFilter?: "all" | "ip_blocked" | "abandoned_form", dateFilter?: IncompleteDateFilter, slugFilter?: string) {
  return useQuery({
    queryKey: ["incomplete-orders", status, sourceFilter, dateFilter, slugFilter],
    queryFn: async () => {
      let query = supabase
        .from("incomplete_orders" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      if (sourceFilter === "abandoned_form") {
        query = query.eq("block_reason", "abandoned_form");
      } else if (sourceFilter === "ip_blocked") {
        query = query.neq("block_reason", "abandoned_form");
      }

      if (slugFilter && slugFilter !== "all") {
        query = query.eq("landing_page_slug", slugFilter);
      }

      const range = getDateRange(dateFilter || "all");
      if (range.from) query = query.gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as IncompleteOrder[];
    },
  });
}

export function useIncompleteSlugOptions() {
  return useQuery({
    queryKey: ["incomplete-slug-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_orders" as any)
        .select("landing_page_slug");
      if (error) throw error;
      const slugs = new Map<string, number>();
      (data as any[]).forEach((r) => {
        const s = r.landing_page_slug || "(unknown)";
        slugs.set(s, (slugs.get(s) || 0) + 1);
      });
      return Array.from(slugs.entries())
        .map(([slug, count]) => ({ slug, count }))
        .sort((a, b) => b.count - a.count);
    },
  });
}

export function useIncompleteOrderCounts(sourceFilter?: "all" | "ip_blocked" | "abandoned_form", dateFilter?: IncompleteDateFilter) {
  return useQuery({
    queryKey: ["incomplete-order-counts", sourceFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from("incomplete_orders" as any)
        .select("status, block_reason");

      if (sourceFilter === "abandoned_form") {
        query = query.eq("block_reason", "abandoned_form");
      } else if (sourceFilter === "ip_blocked") {
        query = query.neq("block_reason", "abandoned_form");
      }

      const range = getDateRange(dateFilter || "all");
      if (range.from) query = query.gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);

      const { data, error } = await query;
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
      toast.success("Status updated");
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
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export interface ConvertPayload {
  order: IncompleteOrder;
  overrides?: {
    customer_name?: string;
    customer_phone?: string | null;
    customer_address?: string | null;
    delivery_charge?: number;
    discount?: number;
    notes?: string | null;
  };
}

export function useConvertIncompleteToOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ order, overrides }: ConvertPayload) => {
      const name = overrides?.customer_name ?? order.customer_name;
      const phone = overrides?.customer_phone !== undefined ? overrides.customer_phone : order.customer_phone;
      const address = overrides?.customer_address !== undefined ? overrides.customer_address : order.customer_address;
      const delCharge = overrides?.delivery_charge ?? order.delivery_charge;
      const disc = overrides?.discount ?? order.discount;
      const productTotal = order.unit_price * order.quantity;
      const total = productTotal + delCharge - disc;
      const noteText = overrides?.notes !== undefined ? overrides.notes : order.notes;

      // order_number is auto-assigned by DB trigger
      const { error: orderError } = await supabase.from("orders").insert({
        order_number: "0",
        customer_name: name,
        customer_phone: phone,
        customer_address: address,
        product_cost: productTotal,
        delivery_charge: delCharge,
        discount: disc,
        total_amount: total,
        notes: noteText || `[Converted from incomplete] [LP: ${order.landing_page_slug || "unknown"}]`,
        status: "processing" as any,
        client_ip: order.client_ip,
        user_agent: order.user_agent,
        device_info: order.device_info,
        source: "Failed Order",
      });
      if (orderError) throw orderError;

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
      toast.success("Converted to order!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
