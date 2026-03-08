
-- 1. Create a public-safe view for products that hides cost/internal data
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  id, name, product_code, selling_price, original_price, 
  main_image_url, additional_images, short_description, detailed_description,
  youtube_url, category_id, status, stock_quantity, allow_out_of_stock_orders,
  free_delivery, created_at, updated_at
FROM public.products;

-- 2. Add is_public column to site_settings with default true for existing rows
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true;

-- 3. Update the public SELECT policy on site_settings to only show public settings
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read public site_settings" ON public.site_settings 
  FOR SELECT TO anon, authenticated USING (is_public = true);

-- 4. Ensure admins still see all settings (already covered by ALL policy)
