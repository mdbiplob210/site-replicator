
-- Create order status enum
CREATE TYPE public.order_status AS ENUM (
  'processing', 'confirmed', 'cancelled', 'on_hold', 
  'ship_later', 'in_courier', 'delivered', 'returned'
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_address TEXT,
  status order_status NOT NULL DEFAULT 'processing',
  total_amount NUMERIC NOT NULL DEFAULT 0,
  delivery_charge NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  product_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finance_records table for bank, loans, investments
CREATE TABLE public.finance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bank_balance', 'loan', 'investment')),
  label TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ad_spends table
CREATE TABLE public.ad_spends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'meta',
  amount_bdt NUMERIC NOT NULL DEFAULT 0,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_spends ENABLE ROW LEVEL SECURITY;

-- RLS policies for orders
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view orders" ON public.orders FOR SELECT
  USING (true);

-- RLS policies for finance_records
CREATE POLICY "Admins can manage finance" ON public.finance_records FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS policies for ad_spends
CREATE POLICY "Admins can manage ad_spends" ON public.ad_spends FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update triggers
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finance_updated_at BEFORE UPDATE ON public.finance_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
