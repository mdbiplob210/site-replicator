
-- Login activity tracking table
CREATE TABLE public.login_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text,
  ip_address text,
  user_agent text,
  device_type text DEFAULT 'unknown',
  browser text,
  os text,
  status text NOT NULL DEFAULT 'success',
  fail_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage login_activity"
  ON public.login_activity FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own login_activity"
  ON public.login_activity FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User presence / online status tracking
CREATE TABLE public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  current_page text,
  is_online boolean DEFAULT true,
  device_info text,
  ip_address text
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all presence"
  ON public.user_presence FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can upsert own presence"
  ON public.user_presence FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence"
  ON public.user_presence FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Enable realtime for presence
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Index for performance
CREATE INDEX idx_login_activity_user_id ON public.login_activity(user_id);
CREATE INDEX idx_login_activity_created_at ON public.login_activity(created_at DESC);
CREATE INDEX idx_user_presence_user_id ON public.user_presence(user_id);
