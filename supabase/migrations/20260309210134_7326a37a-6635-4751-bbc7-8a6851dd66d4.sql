
-- Add slug column to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS slug text;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_unique ON public.products(slug) WHERE slug IS NOT NULL;

-- Generate slugs from existing product names
UPDATE public.products 
SET slug = LOWER(
  REGEXP_REPLACE(
    REGEXP_REPLACE(
      TRIM(name),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )
) || '-' || LEFT(id::text, 8)
WHERE slug IS NULL;

-- Create function to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := LOWER(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          TRIM(NEW.name),
          '[^a-zA-Z0-9\s-]', '', 'g'
        ),
        '\s+', '-', 'g'
      )
    ) || '-' || LEFT(NEW.id::text, 8);
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS set_product_slug ON public.products;
CREATE TRIGGER set_product_slug
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_product_slug();

-- Recreate the products_public view to include slug
CREATE OR REPLACE VIEW public.products_public AS
SELECT 
  id, name, product_code, selling_price, original_price,
  main_image_url, additional_images, short_description, detailed_description,
  youtube_url, category_id, status, stock_quantity,
  allow_out_of_stock_orders, free_delivery, created_at, updated_at, slug
FROM public.products
WHERE status = 'active';
