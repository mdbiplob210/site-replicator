
-- Fix: Restrict products table SELECT to admin and employees with product permissions
DROP POLICY IF EXISTS "Authenticated can view products" ON public.products;

CREATE POLICY "Admin and permitted users can view products"
ON public.products
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_permission(auth.uid(), 'view_products'::employee_permission)
);
