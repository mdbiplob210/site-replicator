CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE sql
 VOLATILE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CAST(nextval('public.order_number_seq') AS text)
$function$;