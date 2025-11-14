-- ============================================================================
-- CREATE FEEDS TABLE FOR RIDER ANNOUNCEMENTS
-- ============================================================================
-- Purpose: Allow admins to post announcements/feeds for riders
-- Features: Title, content, images, video links, social media links
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE FEEDS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS feeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  video_url TEXT, -- YouTube/Instagram/TikTok link
  link_url TEXT, -- Custom link (WhatsApp, website, etc)
  link_text TEXT DEFAULT 'Lihat Selengkapnya',
  social_links JSONB DEFAULT '{}', -- {instagram: "url", facebook: "url", whatsapp: "number"}
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feeds_status ON feeds(status);
CREATE INDEX IF NOT EXISTS idx_feeds_published_at ON feeds(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_feeds_created_by ON feeds(created_by);

-- Enable RLS
ALTER TABLE feeds ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: RLS POLICIES (Multi-Tenant Version)
-- ============================================================================

-- NOTE: This is placeholder - will be replaced by add-multitenant-to-merged-tables.sql
-- For now, allow authenticated users to interact with feeds
-- Execute add-multitenant-to-merged-tables.sql after this file for proper multi-tenant setup

-- Temporary: All authenticated users can view published feeds
CREATE POLICY "Users can view published feeds"
  ON feeds FOR SELECT
  TO authenticated
  USING (
    status = 'published' 
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  );

-- Temporary: Admins can view all feeds
CREATE POLICY "Admins can view all feeds temp"
  ON feeds FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Temporary: Admins can create feeds
CREATE POLICY "Admins can create feeds temp"
  ON feeds FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Temporary: Admins can update feeds
CREATE POLICY "Admins can update feeds temp"
  ON feeds FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Temporary: Admins can delete feeds
CREATE POLICY "Admins can delete feeds temp"
  ON feeds FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- STEP 3: UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_feeds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_feeds_updated_at
  BEFORE UPDATE ON feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_feeds_updated_at();

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Test 1: Check table exists
SELECT 
  'feeds table' as test_name,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'feeds';

-- Test 2: Check RLS policies
SELECT 
  'feeds policies' as test_name,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'feeds';

-- Test 3: List all policies
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'feeds'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================
-- Expected results:
-- - Table: feeds created
-- - Policies: 5 policies (view published, view all, insert, update, delete)
-- - Trigger: updated_at auto-update
--
-- Feeds system ready! ✅
-- ============================================================================
