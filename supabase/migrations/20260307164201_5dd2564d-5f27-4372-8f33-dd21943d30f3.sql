
ALTER TABLE public.courier_providers ADD COLUMN IF NOT EXISTS auth_token text DEFAULT ('ct_' || replace(gen_random_uuid()::text, '-', ''));
