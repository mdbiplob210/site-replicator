
-- Create delivery_assignments table
CREATE TABLE public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL,
  assigned_by uuid,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'delivered', 'returned')),
  delivered_at timestamptz,
  returned_at timestamptz,
  return_reason text,
  commission_amount numeric NOT NULL DEFAULT 0,
  collected_amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create rider_settings table
CREATE TABLE public.rider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_per_delivery numeric NOT NULL DEFAULT 20,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default rider settings
INSERT INTO public.rider_settings (commission_per_delivery) VALUES (20);

-- Enable RLS
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_settings ENABLE ROW LEVEL SECURITY;

-- RLS for delivery_assignments
CREATE POLICY "Admins can manage delivery_assignments"
  ON public.delivery_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Riders can view own assignments"
  ON public.delivery_assignments FOR SELECT TO authenticated
  USING (auth.uid() = rider_id);

CREATE POLICY "Riders can update own assignments"
  ON public.delivery_assignments FOR UPDATE TO authenticated
  USING (auth.uid() = rider_id);

-- RLS for rider_settings
CREATE POLICY "Admins can manage rider_settings"
  ON public.rider_settings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can read rider_settings"
  ON public.rider_settings FOR SELECT TO authenticated
  USING (true);

-- Allow riders to read hand_delivery orders
CREATE POLICY "Riders can view hand_delivery orders"
  ON public.orders FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'delivery_rider'::app_role)
    AND status = 'hand_delivery'::order_status
  );

-- Allow riders to view order_items for their assigned orders
CREATE POLICY "Riders can view assigned order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(), 'delivery_rider'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.delivery_assignments da
      WHERE da.order_id = order_items.order_id
      AND da.rider_id = auth.uid()
    )
  );
