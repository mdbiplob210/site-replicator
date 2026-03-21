
-- Trigger: Assign order_number BEFORE insert (based on max existing + 1)
CREATE OR REPLACE FUNCTION public.assign_order_number_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  next_num int;
BEGIN
  SELECT COALESCE(MAX(order_number::int), 0) + 1 INTO next_num FROM orders;
  NEW.order_number := next_num::text;
  RETURN NEW;
END;
$$;

-- Trigger: Re-number all orders after delete
CREATE OR REPLACE FUNCTION public.reassign_order_numbers_on_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  WITH numbered AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
    FROM orders
  )
  UPDATE orders SET order_number = numbered.rn::text
  FROM numbered WHERE orders.id = numbered.id AND orders.order_number != numbered.rn::text;
  RETURN OLD;
END;
$$;

-- Create BEFORE INSERT trigger
DROP TRIGGER IF EXISTS trg_assign_order_number ON orders;
CREATE TRIGGER trg_assign_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION assign_order_number_on_insert();

-- Create AFTER DELETE trigger
DROP TRIGGER IF EXISTS trg_reassign_order_numbers ON orders;
CREATE TRIGGER trg_reassign_order_numbers
  AFTER DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION reassign_order_numbers_on_delete();

-- Re-number all existing orders from 1
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as rn
  FROM orders
)
UPDATE orders SET order_number = numbered.rn::text
FROM numbered WHERE orders.id = numbered.id;

-- Reset the sequence to match
SELECT setval('order_number_seq', (SELECT COALESCE(MAX(order_number::int), 0) FROM orders));
