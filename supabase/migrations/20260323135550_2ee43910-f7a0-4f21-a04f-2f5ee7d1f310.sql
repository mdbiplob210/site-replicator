
CREATE OR REPLACE FUNCTION public.bulk_transfer_orders(_order_ids uuid[], _target_user_id uuid, _assigned_by uuid DEFAULT NULL::uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  -- Delete all existing assignments for these orders
  DELETE FROM public.order_assignments
  WHERE order_id = ANY(_order_ids);

  -- Insert fresh assignments for target user
  INSERT INTO public.order_assignments (order_id, assigned_to, assigned_by, status)
  SELECT unnest(_order_ids), _target_user_id, _assigned_by, 'pending';

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
