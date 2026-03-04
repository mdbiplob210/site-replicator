
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view categories" ON public.categories
  FOR SELECT TO authenticated
  USING (true);

-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  product_code TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  purchase_price NUMERIC NOT NULL DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC NOT NULL DEFAULT 0,
  additional_cost NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  short_description TEXT,
  detailed_description TEXT,
  youtube_url TEXT,
  internal_note TEXT,
  main_image_url TEXT,
  additional_images TEXT[] DEFAULT '{}',
  free_delivery BOOLEAN NOT NULL DEFAULT false,
  allow_out_of_stock_orders BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT TO authenticated
  USING (true);
