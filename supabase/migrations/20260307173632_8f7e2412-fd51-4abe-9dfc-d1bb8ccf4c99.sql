
-- Add courier_note column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_note text DEFAULT NULL;

-- Create order activity logs table
CREATE TABLE public.order_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid DEFAULT NULL,
  user_name text DEFAULT NULL,
  action text NOT NULL,
  field_name text DEFAULT NULL,
  old_value text DEFAULT NULL,
  new_value text DEFAULT NULL,
  details text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_activity_logs ENABLE ROW LEVEL SECURITY;

-- Admins can manage
CREATE POLICY "Admins can manage order_activity_logs"
  ON public.order_activity_logs
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Employees with view_orders can read
CREATE POLICY "Employees can view order_activity_logs"
  ON public.order_activity_logs
  FOR SELECT
  TO authenticated
  USING (public.has_permission(auth.uid(), 'view_orders'));

-- Anyone can insert (for edge functions / webhooks)
CREATE POLICY "Authenticated can insert order_activity_logs"
  ON public.order_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_order_activity_logs_order_id ON public.order_activity_logs(order_id);
CREATE INDEX idx_order_activity_logs_created_at ON public.order_activity_logs(created_at DESC);
