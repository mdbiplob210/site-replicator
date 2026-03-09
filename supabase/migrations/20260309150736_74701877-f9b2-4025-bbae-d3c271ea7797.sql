
CREATE OR REPLACE FUNCTION public.adjust_stock_on_order_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only act when status actually changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- When moving TO in_courier: subtract stock
  IF NEW.status = 'in_courier' AND OLD.status != 'in_courier' THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- When moving TO pending_return or returned: add stock back
  -- (only if coming from in_courier or delivered, to avoid double-adding)
  IF NEW.status IN ('pending_return', 'returned') 
     AND OLD.status IN ('in_courier', 'delivered') THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- When moving from returned back (edge case, e.g. mistake correction)
  -- If status was pending_return and now becomes returned, don't double-add
  -- pending_return -> returned should NOT add again (already added at pending_return)
  IF NEW.status = 'returned' AND OLD.status = 'pending_return' THEN
    -- Stock was already added when it went to pending_return, so no action needed
    -- We need to undo the above block's action for this specific case
    UPDATE products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_adjust_stock_on_order_status
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.adjust_stock_on_order_status();
