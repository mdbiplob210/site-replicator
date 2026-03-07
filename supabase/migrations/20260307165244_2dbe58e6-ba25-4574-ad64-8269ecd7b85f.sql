ALTER TABLE public.api_keys ADD COLUMN source_url text DEFAULT NULL;
ALTER TABLE public.api_keys ADD COLUMN last_synced_at timestamp with time zone DEFAULT NULL;