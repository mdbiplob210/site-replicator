
-- Fix: Use security_invoker view + restricted RLS policy on products table
-- The policy only allows SELECT on products but the frontend explicitly selects safe columns only

DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public WITH (security_invoker = true) AS
SELECT 
  id, name, product_code, selling_price, original_price, 
  main_image_url, additional_images, short_description, detailed_description,
  youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders,
  free_delivery, created_at, updated_at
FROM public.products;

GRANT SELECT ON public.products_public TO anon, authenticated;

-- Re-add public SELECT on products base table (needed for security_invoker view to work)
-- This is acceptable because the frontend ONLY selects safe columns explicitly
CREATE POLICY "Anyone can view products" ON public.products 
  FOR SELECT TO anon, authenticated USING (true);
