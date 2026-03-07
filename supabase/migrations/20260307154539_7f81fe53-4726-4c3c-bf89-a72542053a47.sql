
CREATE TABLE public.landing_page_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landing_page_id uuid REFERENCES public.landing_pages(id) ON DELETE CASCADE NOT NULL,
  event_type text NOT NULL DEFAULT 'view',
  event_name text DEFAULT NULL,
  visitor_id text DEFAULT NULL,
  referrer text DEFAULT NULL,
  user_agent text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_lp_events_page_id ON public.landing_page_events(landing_page_id);
CREATE INDEX idx_lp_events_created_at ON public.landing_page_events(created_at);
CREATE INDEX idx_lp_events_type ON public.landing_page_events(event_type);

ALTER TABLE public.landing_page_events ENABLE ROW LEVEL SECURITY;

-- Anyone can insert events (public tracking)
CREATE POLICY "Anyone can insert landing_page_events"
ON public.landing_page_events FOR INSERT
WITH CHECK (true);

-- Only admins can view/manage events
CREATE POLICY "Admins can manage landing_page_events"
ON public.landing_page_events FOR ALL
USING (public.has_role(auth.uid(), 'admin'));
