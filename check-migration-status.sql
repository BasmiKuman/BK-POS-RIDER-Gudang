-- ============================================================================
-- CHECK MIGRATION STATUS
-- ============================================================================
-- Run this to verify which migrations have been executed
-- ============================================================================

-- 1. Check if customization columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizations'
  AND column_name IN ('branding', 'terminology', 'features', 'dashboard_layout', 'report_templates')
ORDER BY column_name;

-- Expected: 5 rows with JSONB type
-- If 0 rows: Execute add-organization-customization.sql

-- 2. Check if get_organization_users function exists
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_organization_users';

-- Expected: 1 row
-- If 0 rows: Execute add-get-org-users-function.sql

-- 3. Check sample organization data
SELECT 
  id,
  name,
  CASE 
    WHEN branding IS NOT NULL THEN '✅ Has branding'
    ELSE '❌ No branding column'
  END as branding_status,
  CASE 
    WHEN terminology IS NOT NULL THEN '✅ Has terminology'
    ELSE '❌ No terminology column'
  END as terminology_status
FROM public.organizations
LIMIT 3;

-- 4. Summary
DO $$
DECLARE
  customization_cols INTEGER;
  function_exists INTEGER;
BEGIN
  -- Count customization columns
  SELECT COUNT(*) INTO customization_cols
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'organizations'
    AND column_name IN ('branding', 'terminology', 'features', 'dashboard_layout', 'report_templates');
  
  -- Check function
  SELECT COUNT(*) INTO function_exists
  FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'get_organization_users';
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MIGRATION STATUS REPORT';
  RAISE NOTICE '==============================================';
  
  IF customization_cols = 5 THEN
    RAISE NOTICE '✅ Customization columns: OK (5/5)';
  ELSE
    RAISE NOTICE '❌ Customization columns: MISSING (%/5)', customization_cols;
    RAISE NOTICE '   → Execute: add-organization-customization.sql';
  END IF;
  
  IF function_exists = 1 THEN
    RAISE NOTICE '✅ RPC function get_organization_users: OK';
  ELSE
    RAISE NOTICE '❌ RPC function get_organization_users: MISSING';
    RAISE NOTICE '   → Execute: add-get-org-users-function.sql';
  END IF;
  
  RAISE NOTICE '==============================================';
  
  IF customization_cols = 5 AND function_exists = 1 THEN
    RAISE NOTICE '🎉 ALL MIGRATIONS COMPLETE!';
  ELSE
    RAISE NOTICE '⚠️  INCOMPLETE - Please run missing migrations';
  END IF;
  
  RAISE NOTICE '==============================================';
END $$;
