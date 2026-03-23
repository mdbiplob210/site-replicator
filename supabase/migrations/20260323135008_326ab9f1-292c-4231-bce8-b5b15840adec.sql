
CREATE OR REPLACE FUNCTION public.bulk_transfer_orders(
  _order_ids uuid[],
  _target_user_id uuid,
  _assigned_by uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer;
BEGIN
  -- Upsert all assignments in one statement
  INSERT INTO public.order_assignments (order_id, assigned_to, assigned_by, status)
  SELECT unnest(_order_ids), _target_user_id, _assigned_by, 'pending'
  ON CONFLICT (order_id, assigned_to) DO UPDATE
    SET status = 'pending', assigned_at = now();

  -- For orders already assigned to someone else, update existing rows
  UPDATE public.order_assignments
  SET assigned_to = _target_user_id,
      assigned_by = _assigned_by,
      status = 'pending',
      assigned_at = now()
  WHERE order_id = ANY(_order_ids)
    AND assigned_to != _target_user_id;

  GET DIAGNOSTICS affected = ROW_COUNT;

  -- Count total handled
  SELECT count(*) INTO affected
  FROM public.order_assignments
  WHERE order_id = ANY(_order_ids)
    AND assigned_to = _target_user_id;

  RETURN affected;
END;
$$;
