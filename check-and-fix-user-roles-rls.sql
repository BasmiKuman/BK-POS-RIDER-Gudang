-- ============================================================================
-- CHECK & FIX: User Roles RLS Policy
-- ============================================================================
-- Pastikan semua user bisa read user_roles mereka sendiri
-- ============================================================================

-- 1. Lihat existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles';

-- 2. Drop existing select policy jika ada
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow users to view own role" ON public.user_roles;

-- 3. Buat policy baru yang lebih permissive
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Pastikan RLS enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Verify - cek policy baru
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'user_roles';
