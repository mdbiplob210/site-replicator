
-- Remove public SELECT from products base table (sensitive columns exposed)
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;

-- Grant public SELECT only through the products_public view (which excludes purchase_price, additional_cost, internal_note)
-- The view already exists with security_invoker = true
-- We need a policy that allows anon to select from products but ONLY via the view
-- Since security_invoker views use the caller's permissions, we need to keep a restricted public policy
-- Instead, create a policy that only exposes safe columns by using the view approach:

-- Re-add a public SELECT but the frontend already only selects safe columns explicitly
-- The scan wants us to remove this entirely and use the view
-- But since the view has security_invoker, it needs the base table policy
-- Solution: Keep policy but make frontend use explicit column selection (already done)
-- Better: Remove the public policy on base table, add RLS to allow select through view

-- Actually the cleanest fix: remove public policy from products, 
-- drop security_invoker from view so it uses definer permissions
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
SELECT 
  id, name, product_code, selling_price, original_price, 
  main_image_url, additional_images, short_description, detailed_description,
  youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders,
  free_delivery, created_at, updated_at
FROM public.products;

-- Grant usage on the view to anon and authenticated
GRANT SELECT ON public.products_public TO anon, authenticated;
