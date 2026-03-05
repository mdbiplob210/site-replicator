
-- Meta campaigns table
CREATE TABLE public.meta_campaigns (
  id text NOT NULL PRIMARY KEY,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'UNKNOWN',
  objective text,
  daily_budget numeric,
  lifetime_budget numeric,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  purchase_value numeric NOT NULL DEFAULT 0,
  cost_per_purchase numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  date_preset text NOT NULL DEFAULT 'today',
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Meta ad sets table
CREATE TABLE public.meta_adsets (
  id text NOT NULL PRIMARY KEY,
  campaign_id text NOT NULL REFERENCES public.meta_campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'UNKNOWN',
  audience text,
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  cost_per_purchase numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  date_preset text NOT NULL DEFAULT 'today',
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Meta ads table
CREATE TABLE public.meta_ads (
  id text NOT NULL PRIMARY KEY,
  adset_id text NOT NULL REFERENCES public.meta_adsets(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'UNKNOWN',
  spend numeric NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  ctr numeric NOT NULL DEFAULT 0,
  purchases integer NOT NULL DEFAULT 0,
  cost_per_result numeric NOT NULL DEFAULT 0,
  roas numeric NOT NULL DEFAULT 0,
  date_preset text NOT NULL DEFAULT 'today',
  synced_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meta_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_adsets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_ads ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage meta_campaigns" ON public.meta_campaigns FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage meta_adsets" ON public.meta_adsets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage meta_ads" ON public.meta_ads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
