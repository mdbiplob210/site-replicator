
-- Create permission types enum
CREATE TYPE public.employee_permission AS ENUM (
  'view_orders',
  'edit_orders',
  'delete_orders',
  'change_order_status',
  'create_orders',
  'view_products',
  'edit_products',
  'view_finance',
  'edit_finance',
  'view_analytics',
  'view_reports',
  'manage_users',
  'manage_settings'
);

-- Employee permissions table
CREATE TABLE public.employee_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission employee_permission NOT NULL,
  granted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, permission)
);

ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage employee permissions"
  ON public.employee_permissions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own permissions"
  ON public.employee_permissions FOR SELECT
  USING (auth.uid() = user_id);

-- Order assignments table
CREATE TABLE public.order_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  UNIQUE(order_id, assigned_to)
);

ALTER TABLE public.order_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order assignments"
  ON public.order_assignments FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own assignments"
  ON public.order_assignments FOR SELECT
  USING (auth.uid() = assigned_to);

-- Employee panels table (tracks active panels for order distribution)
CREATE TABLE public.employee_panels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  panel_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_orders INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employee_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage panels"
  ON public.employee_panels FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own panel"
  ON public.employee_panels FOR SELECT
  USING (auth.uid() = user_id);

-- Function to check if a user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission employee_permission)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employee_permissions
    WHERE user_id = _user_id
      AND permission = _permission
  ) OR public.has_role(_user_id, 'admin')
$$;

-- Function to auto-distribute an order to active panels (round-robin)
CREATE OR REPLACE FUNCTION public.distribute_order_to_panels()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  panel_record RECORD;
BEGIN
  FOR panel_record IN 
    SELECT ep.user_id 
    FROM public.employee_panels ep
    WHERE ep.is_active = true
    ORDER BY (
      SELECT COUNT(*) FROM public.order_assignments oa 
      WHERE oa.assigned_to = ep.user_id AND oa.status = 'pending'
    ) ASC
  LOOP
    INSERT INTO public.order_assignments (order_id, assigned_to, status)
    VALUES (NEW.id, panel_record.user_id, 'pending')
    ON CONFLICT (order_id, assigned_to) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-distribute orders when created
CREATE TRIGGER distribute_new_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.distribute_order_to_panels();
