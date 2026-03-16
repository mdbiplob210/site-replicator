import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: ["product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useAllProductVariants(productId: string) {
  return useQuery({
    queryKey: ["all-product-variants", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    enabled: !!productId,
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variant: {
      product_id: string;
      variant_name: string;
      variant_value: string;
      price_adjustment?: number;
      stock_quantity?: number;
      sku?: string;
    }) => {
      const { error } = await supabase.from("product_variants").insert(variant as any);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["product-variants", vars.product_id] });
      qc.invalidateQueries({ queryKey: ["all-product-variants", vars.product_id] });
      toast.success("Variant added");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase.from("product_variants").delete().eq("id", id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ["product-variants", productId] });
      qc.invalidateQueries({ queryKey: ["all-product-variants", productId] });
      toast.success("Variant deleted");
    },
  });
}
