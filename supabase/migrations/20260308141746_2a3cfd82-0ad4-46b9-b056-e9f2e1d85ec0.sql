
-- Fraud detection settings table
CREATE TABLE IF NOT EXISTS public.fraud_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protection_enabled BOOLEAN NOT NULL DEFAULT false,
  repeat_block_duration TEXT NOT NULL DEFAULT 'off',
  device_fingerprint_enabled BOOLEAN NOT NULL DEFAULT false,
  delivery_ratio_enabled BOOLEAN NOT NULL DEFAULT false,
  min_delivery_ratio INTEGER NOT NULL DEFAULT 0,
  block_popup_message TEXT NOT NULL DEFAULT 'আপনি ইতিমধ্যে একটি অর্ডার করেছেন। কিছুক্ষণ পর আবার চেষ্টা করুন।',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage fraud_settings" ON public.fraud_settings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Edge functions can read fraud_settings" ON public.fraud_settings
  FOR SELECT TO anon
  USING (true);

-- Insert default row
INSERT INTO public.fraud_settings (id) VALUES (gen_random_uuid());

-- Blocked IPs table (permanent blocks)
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_by UUID
);

ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked_ips" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Edge functions can read blocked_ips" ON public.blocked_ips
  FOR SELECT TO anon
  USING (true);

-- Blocked phone numbers table (permanent blocks)
CREATE TABLE IF NOT EXISTS public.blocked_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  reason TEXT,
  blocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  blocked_by UUID
);

ALTER TABLE public.blocked_phones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocked_phones" ON public.blocked_phones
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Edge functions can read blocked_phones" ON public.blocked_phones
  FOR SELECT TO anon
  USING (true);
