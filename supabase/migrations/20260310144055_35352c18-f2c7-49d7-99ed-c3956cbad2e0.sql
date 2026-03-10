ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS api_first_key text DEFAULT NULL;
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS api_second_key text DEFAULT NULL;