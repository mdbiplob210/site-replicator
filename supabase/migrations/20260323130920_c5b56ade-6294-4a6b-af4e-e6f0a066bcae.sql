-- Remove duplicate trigger
DROP TRIGGER IF EXISTS distribute_new_order ON public.orders;

-- Update function to assign to ONLY ONE panel (least pending orders)
CREATE OR REPLACE FUNCTION public.distribute_order_to_panels()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  target_user_id uuid;
  target_panel_name text;
BEGIN
  -- Find the active panel with the fewest pending assignments
  SELECT ep.user_id, ep.panel_name
  INTO target_user_id, target_panel_name
  FROM public.employee_panels ep
  WHERE ep.is_active = true
  ORDER BY (
    SELECT COUNT(*) FROM public.order_assignments oa 
    WHERE oa.assigned_to = ep.user_id AND oa.status = 'pending'
  ) ASC
  LIMIT 1;

  -- If no active panel found, skip
  IF target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Assign order to the single panel with fewest pending
  INSERT INTO public.order_assignments (order_id, assigned_to, status)
  VALUES (NEW.id, target_user_id, 'pending')
  ON CONFLICT (order_id, assigned_to) DO NOTHING;

  -- Send notification
  INSERT INTO public.notifications (user_id, title, message, type, reference_id)
  VALUES (
    target_user_id,
    'নতুন অর্ডার এসেছে!',
    'অর্ডার #' || NEW.order_number || ' - ' || NEW.customer_name,
    'order',
    NEW.id::text
  );

  RETURN NEW;
END;
$function$;