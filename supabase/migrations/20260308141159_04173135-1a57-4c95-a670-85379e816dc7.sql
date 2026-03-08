
-- Create storage bucket for landing page images
INSERT INTO storage.buckets (id, name, public) VALUES ('landing-page-images', 'landing-page-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create landing_page_images table
CREATE TABLE IF NOT EXISTS public.landing_page_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landing_page_id UUID NOT NULL REFERENCES public.landing_pages(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  file_name TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_page_images ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage landing_page_images" ON public.landing_page_images
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view (for public landing pages)
CREATE POLICY "Anyone can view landing_page_images" ON public.landing_page_images
  FOR SELECT TO anon, authenticated
  USING (true);

-- Storage policies for landing-page-images bucket
CREATE POLICY "Admins can upload landing page images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'landing-page-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can update landing page images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'landing-page-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Admins can delete landing page images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'landing-page-images' AND (SELECT has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Anyone can view landing page images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'landing-page-images');
