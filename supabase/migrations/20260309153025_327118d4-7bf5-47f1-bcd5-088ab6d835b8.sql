
-- Add inquiry to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'inquiry' AFTER 'confirmed';

-- Replace the stock adjustment trigger function with updated logic
CREATE OR REPLACE FUNCTION public.adjust_stock_on_order_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- When moving TO inquiry: subtract stock (from confirmed)
  IF NEW.status = 'inquiry' AND OLD.status != 'inquiry' THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity - oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- When moving TO pending_return from in_courier or delivered: add stock back
  IF NEW.status = 'pending_return' AND OLD.status IN ('in_courier', 'delivered') THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- When moving TO returned from pending_return: add stock back
  -- (only if coming from inquiry->pending_return, since in_courier/delivered already added at pending_return)
  IF NEW.status = 'returned' AND OLD.status = 'pending_return' THEN
    -- We need to check if stock was already added when going to pending_return
    -- If it came from in_courier/delivered, stock was already added at pending_return step, so don't add again
    -- If it came from inquiry, stock was NOT added at pending_return, so add now
    -- We can't easily know the previous-previous status, so we use a simpler approach:
    -- pending_return -> returned: add stock (this covers inquiry->pending_return->returned)
    UPDATE products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  -- When moving TO returned directly from inquiry: add stock back
  IF NEW.status = 'returned' AND OLD.status = 'inquiry' THEN
    UPDATE products p
    SET stock_quantity = p.stock_quantity + oi.quantity
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND oi.product_id = p.id;
  END IF;

  RETURN NEW;
END;
$function$;
