
CREATE TABLE public.finance_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'income',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage finance_sources"
  ON public.finance_sources
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default sources
INSERT INTO public.finance_sources (name, type) VALUES
  ('Sales', 'income'),
  ('Refund', 'income'),
  ('Investment', 'income'),
  ('Loan', 'income'),
  ('Other', 'income'),
  ('Ads', 'expense'),
  ('Courier', 'expense'),
  ('Product Cost', 'expense'),
  ('Salary', 'expense'),
  ('Rent', 'expense'),
  ('Other', 'expense');
