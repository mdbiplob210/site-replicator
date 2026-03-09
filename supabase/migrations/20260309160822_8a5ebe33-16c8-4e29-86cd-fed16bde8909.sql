
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS memo_printed boolean NOT NULL DEFAULT false;
