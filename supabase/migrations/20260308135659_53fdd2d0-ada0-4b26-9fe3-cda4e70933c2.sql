
-- Add new values to order_status enum
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'pending_return';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'hand_delivery';

-- Add cancel_reason and hold_until columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS hold_until timestamp with time zone DEFAULT NULL;
