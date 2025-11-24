-- ============================================================================
-- Check Existing Multi-Tenant Setup
-- ============================================================================
-- Run this to see what's already in your database

-- 1. Check which tables exist
SELECT 
  'organizations' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') AS exists
UNION ALL
SELECT 'subscription_plans', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_plans')
UNION ALL
SELECT 'subscription_history', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_history')
UNION ALL
SELECT 'organization_invitations', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organization_invitations')
UNION ALL
SELECT 'feeds', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feeds')
UNION ALL
SELECT 'role_change_logs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'role_change_logs');

-- 2. Check if organization_id column exists in key tables
SELECT 
  'profiles' AS table_name,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'organization_id') AS has_organization_id
UNION ALL
SELECT 'products', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'organization_id')
UNION ALL
SELECT 'categories', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'organization_id')
UNION ALL
SELECT 'user_roles', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_roles' AND column_name = 'organization_id')
UNION ALL
SELECT 'rider_stock', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'rider_stock' AND column_name = 'organization_id')
UNION ALL
SELECT 'distributions', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'distributions' AND column_name = 'organization_id')
UNION ALL
SELECT 'returns', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'returns' AND column_name = 'organization_id')
UNION ALL
SELECT 'transactions', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'organization_id')
UNION ALL
SELECT 'production_history', EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'production_history' AND column_name = 'organization_id');

-- 3. Check if super_admin role exists
SELECT 
  enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')
ORDER BY enumsortorder;

-- 4. Check organization structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'organizations'
ORDER BY ordinal_position;

-- 5. Check subscription_plans data
SELECT name, display_name, price_monthly, max_users, max_products, max_riders
FROM subscription_plans
WHERE is_active = true
ORDER BY price_monthly;

-- 6. Check if subscription_history has is_active column
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'subscription_history'
  AND column_name = 'is_active';
