
-- Update has_permission function to also check role-based implicit permissions
-- Managers and moderators get view_orders, edit_orders, change_order_status, view_products by default
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission employee_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employee_permissions
    WHERE user_id = _user_id AND permission = _permission
  )
  OR (
    -- Manager role gets implicit order and product permissions
    _permission IN ('view_orders', 'edit_orders', 'change_order_status', 'view_products', 'edit_products', 'view_dashboard', 'create_orders')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role IN ('manager', 'moderator')
    )
  )
  OR (
    -- User role gets implicit view_orders and view_dashboard
    _permission IN ('view_orders', 'view_dashboard')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'user'
    )
  )
  OR (
    -- Accounting role gets implicit finance permissions
    _permission IN ('view_orders', 'view_finance', 'view_dashboard')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'accounting'
    )
  )
  OR (
    -- Ad analytics role gets implicit analytics permissions
    _permission IN ('view_analytics', 'view_dashboard', 'manage_meta_ads')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = 'ad_analytics'
    )
  )
$$;
