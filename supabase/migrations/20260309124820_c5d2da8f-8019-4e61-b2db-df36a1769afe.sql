INSERT INTO public.site_settings (key, value, is_public) VALUES 
  ('whatsapp_number', '', true),
  ('phone_number_2', '', true),
  ('messenger_link', '', true),
  ('payment_number', '', true)
ON CONFLICT (key) DO NOTHING;