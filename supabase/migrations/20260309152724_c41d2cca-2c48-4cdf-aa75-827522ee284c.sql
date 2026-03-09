
-- Create invoices table for auto-generated delivery invoices
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  courier_provider_id uuid REFERENCES public.courier_providers(id),
  courier_tracking_id text,
  customer_name text NOT NULL,
  customer_phone text,
  customer_address text,
  subtotal numeric NOT NULL DEFAULT 0,
  delivery_charge numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  cod_amount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0,
  delivery_date timestamp with time zone,
  status text NOT NULL DEFAULT 'generated',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Unique constraint: one invoice per order
ALTER TABLE public.invoices ADD CONSTRAINT invoices_order_id_unique UNIQUE (order_id);

-- RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage invoices"
ON public.invoices
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Accounting can view invoices"
ON public.invoices
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'accounting'::app_role));

-- Updated_at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
