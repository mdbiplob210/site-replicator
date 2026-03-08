
-- Make screenshots bucket private
UPDATE storage.buckets SET public = false WHERE id = 'screenshots';

-- Drop the public access policy
DROP POLICY IF EXISTS "Anyone can view screenshots" ON storage.objects;

-- Create admin-only view policy
CREATE POLICY "Admins can view screenshots" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'screenshots' AND public.has_role(auth.uid(), 'admin'::public.app_role));
