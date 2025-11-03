-- ============================================================================
-- TODO #2: Set User Sebagai Super Admin
-- ============================================================================
-- Copy SQL di bawah dan paste di Supabase SQL Editor
-- ============================================================================

-- Update user role menjadi super_admin
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'fadlannafian@gmail.com'
);

-- Verify user role sudah berubah
SELECT 
  u.email,
  ur.role,
  p.full_name,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
JOIN public.profiles p ON u.id = p.user_id
WHERE u.email = 'fadlannafian@gmail.com';
