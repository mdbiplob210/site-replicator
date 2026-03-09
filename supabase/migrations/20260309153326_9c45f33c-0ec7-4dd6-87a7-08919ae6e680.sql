
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
