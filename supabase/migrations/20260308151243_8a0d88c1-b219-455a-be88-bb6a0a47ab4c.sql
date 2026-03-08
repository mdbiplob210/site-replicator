
-- Fix 1: Replace public SELECT policy on orders with admin/employee-only access
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

CREATE POLICY "Employees can view orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_permission(auth.uid(), 'view_orders')
  );
