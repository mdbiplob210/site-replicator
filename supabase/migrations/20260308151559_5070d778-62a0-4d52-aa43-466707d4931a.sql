-- Fix 1: Remove unnecessary public INSERT policies (edge functions use service_role which bypasses RLS)
DROP POLICY IF EXISTS "Anyone can insert webhook_logs" ON public.courier_webhook_logs;
DROP POLICY IF EXISTS "Anyone can insert incomplete_orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Anyone can insert landing_page_events" ON public.landing_page_events;

-- Tighten order_activity_logs INSERT to employees only
DROP POLICY IF EXISTS "Authenticated can insert order_activity_logs" ON public.order_activity_logs;
CREATE POLICY "Employees can insert order_activity_logs" ON public.order_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_permission(auth.uid(), 'edit_orders')
  );

-- Fix 2: Remove public SELECT on blocked_ips/blocked_phones/fraud_settings (edge functions use service_role)
DROP POLICY IF EXISTS "Edge functions can read blocked_ips" ON public.blocked_ips;
DROP POLICY IF EXISTS "Edge functions can read blocked_phones" ON public.blocked_phones;
DROP POLICY IF EXISTS "Edge functions can read fraud_settings" ON public.fraud_settings;