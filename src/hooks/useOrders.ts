import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type Order = Tables<"orders">;
export type OrderInsert = TablesInsert<"orders">;
export type OrderUpdate = TablesUpdate<"orders">;
export type OrderStatus = Order["status"];

const STATUS_MAP: Record<string, OrderStatus> = {
  "All Orders": "processing", // not used for filtering
  "New Orders": "processing",
  "Confirmed": "confirmed",
  "In Courier": "in_courier",
  "Delivered": "delivered",
  "Cancelled": "cancelled",
  "Hold": "on_hold",
  "Ship Later": "ship_later",
  "Return": "returned",
};

export const getStatusFromTab = (tab: string): OrderStatus | null => {
  if (tab === "All Orders") return null;
  return STATUS_MAP[tab] || null;
};

export const getStatusLabel = (status: OrderStatus): string => {
  const labels: Record<OrderStatus, string> = {
    processing: "New Orders",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    on_hold: "Hold",
    ship_later: "Ship Later",
    in_courier: "In Courier",
    delivered: "Delivered",
    returned: "Return",
  };
  return labels[status] || status;
};

export const getStatusColor = (status: OrderStatus): string => {
  const colors: Record<OrderStatus, string> = {
    processing: "bg-blue-500",
    confirmed: "bg-emerald-600",
    cancelled: "bg-red-500",
    on_hold: "bg-yellow-500",
    ship_later: "bg-teal-500",
    in_courier: "bg-violet-500",
    delivered: "bg-emerald-500",
    returned: "bg-red-400",
  };
  return colors[status] || "bg-muted";
};

export function useOrders(statusFilter: string | null = null) {
  return useQuery({
    queryKey: ["orders", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter as OrderStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderCounts() {
  return useQuery({
    queryKey: ["order-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("status");
      if (error) throw error;

      const counts: Record<string, number> = { "All Orders": data.length };
      for (const order of data) {
        const label = getStatusLabel(order.status);
        counts[label] = (counts[label] || 0) + 1;
      }
      return counts;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (order: OrderInsert) => {
      const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      toast.success("অর্ডার সফলভাবে তৈরি হয়েছে!");
    },
    onError: (error: Error) => {
      toast.error("অর্ডার তৈরি করতে ব্যর্থ: " + error.message);
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      toast.success("স্ট্যাটাস আপডেট হয়েছে!");
    },
    onError: (error: Error) => {
      toast.error("স্ট্যাটাস আপডেট করতে ব্যর্থ: " + error.message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      toast.success("অর্ডার ডিলিট হয়েছে!");
    },
    onError: (error: Error) => {
      toast.error("অর্ডার ডিলিট করতে ব্যর্থ: " + error.message);
    },
  });
}

// Generate next order number
export function useNextOrderNumber() {
  return useQuery({
    queryKey: ["next-order-number"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("order_number")
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      if (data && data.length > 0) {
        const lastNum = parseInt(data[0].order_number.replace(/\D/g, "") || "0");
        return `ORD-${String(lastNum + 1).padStart(5, "0")}`;
      }
      return "ORD-00001";
    },
  });
}
