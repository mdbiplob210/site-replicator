CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
TO anon
USING (status = 'active');