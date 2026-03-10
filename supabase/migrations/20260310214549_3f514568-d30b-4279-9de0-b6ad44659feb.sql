
-- Website analytics events table
CREATE TABLE public.website_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL DEFAULT 'page_view',
  page_path text NOT NULL,
  page_title text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  product_code text,
  visitor_id text,
  session_id text,
  referrer text,
  user_agent text,
  device_type text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_website_events_created_at ON public.website_events(created_at DESC);
CREATE INDEX idx_website_events_event_type ON public.website_events(event_type);
CREATE INDEX idx_website_events_page_path ON public.website_events(page_path);
CREATE INDEX idx_website_events_product_id ON public.website_events(product_id);

-- Enable RLS
ALTER TABLE public.website_events ENABLE ROW LEVEL SECURITY;

-- Admins can read all
CREATE POLICY "Admins can manage website_events"
  ON public.website_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can insert (for anonymous tracking)
CREATE POLICY "Anyone can insert website_events"
  ON public.website_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);
