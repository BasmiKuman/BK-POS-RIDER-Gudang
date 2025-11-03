-- Cek function has_role
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'has_role';
