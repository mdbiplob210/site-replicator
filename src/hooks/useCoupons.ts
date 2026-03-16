import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCoupons() {
  return useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: {
      code: string;
      discount_type: string;
      discount_value: number;
      min_order_amount?: number;
      max_uses?: number;
      expires_at?: string | null;
    }) => {
      const { error } = await supabase.from("coupons").insert({
        code: coupon.code.toUpperCase().trim(),
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount || 0,
        max_uses: coupon.max_uses || 0,
        expires_at: coupon.expires_at || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon created!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coupons"] });
      toast.success("Coupon deleted");
    },
  });
}

export function useToggleCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
}

/** Validate and apply a coupon code */
export async function validateCoupon(code: string, orderTotal: number): Promise<{
  valid: boolean;
  discount: number;
  message: string;
  couponId?: string;
}> {
  const cleanCode = code.toUpperCase().trim();
  if (!cleanCode) return { valid: false, discount: 0, message: "কুপন কোড দিন" };

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", cleanCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !data) return { valid: false, discount: 0, message: "কুপন কোড সঠিক নয়" };

  // Check expiry
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { valid: false, discount: 0, message: "কুপনের মেয়াদ শেষ হয়ে গেছে" };
  }

  // Check max uses
  if (data.max_uses > 0 && data.used_count >= data.max_uses) {
    return { valid: false, discount: 0, message: "কুপনটি সর্বোচ্চ ব্যবহার সীমায় পৌঁছেছে" };
  }

  // Check min order
  if (data.min_order_amount > 0 && orderTotal < data.min_order_amount) {
    return { valid: false, discount: 0, message: `ন্যূনতম অর্ডার ৳${data.min_order_amount}` };
  }

  const discount = data.discount_type === "percentage"
    ? Math.round(orderTotal * data.discount_value / 100)
    : data.discount_value;

  return { valid: true, discount, message: `৳${discount} ছাড় পেয়েছেন!`, couponId: data.id };
}

/** Increment used_count after successful order */
export async function markCouponUsed(couponId: string) {
  await supabase.rpc("increment_coupon_usage" as any, { coupon_id: couponId }).catch(() => {});
  // Fallback: direct update
  const { data } = await supabase.from("coupons").select("used_count").eq("id", couponId).single();
  if (data) {
    await supabase.from("coupons").update({ used_count: (data.used_count || 0) + 1 } as any).eq("id", couponId);
  }
}
