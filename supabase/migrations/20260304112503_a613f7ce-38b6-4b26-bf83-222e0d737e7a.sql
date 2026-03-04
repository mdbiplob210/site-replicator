
-- Create screenshots table
CREATE TABLE public.screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.screenshots ENABLE ROW LEVEL SECURITY;

-- Only admins can manage screenshots
CREATE POLICY "Admins can manage screenshots"
  ON public.screenshots
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create storage bucket for screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('screenshots', 'screenshots', true);

-- Storage policies
CREATE POLICY "Admins can upload screenshots"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'screenshots' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view screenshots"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'screenshots');

CREATE POLICY "Admins can delete screenshots"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'screenshots' AND public.has_role(auth.uid(), 'admin'));
