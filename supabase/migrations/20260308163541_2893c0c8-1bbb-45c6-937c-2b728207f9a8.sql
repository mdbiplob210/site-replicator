
-- Drop screenshots table
DROP TABLE IF EXISTS public.screenshots;

-- Drop screenshots storage bucket policies
DROP POLICY IF EXISTS "Admins can view screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view screenshots" ON storage.objects;
