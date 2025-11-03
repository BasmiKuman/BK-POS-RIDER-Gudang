-- ============================================================================
-- FIX: Super Admin Access Issue
-- ============================================================================
-- Execute di Supabase SQL Editor untuk fix akses super admin
-- ============================================================================

-- STEP 1: Verify user role saat ini
SELECT 
  u.id,
  u.email,
  ur.role,
  p.full_name
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'fadlannafian@gmail.com';

-- STEP 2: Update role ke super_admin jika belum
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'fadlannafian@gmail.com'
);

-- STEP 3: Fix RLS policies untuk user_roles table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to view own role" ON public.user_roles;

-- Create new permissive policy
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Verify role sudah ter-update
SELECT 
  u.id,
  u.email,
  ur.role,
  CASE 
    WHEN ur.role = 'super_admin' THEN '✅ Super Admin'
    WHEN ur.role = 'admin' THEN '👤 Admin'
    WHEN ur.role = 'rider' THEN '🏍️ Rider'
    ELSE '❌ No Role'
  END as status
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE u.email = 'fadlannafian@gmail.com';

-- STEP 5: Verify RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  qual as condition
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;
