ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'create_users';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'create_admin_users';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'create_moderator_users';
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'create_basic_users';