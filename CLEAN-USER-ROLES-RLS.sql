-- ============================================================================
-- CLEAN & FIX: User Roles RLS Policies
-- ============================================================================
-- Hapus semua duplicate policies dan buat yang clean
-- ============================================================================

-- STEP 1: Drop SEMUA existing policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all profiles through user_roles if admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all user_roles if admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- STEP 2: Buat policies baru yang clean & simple

-- Policy 1: Semua authenticated user bisa view semua roles
-- (Diperlukan supaya admin/super_admin bisa manage users)
CREATE POLICY "Anyone can view all user roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Policy 2: Hanya admin & super_admin yang bisa insert/update/delete
CREATE POLICY "Admin and Super Admin can manage roles"
  ON public.user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- STEP 3: Pastikan RLS enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Verify policies baru
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  qual as using_condition
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY policyname;

-- STEP 5: Test query sebagai user
-- Pastikan query ini return role yang benar
SELECT 
  ur.user_id,
  ur.role,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE u.email = 'fadlannafian@gmail.com';
