-- Add print_memo permission to employee_permission enum
ALTER TYPE public.employee_permission ADD VALUE IF NOT EXISTS 'print_memo';
