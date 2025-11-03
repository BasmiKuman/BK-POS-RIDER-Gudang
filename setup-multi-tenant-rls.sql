-- ============================================================================
-- RLS POLICIES: Organizations & Subscription Tables
-- ============================================================================
-- Execute BEFORE generating dummy data
-- ============================================================================

-- ORGANIZATIONS TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Super admin can view all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Super admin can manage organizations" ON public.organizations;

-- Policy 1: SELECT - Super admin & users in org can view
CREATE POLICY "Enable read access for organizations"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Users can see their own org
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND organization_id = organizations.id
    )
  );

-- Policy 2: INSERT - Only super admin
CREATE POLICY "Super admin can insert organizations"
  ON public.organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 3: UPDATE - Super admin & org admin
CREATE POLICY "Super admin can update organizations"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 4: DELETE - Only super admin
CREATE POLICY "Super admin can delete organizations"
  ON public.organizations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUBSCRIPTION PLANS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
DROP POLICY IF EXISTS "Super admin can manage plans" ON public.subscription_plans;

-- Policy 1: SELECT - Everyone can view (untuk pilih plan)
CREATE POLICY "Enable read access for subscription plans"
  ON public.subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy 2: INSERT - Only super admin
CREATE POLICY "Super admin can insert plans"
  ON public.subscription_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 3: UPDATE - Only super admin
CREATE POLICY "Super admin can update plans"
  ON public.subscription_plans
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 4: DELETE - Only super admin
CREATE POLICY "Super admin can delete plans"
  ON public.subscription_plans
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SUBSCRIPTION HISTORY TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view subscription history" ON public.subscription_history;
DROP POLICY IF EXISTS "Super admin can manage history" ON public.subscription_history;

-- Policy 1: SELECT - Super admin & users in org
CREATE POLICY "Enable read access for subscription history"
  ON public.subscription_history
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Users can see their org's history
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() 
      AND p.organization_id = subscription_history.organization_id
    )
  );

-- Policy 2: INSERT - Super admin only
CREATE POLICY "Super admin can insert subscription history"
  ON public.subscription_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy 3: UPDATE - Super admin only
CREATE POLICY "Super admin can update subscription history"
  ON public.subscription_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ORGANIZATION INVITATIONS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view invitations" ON public.organization_invitations;
DROP POLICY IF EXISTS "Super admin can manage invitations" ON public.organization_invitations;

-- Policy 1: SELECT - Super admin & invited user
CREATE POLICY "Enable read access for invitations"
  ON public.organization_invitations
  FOR SELECT
  TO authenticated
  USING (
    -- Super admin can see all
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    OR
    -- Invited user can see their invitation
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Policy 2: INSERT - Super admin & org admin
CREATE POLICY "Super admin can insert invitations"
  ON public.organization_invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );

-- Policy 3: UPDATE - Super admin & invited user (untuk accept/reject)
CREATE POLICY "Users can update their invitations"
  ON public.organization_invitations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'super_admin'
    )
    OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd as command
FROM pg_policies 
WHERE tablename IN ('organizations', 'subscription_plans', 'subscription_history', 'organization_invitations')
ORDER BY tablename, cmd, policyname;
