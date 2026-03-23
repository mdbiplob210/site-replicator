
CREATE TABLE public.live_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_ip text,
  visitor_id text,
  customer_phone text,
  page_slug text,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_live_visitors_last_seen ON public.live_visitors (last_seen_at);
CREATE INDEX idx_live_visitors_client_ip ON public.live_visitors (client_ip);
CREATE INDEX idx_live_visitors_visitor_id ON public.live_visitors (visitor_id);

ALTER TABLE public.live_visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view live_visitors" ON public.live_visitors
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert live_visitors" ON public.live_visitors
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update live_visitors" ON public.live_visitors
  FOR UPDATE TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can delete live_visitors" ON public.live_visitors
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.live_visitors;
