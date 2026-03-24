
-- Add delivery_rider to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delivery_rider';

-- Add new permissions to employee_permission enum
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_delivery_assignments';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_delivery_assignments';
