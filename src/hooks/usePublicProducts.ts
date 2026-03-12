import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const PRODUCT_FIELDS = "id, name, product_code, selling_price, original_price, main_image_url, additional_images, short_description, detailed_description, youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders, free_delivery, created_at, updated_at, slug";

export function usePublicProducts() {
  return useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products_public")
        .select(PRODUCT_FIELDS)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useProduct(slugOrId: string) {
  return useQuery({
    queryKey: ["product", slugOrId],
    queryFn: async () => {
      // Try slug first, then fall back to id
      const { data, error } = await supabase
        .from("products_public")
        .select(PRODUCT_FIELDS)
        .eq("slug", slugOrId)
        .maybeSingle();
      
      if (data) return data;
      
      // Fallback: try by id (for backward compatibility)
      const { data: dataById, error: errorById } = await supabase
        .from("products_public")
        .select(PRODUCT_FIELDS)
        .eq("id", slugOrId)
        .single();
      if (errorById) throw errorById;
      return dataById;
    },
    enabled: !!slugOrId,
    staleTime: 2 * 60 * 1000,
  });
}

const SUGGESTION_FIELDS = "id, name, product_code, selling_price, original_price, main_image_url, additional_images, category_id, stock_quantity, allow_out_of_stock_orders, slug";

export function useSuggestedProducts(categoryId: string | null | undefined, currentProductId: string | undefined) {
  return useQuery({
    queryKey: ["suggested-products", categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from("products_public")
        .select(SUGGESTION_FIELDS)
        .eq("status", "active")
        .neq("id", currentProductId || "")
        .limit(6);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      if (data && data.length < 3) {
        const existingIds = data.map(p => p.id);
        existingIds.push(currentProductId || "");
        const { data: moreData } = await supabase
          .from("products_public")
          .select(SUGGESTION_FIELDS)
          .eq("status", "active")
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(6 - data.length);
        return [...data, ...(moreData || [])];
      }

      return data || [];
    },
    enabled: !!currentProductId,
    staleTime: 2 * 60 * 1000,
  });
}
