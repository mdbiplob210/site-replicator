
-- Add new granular permissions to employee_permission enum
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'create_products';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'delete_products';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_website';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_landing_pages';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_courier';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_meta_ads';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_banners';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_backup';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_automation';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'view_dashboard';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'manage_categories';
