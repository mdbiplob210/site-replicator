import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  rider_id: string;
  assigned_by: string | null;
  assigned_at: string;
  status: string;
  delivered_at: string | null;
  returned_at: string | null;
  return_reason: string | null;
  commission_amount: number;
  collected_amount: number;
  orders?: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string | null;
    customer_address: string | null;
    total_amount: number;
    status: string;
  };
}

export function useRiderAssignments(riderId?: string) {
  return useQuery({
    queryKey: ["rider-assignments", riderId],
    queryFn: async () => {
      let query = supabase
        .from("delivery_assignments")
        .select("*, orders(id, order_number, customer_name, customer_phone, customer_address, total_amount, status)")
        .order("assigned_at", { ascending: false });

      if (riderId) {
        query = query.eq("rider_id", riderId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DeliveryAssignment[];
    },
    enabled: !!riderId,
  });
}

export function useAllRiderAssignments() {
  return useQuery({
    queryKey: ["all-rider-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_assignments")
        .select("*, orders(id, order_number, customer_name, customer_phone, customer_address, total_amount, status)")
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data as DeliveryAssignment[];
    },
  });
}

export function useRiderSettings() {
  return useQuery({
    queryKey: ["rider-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rider_settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useUpdateRiderSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commission_per_delivery }: { commission_per_delivery: number }) => {
      const { data: existing } = await supabase
        .from("rider_settings")
        .select("id")
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("rider_settings")
          .update({ commission_per_delivery, updated_at: new Date().toISOString() } as any)
          .eq("id", existing.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-settings"] });
      toast.success("কমিশন রেট আপডেট হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkDelivered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      collectedAmount,
      commissionAmount,
    }: {
      assignmentId: string;
      collectedAmount: number;
      commissionAmount: number;
    }) => {
      const { error } = await supabase
        .from("delivery_assignments")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString(),
          collected_amount: collectedAmount,
          commission_amount: commissionAmount,
        } as any)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["all-rider-assignments"] });
      toast.success("ডেলিভারি সম্পন্ন!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useMarkReturned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      assignmentId,
      returnReason,
    }: {
      assignmentId: string;
      returnReason: string;
    }) => {
      const { error } = await supabase
        .from("delivery_assignments")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
          return_reason: returnReason,
        } as any)
        .eq("id", assignmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["all-rider-assignments"] });
      toast.success("রিটার্ন মার্ক করা হয়েছে");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAssignRider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderIds,
      riderId,
      assignedBy,
      commissionPerDelivery,
    }: {
      orderIds: string[];
      riderId: string;
      assignedBy: string;
      commissionPerDelivery: number;
    }) => {
      const rows = orderIds.map((orderId) => ({
        order_id: orderId,
        rider_id: riderId,
        assigned_by: assignedBy,
        commission_amount: commissionPerDelivery,
      }));
      const { error } = await supabase.from("delivery_assignments").insert(rows as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rider-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["all-rider-assignments"] });
      toast.success("রাইডার অ্যাসাইন হয়েছে!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeliveryRiders() {
  return useQuery({
    queryKey: ["delivery-riders"],
    queryFn: async () => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "delivery_rider");
      if (error) throw error;
      if (!roles || roles.length === 0) return [];

      const userIds = roles.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      return userIds.map((uid) => {
        const profile = profiles?.find((p) => p.user_id === uid);
        return {
          user_id: uid,
          full_name: profile?.full_name || `Rider (${uid.slice(0, 8)})`,
          avatar_url: profile?.avatar_url,
        };
      });
    },
  });
}
