import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getDisplayImage } from "@/lib/imageUtils";
import { getOptimizedImageUrl } from "@/lib/imageOptimizer";
import { getPrefetchedData } from "@/lib/prefetch";

const PRODUCT_FIELDS = "id, name, product_code, selling_price, original_price, main_image_url, additional_images, short_description, detailed_description, youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders, free_delivery, created_at, updated_at, slug";

// Preload first N product images immediately after data fetch
function preloadProductImages(products: any[], count = 6) {
  products.slice(0, count).forEach((p) => {
    const src = getDisplayImage(p);
    if (src) {
      const url = getOptimizedImageUrl(src, { width: 400, quality: 80 });
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = url;
      document.head.appendChild(link);
    }
  });
}

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
      const products = data || [];
      preloadProductImages(products);
      return products;
    },
    initialData: () => {
      const cached = getPrefetchedData<any[]>("public-products");
      if (cached && cached.length > 0) {
        preloadProductImages(cached);
        return cached;
      }
      return undefined;
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
    initialData: () => {
      // Try to find in prefetched products list
      const cached = getPrefetchedData<any[]>("public-products");
      if (cached) {
        const found = cached.find(p => p.slug === slugOrId || p.id === slugOrId);
        if (found) return found;
      }
      return undefined;
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
    initialData: () => {
      // Use prefetched products as initial suggestions
      const cached = getPrefetchedData<any[]>("public-products");
      if (cached && currentProductId) {
        let filtered = cached.filter(p => p.id !== currentProductId);
        if (categoryId) {
          const catFiltered = filtered.filter(p => p.category_id === categoryId);
          if (catFiltered.length >= 3) filtered = catFiltered;
        }
        return filtered.slice(0, 6);
      }
      return undefined;
    },
    enabled: !!currentProductId,
    staleTime: 2 * 60 * 1000,
  });
}
