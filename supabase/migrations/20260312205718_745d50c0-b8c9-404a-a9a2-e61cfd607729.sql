
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission employee_permission)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  -- Admin role always has all permissions
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
  OR EXISTS (
    SELECT 1 FROM public.employee_permissions
    WHERE user_id = _user_id AND permission = _permission
  )
$$;
