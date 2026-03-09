-- Add ad_account_id column to meta tables for multi-account support
ALTER TABLE public.meta_campaigns ADD COLUMN IF NOT EXISTS ad_account_id text NOT NULL DEFAULT '';
ALTER TABLE public.meta_adsets ADD COLUMN IF NOT EXISTS ad_account_id text NOT NULL DEFAULT '';
ALTER TABLE public.meta_ads ADD COLUMN IF NOT EXISTS ad_account_id text NOT NULL DEFAULT '';

-- Create index for faster filtering by account
CREATE INDEX IF NOT EXISTS idx_meta_campaigns_ad_account ON public.meta_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_adsets_ad_account ON public.meta_adsets(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_meta_ads_ad_account ON public.meta_ads(ad_account_id);