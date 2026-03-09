
-- Update distribute_order_to_panels to also create notifications
CREATE OR REPLACE FUNCTION public.distribute_order_to_panels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    
    -- Send notification to the panel employee
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
$$;
