
CREATE TABLE public.landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  html_content text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  fb_pixel_id text DEFAULT NULL,
  tiktok_pixel_id text DEFAULT NULL,
  gtm_id text DEFAULT NULL,
  custom_head_scripts text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage landing_pages" ON public.landing_pages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active landing_pages" ON public.landing_pages
  FOR SELECT TO anon, authenticated
  USING (is_active = true);
