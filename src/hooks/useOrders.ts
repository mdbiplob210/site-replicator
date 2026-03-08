import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { startOfDay, endOfDay, subDays } from "date-fns";

export type OrderDateFilter = "all" | "today" | "yesterday" | "7days" | "30days" | "custom";

export function getOrderDateRange(filter: OrderDateFilter, customFrom?: Date, customTo?: Date): { from: string | null; to: string | null } {
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
    case "custom":
      return {
        from: customFrom ? startOfDay(customFrom).toISOString() : null,
        to: customTo ? endOfDay(customTo).toISOString() : null,
      };
    default:
      return { from: null, to: null };
  }
}

export type Order = Tables<"orders">;
export type OrderInsert = TablesInsert<"orders">;
export type OrderUpdate = TablesUpdate<"orders">;
export type OrderStatus = Order["status"];

export type OrderItemInput = {
  product_id: string | null;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
};

const STATUS_MAP: Record<string, OrderStatus> = {
  "All Orders": "processing",
  "New Orders": "processing",
  "Confirmed": "confirmed",
  "In Courier": "in_courier",
  "Delivered": "delivered",
  "Cancelled": "cancelled",
  "Hold": "on_hold",
  "Ship Later": "ship_later",
  "Return": "returned",
  "Pending Return": "pending_return",
  "Hand Delivery": "hand_delivery",
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
    pending_return: "Pending Return",
    hand_delivery: "Hand Delivery",
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
    pending_return: "bg-orange-500",
    hand_delivery: "bg-cyan-500",
  };
  return colors[status] || "bg-muted";
};

export function useOrders(statusFilter: string | null = null, dateFilter: OrderDateFilter = "all", customFrom?: Date, customTo?: Date) {
  return useQuery({
    queryKey: ["orders", statusFilter, dateFilter, customFrom?.toISOString(), customTo?.toISOString()],
    queryFn: async () => {
      let query = supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (statusFilter) {
        query = query.eq("status", statusFilter as OrderStatus);
      }

      const range = getOrderDateRange(dateFilter, customFrom, customTo);
      if (range.from) query = query.gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);

      const { data, error } = await query;
      if (error) throw error;
      return data as Order[];
    },
  });
}

export function useOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ["order-items", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_items" as any)
        .select("*")
        .eq("order_id", orderId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!orderId,
  });
}

export function useOrderCounts(dateFilter: OrderDateFilter = "all", customFrom?: Date, customTo?: Date) {
  return useQuery({
    queryKey: ["order-counts", dateFilter, customFrom?.toISOString(), customTo?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("orders").select("status, created_at");

      const range = getOrderDateRange(dateFilter, customFrom, customTo);
      if (range.from) query = query.gte("created_at", range.from);
      if (range.to) query = query.lt("created_at", range.to);

      const { data, error } = await query;
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
    mutationFn: async ({ order, items }: { order: OrderInsert; items: OrderItemInput[] }) => {
      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();
      if (orderError) throw orderError;

      // Insert order items
      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          order_id: orderData.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_code: item.product_code,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
        }));

        const { error: itemsError } = await supabase
          .from("order_items" as any)
          .insert(itemRows as any);
        if (itemsError) throw itemsError;
      }

      return orderData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order-counts"] });
      queryClient.invalidateQueries({ queryKey: ["order-items"] });
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
