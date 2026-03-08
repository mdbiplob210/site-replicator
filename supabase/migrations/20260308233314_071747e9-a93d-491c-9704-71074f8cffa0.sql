ALTER TABLE public.landing_pages 
  ADD COLUMN exit_popup_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN exit_popup_discount numeric NOT NULL DEFAULT 50,
  ADD COLUMN exit_popup_timer integer NOT NULL DEFAULT 300,
  ADD COLUMN exit_popup_message text NOT NULL DEFAULT 'এই ছাড়টি শুধু আপনার জন্য!';