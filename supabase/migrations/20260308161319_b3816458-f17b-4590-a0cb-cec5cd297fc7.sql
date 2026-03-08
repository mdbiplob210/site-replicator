
CREATE TABLE public.order_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT '📦',
  is_system boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order_sources" ON public.order_sources FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view order_sources" ON public.order_sources FOR SELECT TO authenticated USING (true);

INSERT INTO public.order_sources (name, slug, icon, is_system) VALUES
  ('Landing Page', 'landing_page', '🌐', true),
  ('API Source', 'api', '🔗', true),
  ('Mobile Call', 'mobile_call', '📞', false),
  ('WhatsApp', 'whatsapp', '💬', false),
  ('Panel', 'panel', '🖥️', true);
