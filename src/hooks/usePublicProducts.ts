import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePublicProducts() {
  return useQuery({
    queryKey: ["public-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, selling_price, original_price, main_image_url, additional_images, short_description, detailed_description, youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders, free_delivery, created_at, updated_at, categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, product_code, selling_price, original_price, main_image_url, additional_images, short_description, detailed_description, youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders, free_delivery, created_at, updated_at, categories(name)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useSuggestedProducts(categoryId: string | null | undefined, currentProductId: string | undefined) {
  return useQuery({
    queryKey: ["suggested-products", categoryId, currentProductId],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("id, name, product_code, selling_price, original_price, main_image_url, category_id, stock_quantity, allow_out_of_stock_orders")
        .eq("status", "active")
        .neq("id", currentProductId || "")
        .limit(6);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      // If same category has fewer than 3, fetch more from other categories
      if (data && data.length < 3) {
        const existingIds = data.map(p => p.id);
        existingIds.push(currentProductId || "");
        const { data: moreData } = await supabase
          .from("products")
          .select("id, name, product_code, selling_price, original_price, main_image_url, category_id, stock_quantity, allow_out_of_stock_orders")
          .eq("status", "active")
          .not("id", "in", `(${existingIds.join(",")})`)
          .order("created_at", { ascending: false })
          .limit(6 - data.length);
        return [...data, ...(moreData || [])];
      }

      return data || [];
    },
    enabled: !!currentProductId,
  });
}
