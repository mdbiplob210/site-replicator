
CREATE TABLE public.courier_check_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL UNIQUE,
  response_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courier_check_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage courier_check_cache"
  ON public.courier_check_cache FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
