
-- Add new roles to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accounting';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'ad_analytics';
