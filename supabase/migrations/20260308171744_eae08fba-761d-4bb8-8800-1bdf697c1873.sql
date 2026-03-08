-- Fix RLS policies for products - make them PERMISSIVE instead of RESTRICTIVE
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix categories too
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix site_settings
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;

CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Fix orders - need anon insert for website orders
DROP POLICY IF EXISTS "Admins can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Employees can view orders" ON public.orders;

CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage orders" ON public.orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Employees can view orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));

-- Fix order_items - need anon insert
DROP POLICY IF EXISTS "Admins can manage order_items" ON public.order_items;
DROP POLICY IF EXISTS "Employees can view order_items" ON public.order_items;

CREATE POLICY "Anyone can insert order_items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage order_items" ON public.order_items FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Employees can view order_items" ON public.order_items FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));

-- Fix incomplete_orders - need anon insert
DROP POLICY IF EXISTS "Admins can manage incomplete_orders" ON public.incomplete_orders;

CREATE POLICY "Anyone can insert incomplete_orders" ON public.incomplete_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage incomplete_orders" ON public.incomplete_orders FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Fix order_sources
DROP POLICY IF EXISTS "Anyone can view order_sources" ON public.order_sources;
DROP POLICY IF EXISTS "Admins can manage order_sources" ON public.order_sources;

CREATE POLICY "Anyone can view order_sources" ON public.order_sources FOR SELECT USING (true);
CREATE POLICY "Admins can manage order_sources" ON public.order_sources FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));