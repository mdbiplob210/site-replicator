
-- Courier providers table (stores API configurations for each courier)
CREATE TABLE public.courier_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  api_configs jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Courier orders table (tracks orders submitted to couriers)
CREATE TABLE public.courier_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_provider_id uuid NOT NULL REFERENCES public.courier_providers(id) ON DELETE CASCADE,
  tracking_id text,
  consignment_id text,
  courier_status text NOT NULL DEFAULT 'pending',
  courier_response jsonb,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.courier_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_orders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage courier_providers" ON public.courier_providers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage courier_orders" ON public.courier_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default courier providers
INSERT INTO public.courier_providers (name, slug, api_configs) VALUES
  ('পাঠাও (Pathao)', 'pathao', '[]'::jsonb),
  ('রেডেক্স (Redx)', 'redx', '[]'::jsonb),
  ('স্টেডফাস্ট (Steadfast)', 'steadfast', '[]'::jsonb),
  ('eCourier', 'ecourier', '[]'::jsonb);

-- Webhook logs table
CREATE TABLE public.courier_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  courier_slug text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage webhook_logs" ON public.courier_webhook_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow webhook inserts without auth
CREATE POLICY "Anyone can insert webhook_logs" ON public.courier_webhook_logs FOR INSERT WITH CHECK (true);
