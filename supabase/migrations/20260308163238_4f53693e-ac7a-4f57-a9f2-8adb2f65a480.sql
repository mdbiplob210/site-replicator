
-- Enable leaked password protection via auth config
ALTER ROLE authenticator SET pgrst.db_leaked_password_protection = 'on';
