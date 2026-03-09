
-- Create tasks table
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'Medium',
  task_type text NOT NULL DEFAULT 'personal',
  frequency text NOT NULL DEFAULT 'date_specific',
  task_date date DEFAULT CURRENT_DATE,
  deadline date,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid NOT NULL,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  completed_at timestamp with time zone,
  deleted_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage all tasks"
ON public.tasks FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view tasks they created
CREATE POLICY "Users can view own tasks"
ON public.tasks FOR SELECT TO authenticated
USING (auth.uid() = created_by);

-- Users can view tasks assigned to them
CREATE POLICY "Users can view assigned tasks"
ON public.tasks FOR SELECT TO authenticated
USING (auth.uid() = assigned_to);

-- Users can view common tasks
CREATE POLICY "Users can view common tasks"
ON public.tasks FOR SELECT TO authenticated
USING (task_type = 'common');

-- Users can create tasks
CREATE POLICY "Users can create tasks"
ON public.tasks FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
ON public.tasks FOR UPDATE TO authenticated
USING (auth.uid() = created_by OR auth.uid() = assigned_to);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
ON public.tasks FOR DELETE TO authenticated
USING (auth.uid() = created_by);
