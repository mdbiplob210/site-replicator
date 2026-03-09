
-- 1. Fix products: remove anon from SELECT policy, keep authenticated
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Authenticated can view products"
  ON public.products FOR SELECT TO authenticated
  USING (true);

-- Ensure anon can SELECT from products_public view
GRANT SELECT ON public.products_public TO anon;
GRANT SELECT ON public.products_public TO authenticated;

-- 2. Fix notifications: restrict INSERT to service role or self-targeting
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. Fix function search_path on generate_order_number
CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT CAST(nextval('public.order_number_seq') AS text)
$function$;

-- 4. Fix function search_path on distribute_order_to_panels
CREATE OR REPLACE FUNCTION public.distribute_order_to_panels()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  panel_record RECORD;
BEGIN
  FOR panel_record IN 
    SELECT ep.user_id, ep.panel_name
    FROM public.employee_panels ep
    WHERE ep.is_active = true
    ORDER BY (
      SELECT COUNT(*) FROM public.order_assignments oa 
      WHERE oa.assigned_to = ep.user_id AND oa.status = 'pending'
    ) ASC
  LOOP
    INSERT INTO public.order_assignments (order_id, assigned_to, status)
    VALUES (NEW.id, panel_record.user_id, 'pending')
    ON CONFLICT (order_id, assigned_to) DO NOTHING;
    
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      panel_record.user_id,
      'নতুন অর্ডার এসেছে!',
      'অর্ডার #' || NEW.order_number || ' - ' || NEW.customer_name,
      'order',
      NEW.id::text
    );
  END LOOP;
  
  RETURN NEW;
END;
$function$;
