-- Cek role user fadlannafian@gmail.com
SELECT 
  u.id,
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'fadlannafian@gmail.com';
