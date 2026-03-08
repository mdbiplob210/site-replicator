
-- Fix security definer view - recreate with SECURITY INVOKER
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public WITH (security_invoker = true) AS
SELECT 
  id, name, product_code, selling_price, original_price, 
  main_image_url, additional_images, short_description, detailed_description,
  youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders,
  free_delivery, created_at, updated_at
FROM public.products;
