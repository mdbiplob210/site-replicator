-- Fix orders policies - ALL includes INSERT which conflicts
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can view orders" ON public.orders;

-- Public insert
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
-- Admin full access for SELECT, UPDATE, DELETE
CREATE POLICY "Admins full access orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'edit_orders'::employee_permission));
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix order_items same way
DROP POLICY IF EXISTS "Anyone can insert order_items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can manage order_items" ON public.order_items;
DROP POLICY IF EXISTS "Employees can view order_items" ON public.order_items;

CREATE POLICY "Public can insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view order_items" ON public.order_items FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));
CREATE POLICY "Admins update order_items" ON public.order_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete order_items" ON public.order_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix incomplete_orders same way
DROP POLICY IF EXISTS "Anyone can insert incomplete_orders" ON public.incomplete_orders;
DROP POLICY IF EXISTS "Admins can manage incomplete_orders" ON public.incomplete_orders;

CREATE POLICY "Public can insert incomplete_orders" ON public.incomplete_orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins view incomplete_orders" ON public.incomplete_orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update incomplete_orders" ON public.incomplete_orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete incomplete_orders" ON public.incomplete_orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));