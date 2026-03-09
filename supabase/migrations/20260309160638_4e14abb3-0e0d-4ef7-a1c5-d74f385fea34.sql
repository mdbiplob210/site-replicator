
-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 1;

-- Set sequence to current max order count
SELECT setval('public.order_number_seq', COALESCE((SELECT COUNT(*) FROM public.orders), 0) + 1, false);

-- Create function to generate next order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT CAST(nextval('public.order_number_seq') AS text)
$$;
