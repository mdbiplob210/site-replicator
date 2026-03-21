
ALTER TABLE public.landing_page_events 
ADD COLUMN IF NOT EXISTS click_x numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS click_y numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS click_element text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS page_height integer DEFAULT NULL;
