
-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON public.orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders (source) WHERE source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders (payment_status);

-- Order items lookup by order_id
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- Products queries
CREATE INDEX IF NOT EXISTS idx_products_status_created ON public.products (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products (slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category_id) WHERE category_id IS NOT NULL;

-- Site settings key lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_settings_key ON public.site_settings (key);

-- Finance records
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON public.finance_records (type);
CREATE INDEX IF NOT EXISTS idx_finance_records_created ON public.finance_records (created_at DESC);

-- Ad spends date lookup
CREATE INDEX IF NOT EXISTS idx_ad_spends_date ON public.ad_spends (spend_date DESC);

-- Landing page events
CREATE INDEX IF NOT EXISTS idx_landing_events_page_created ON public.landing_page_events (landing_page_id, created_at DESC);

-- Courier orders
CREATE INDEX IF NOT EXISTS idx_courier_orders_order ON public.courier_orders (order_id);

-- Order activity logs
CREATE INDEX IF NOT EXISTS idx_order_activity_order ON public.order_activity_logs (order_id, created_at DESC);

-- Notifications user lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications (user_id, is_read, created_at DESC);

-- User roles lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user ON public.user_roles (user_id);

-- Login attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts (ip_address, attempted_at DESC);
