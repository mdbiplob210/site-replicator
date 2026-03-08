-- Fix order_items: restrict SELECT to admin/employees with view_orders permission
DROP POLICY IF EXISTS "Anyone can view order_items" ON public.order_items;
CREATE POLICY "Employees can view order_items" ON public.order_items
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') 
    OR public.has_permission(auth.uid(), 'view_orders')
  );