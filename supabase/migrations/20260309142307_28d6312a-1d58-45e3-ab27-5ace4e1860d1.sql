
-- Create trigger to auto-distribute new orders to active panels
CREATE OR REPLACE TRIGGER distribute_order_trigger
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_order_to_panels();

-- Add unique constraint to prevent duplicate assignments
ALTER TABLE public.order_assignments 
  ADD CONSTRAINT order_assignments_order_user_unique 
  UNIQUE (order_id, assigned_to);
