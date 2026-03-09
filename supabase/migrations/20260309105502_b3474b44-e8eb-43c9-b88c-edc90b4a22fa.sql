
INSERT INTO storage.buckets (id, name, public) VALUES ('site-assets', 'site-assets', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view site-assets" ON storage.objects FOR SELECT USING (bucket_id = 'site-assets');
CREATE POLICY "Admins can upload site-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update site-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete site-assets" ON storage.objects FOR DELETE USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));
