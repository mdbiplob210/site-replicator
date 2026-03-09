
-- Performance indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders (order_number);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source);
CREATE INDEX IF NOT EXISTS idx_orders_memo_printed ON public.orders (memo_printed) WHERE memo_printed = false;

-- Performance indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items (product_id);

-- Performance indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products (status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_product_code ON public.products (product_code);

-- Performance indexes for other frequently queried tables
CREATE INDEX IF NOT EXISTS idx_courier_orders_order_id ON public.courier_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON public.invoices (order_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_page_id ON public.landing_page_events (landing_page_id);
CREATE INDEX IF NOT EXISTS idx_landing_page_events_created ON public.landing_page_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_order_activity_logs_order_id ON public.order_activity_logs (order_id);
CREATE INDEX IF NOT EXISTS idx_order_assignments_assigned_to ON public.order_assignments (assigned_to, status);
CREATE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings (key);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON public.landing_pages (slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_incomplete_orders_status ON public.incomplete_orders (status);
CREATE INDEX IF NOT EXISTS idx_ad_spends_date ON public.ad_spends (spend_date);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_employee_permissions_user_id ON public.employee_permissions (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks (created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks (assigned_to);
