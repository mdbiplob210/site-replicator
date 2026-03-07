
-- Add tracking columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS client_ip text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_agent text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS device_info text;

-- Create incomplete_orders table for blocked/abandoned orders
CREATE TABLE public.incomplete_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  product_name text,
  product_code text,
  quantity integer DEFAULT 1,
  unit_price numeric DEFAULT 0,
  total_amount numeric DEFAULT 0,
  delivery_charge numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  notes text,
  landing_page_slug text,
  client_ip text,
  user_agent text,
  device_info text,
  block_reason text NOT NULL DEFAULT 'ip_blocked_24h',
  status text NOT NULL DEFAULT 'processing',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.incomplete_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage incomplete_orders" ON public.incomplete_orders
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert incomplete_orders" ON public.incomplete_orders
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
