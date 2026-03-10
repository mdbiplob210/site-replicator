
-- Reset the order number sequence to start from 1
-- First, drop and recreate the sequence starting at 1
ALTER SEQUENCE public.order_number_seq RESTART WITH 1;

-- Update existing orders to have sequential numbers starting from 1, ordered by created_at
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as new_num
  FROM public.orders
)
UPDATE public.orders o
SET order_number = CAST(n.new_num AS text)
FROM numbered n
WHERE o.id = n.id;

-- Now set the sequence to continue after the last order number
SELECT setval('public.order_number_seq', COALESCE((SELECT MAX(CAST(order_number AS bigint)) FROM public.orders), 0));
