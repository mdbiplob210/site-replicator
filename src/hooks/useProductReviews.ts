import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("is_approved", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useAllReviews() {
  return useQuery({
    queryKey: ["all-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (review: {
      product_id: string;
      customer_name: string;
      customer_phone?: string;
      rating: number;
      review_text?: string;
    }) => {
      const { error } = await supabase.from("product_reviews").insert(review as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-reviews", vars.product_id] });
      toast.success("রিভিউ সাবমিট হয়েছে! অনুমোদনের পর দেখা যাবে।");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useApproveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, approved }: { id: string; approved: boolean }) => {
      const { error } = await supabase
        .from("product_reviews")
        .update({ is_approved: approved } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-reviews"] });
      toast.success("Review updated");
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-reviews"] });
      toast.success("Review deleted");
    },
  });
}
