
-- Fix: Change ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- This is required because RESTRICTIVE policies cannot grant access on their own

-- ad_spends
DROP POLICY IF EXISTS "Admins can manage ad_spends" ON public.ad_spends;
CREATE POLICY "Admins can manage ad_spends" ON public.ad_spends FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- api_keys
DROP POLICY IF EXISTS "Admins can manage api_keys" ON public.api_keys;
CREATE POLICY "Admins can manage api_keys" ON public.api_keys FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- blocked_ips
DROP POLICY IF EXISTS "Admins can manage blocked_ips" ON public.blocked_ips;
CREATE POLICY "Admins can manage blocked_ips" ON public.blocked_ips FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- blocked_phones
DROP POLICY IF EXISTS "Admins can manage blocked_phones" ON public.blocked_phones;
CREATE POLICY "Admins can manage blocked_phones" ON public.blocked_phones FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- categories
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

-- courier_orders
DROP POLICY IF EXISTS "Admins can manage courier_orders" ON public.courier_orders;
CREATE POLICY "Admins can manage courier_orders" ON public.courier_orders FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- courier_providers
DROP POLICY IF EXISTS "Admins can manage courier_providers" ON public.courier_providers;
CREATE POLICY "Admins can manage courier_providers" ON public.courier_providers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- courier_webhook_logs
DROP POLICY IF EXISTS "Admins can manage webhook_logs" ON public.courier_webhook_logs;
CREATE POLICY "Admins can manage webhook_logs" ON public.courier_webhook_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- employee_panels
DROP POLICY IF EXISTS "Admins can manage panels" ON public.employee_panels;
CREATE POLICY "Admins can manage panels" ON public.employee_panels FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view own panel" ON public.employee_panels;
CREATE POLICY "Users can view own panel" ON public.employee_panels FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- employee_permissions
DROP POLICY IF EXISTS "Admins can manage employee permissions" ON public.employee_permissions;
CREATE POLICY "Admins can manage employee permissions" ON public.employee_permissions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view own permissions" ON public.employee_permissions;
CREATE POLICY "Users can view own permissions" ON public.employee_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- finance_records
DROP POLICY IF EXISTS "Admins can manage finance" ON public.finance_records;
CREATE POLICY "Admins can manage finance" ON public.finance_records FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- fraud_settings
DROP POLICY IF EXISTS "Admins can manage fraud_settings" ON public.fraud_settings;
CREATE POLICY "Admins can manage fraud_settings" ON public.fraud_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- incomplete_orders
DROP POLICY IF EXISTS "Admins delete incomplete_orders" ON public.incomplete_orders;
CREATE POLICY "Admins delete incomplete_orders" ON public.incomplete_orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins update incomplete_orders" ON public.incomplete_orders;
CREATE POLICY "Admins update incomplete_orders" ON public.incomplete_orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins view incomplete_orders" ON public.incomplete_orders;
CREATE POLICY "Admins view incomplete_orders" ON public.incomplete_orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Public can insert incomplete_orders" ON public.incomplete_orders;
CREATE POLICY "Public can insert incomplete_orders" ON public.incomplete_orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- landing_page_events
DROP POLICY IF EXISTS "Admins can manage landing_page_events" ON public.landing_page_events;
CREATE POLICY "Admins can manage landing_page_events" ON public.landing_page_events FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- landing_page_images
DROP POLICY IF EXISTS "Admins can manage landing_page_images" ON public.landing_page_images;
CREATE POLICY "Admins can manage landing_page_images" ON public.landing_page_images FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view landing_page_images" ON public.landing_page_images;
CREATE POLICY "Anyone can view landing_page_images" ON public.landing_page_images FOR SELECT TO anon, authenticated USING (true);

-- landing_pages
DROP POLICY IF EXISTS "Admins can manage landing_pages" ON public.landing_pages;
CREATE POLICY "Admins can manage landing_pages" ON public.landing_pages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view active landing_pages" ON public.landing_pages;
CREATE POLICY "Anyone can view active landing_pages" ON public.landing_pages FOR SELECT TO anon, authenticated USING (is_active = true);

-- meta_ads
DROP POLICY IF EXISTS "Admins can manage meta_ads" ON public.meta_ads;
CREATE POLICY "Admins can manage meta_ads" ON public.meta_ads FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_adsets
DROP POLICY IF EXISTS "Admins can manage meta_adsets" ON public.meta_adsets;
CREATE POLICY "Admins can manage meta_adsets" ON public.meta_adsets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- meta_campaigns
DROP POLICY IF EXISTS "Admins can manage meta_campaigns" ON public.meta_campaigns;
CREATE POLICY "Admins can manage meta_campaigns" ON public.meta_campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- order_activity_logs
DROP POLICY IF EXISTS "Admins can manage order_activity_logs" ON public.order_activity_logs;
CREATE POLICY "Admins can manage order_activity_logs" ON public.order_activity_logs FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Employees can insert order_activity_logs" ON public.order_activity_logs;
CREATE POLICY "Employees can insert order_activity_logs" ON public.order_activity_logs FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'edit_orders'::employee_permission));
DROP POLICY IF EXISTS "Employees can view order_activity_logs" ON public.order_activity_logs;
CREATE POLICY "Employees can view order_activity_logs" ON public.order_activity_logs FOR SELECT TO authenticated USING (has_permission(auth.uid(), 'view_orders'::employee_permission));

-- order_assignments
DROP POLICY IF EXISTS "Admins can manage order assignments" ON public.order_assignments;
CREATE POLICY "Admins can manage order assignments" ON public.order_assignments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view own assignments" ON public.order_assignments;
CREATE POLICY "Users can view own assignments" ON public.order_assignments FOR SELECT TO authenticated USING (auth.uid() = assigned_to);

-- order_items
DROP POLICY IF EXISTS "Admins delete order_items" ON public.order_items;
CREATE POLICY "Admins delete order_items" ON public.order_items FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins update order_items" ON public.order_items;
CREATE POLICY "Admins update order_items" ON public.order_items FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins view order_items" ON public.order_items;
CREATE POLICY "Admins view order_items" ON public.order_items FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));
DROP POLICY IF EXISTS "Public can insert order_items" ON public.order_items;
CREATE POLICY "Public can insert order_items" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);

-- order_sources
DROP POLICY IF EXISTS "Admins can manage order_sources" ON public.order_sources;
CREATE POLICY "Admins can manage order_sources" ON public.order_sources FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view order_sources" ON public.order_sources;
CREATE POLICY "Anyone can view order_sources" ON public.order_sources FOR SELECT TO anon, authenticated USING (true);

-- orders
DROP POLICY IF EXISTS "Admins delete orders" ON public.orders;
CREATE POLICY "Admins delete orders" ON public.orders FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Admins full access orders" ON public.orders;
CREATE POLICY "Admins full access orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'view_orders'::employee_permission));
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_permission(auth.uid(), 'edit_orders'::employee_permission));
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
CREATE POLICY "Public can insert orders" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);

-- products
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);

-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- site_settings
DROP POLICY IF EXISTS "Admins can manage site_settings" ON public.site_settings;
CREATE POLICY "Admins can manage site_settings" ON public.site_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Anyone can read site_settings" ON public.site_settings;
CREATE POLICY "Anyone can read site_settings" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

-- user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
