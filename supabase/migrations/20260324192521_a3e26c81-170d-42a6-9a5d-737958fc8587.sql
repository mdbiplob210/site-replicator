UPDATE orders 
SET status = 'confirmed', updated_at = now()
WHERE status = 'in_courier' 
  AND deleted_at IS NULL
  AND id NOT IN (
    SELECT order_id FROM courier_orders WHERE consignment_id IS NOT NULL
  );