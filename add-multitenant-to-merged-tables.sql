-- ============================================================================
-- MULTI-TENANT: Add organization_id to merged tables (feeds, role_change_logs)
-- ============================================================================
-- Execute AFTER running create-feeds-table.sql and add-role-change-audit-log.sql
-- ============================================================================

-- 1. Add organization_id to feeds table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'feeds' 
          AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.feeds 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added organization_id to feeds table';
    ELSE
        RAISE NOTICE 'ℹ️  organization_id already exists in feeds';
    END IF;
END $$;

-- 2. Add organization_id to role_change_logs table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
          AND table_name = 'role_change_logs' 
          AND column_name = 'organization_id'
    ) THEN
        ALTER TABLE public.role_change_logs 
        ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
        
        RAISE NOTICE '✅ Added organization_id to role_change_logs table';
    ELSE
        RAISE NOTICE 'ℹ️  organization_id already exists in role_change_logs';
    END IF;
END $$;

-- 3. Create RLS policies for feeds table
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their org feeds" ON public.feeds;
DROP POLICY IF EXISTS "Admins can manage their org feeds" ON public.feeds;
DROP POLICY IF EXISTS "Super admins can view all feeds" ON public.feeds;

-- Users can view feeds from their organization
CREATE POLICY "Users can view their org feeds"
  ON public.feeds
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  );

-- Admins can manage feeds in their organization
CREATE POLICY "Admins can manage their org feeds"
  ON public.feeds
  FOR ALL
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can view all feeds
CREATE POLICY "Super admins can view all feeds"
  ON public.feeds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
  );

-- 4. Create RLS policies for role_change_logs table
ALTER TABLE public.role_change_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admins can view their org role changes" ON public.role_change_logs;
DROP POLICY IF EXISTS "Admins can insert role changes" ON public.role_change_logs;
DROP POLICY IF EXISTS "Super admins can view all role changes" ON public.role_change_logs;

-- Admins can view role changes in their organization
CREATE POLICY "Admins can view their org role changes"
  ON public.role_change_logs
  FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admins can insert role changes in their organization
CREATE POLICY "Admins can insert role changes"
  ON public.role_change_logs
  FOR INSERT
  WITH CHECK (
    organization_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
  );

-- Super admins can view all role changes
CREATE POLICY "Super admins can view all role changes"
  ON public.role_change_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM public.user_roles 
      WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
  );

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feeds_organization_id 
ON public.feeds(organization_id);

CREATE INDEX IF NOT EXISTS idx_feeds_created_at 
ON public.feeds(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_change_logs_organization_id 
ON public.role_change_logs(organization_id);

CREATE INDEX IF NOT EXISTS idx_role_change_logs_user_id 
ON public.role_change_logs(user_id);

-- 6. Verify tables and policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename IN ('feeds', 'role_change_logs')
ORDER BY tablename, policyname;

-- 7. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenant setup complete for feeds and role_change_logs';
  RAISE NOTICE '✅ RLS policies created and enabled';
  RAISE NOTICE '✅ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test feed creation from admin account';
  RAISE NOTICE '2. Test role changes are logged properly';
  RAISE NOTICE '3. Verify users can only see their org data';
END $$;
