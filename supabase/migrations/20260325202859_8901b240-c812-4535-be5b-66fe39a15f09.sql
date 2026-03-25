-- Allow anonymous users to SELECT their own incomplete orders (by matching block_reason)
CREATE POLICY "Public can select own incomplete_orders"
ON public.incomplete_orders FOR SELECT
TO anon, authenticated
USING (block_reason = 'abandoned_form');

-- Allow anonymous users to UPDATE their own incomplete orders
CREATE POLICY "Public can update own incomplete_orders"
ON public.incomplete_orders FOR UPDATE
TO anon, authenticated
USING (block_reason = 'abandoned_form')
WITH CHECK (block_reason = 'abandoned_form');

-- Allow anonymous users to DELETE their own incomplete orders (cleanup after successful order)
CREATE POLICY "Public can delete own incomplete_orders"
ON public.incomplete_orders FOR DELETE
TO anon, authenticated
USING (block_reason = 'abandoned_form');