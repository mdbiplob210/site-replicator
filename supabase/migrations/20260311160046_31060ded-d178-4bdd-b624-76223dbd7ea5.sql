CREATE POLICY "Admins can insert order_items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'edit_orders'::employee_permission)
);