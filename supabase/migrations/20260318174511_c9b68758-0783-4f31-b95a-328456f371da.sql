-- Performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_products_status_created ON products(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category_status ON products(category_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_banners_active_sort ON banners(is_active, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_site_settings_public ON site_settings(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id, is_approved);
CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id, is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_landing_page_events_page ON landing_page_events(landing_page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_courier_orders_order ON courier_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);