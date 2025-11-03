-- ============================================================================
-- FINAL FIX: User Roles RLS - Mengatasi Error 500
-- ============================================================================
-- Problem: Policy yang recursive menyebabkan infinite loop (500 error)
-- Solution: Gunakan simple policy tanpa nested queries
-- ============================================================================

-- STEP 1: Drop SEMUA existing policies
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all profiles through user_roles if admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view all user_roles if admin" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone can view all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin and Super Admin can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- STEP 2: Buat policy SIMPLE tanpa recursive query

-- Policy 1: SELECT - Semua authenticated user bisa view semua roles
-- PENTING: TIDAK ada nested query ke user_roles (avoid infinite loop!)
CREATE POLICY "Enable read access for authenticated users"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: INSERT - Block dari client, hanya via service_role/function
CREATE POLICY "Enable insert for service role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

-- Policy 3: UPDATE - Block dari client
CREATE POLICY "Enable update for service role"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- Policy 4: DELETE - Block dari client
CREATE POLICY "Enable delete for service role"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (false);

-- STEP 3: Pastikan RLS enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- STEP 4: Set user sebagai super_admin
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'fadlannafian@gmail.com'
);

-- STEP 5: Verify role user sudah benar
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

-- STEP 6: Verify policies (should be 4 simple policies)
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command,
  roles
FROM pg_policies 
WHERE tablename = 'user_roles'
ORDER BY cmd, policyname;
