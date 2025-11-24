-- ============================================================================
-- FIX: Assign Organization to Super Admin (fadlannafian@gmail.com)
-- ============================================================================
-- Purpose: Super admin should have an organization to test admin features
-- ============================================================================

-- 1. Check current super admin profile
SELECT 
  p.user_id,
  p.full_name,
  p.organization_id,
  ur.role,
  u.email
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
JOIN auth.users u ON p.user_id = u.id
WHERE ur.role = 'super_admin';

-- 2. Create or get "Super Admin Test Org" organization
DO $$
DECLARE
  v_org_id UUID;
  v_user_id UUID;
  v_plan_id UUID;
BEGIN
  -- Get super admin user_id
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'fadlannafian@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Super admin user not found (fadlannafian@gmail.com)';
  END IF;

  -- Check if organization already exists
  SELECT id INTO v_org_id
  FROM organizations
  WHERE slug = 'super-admin-test-org';

  -- Create organization if doesn't exist
  IF v_org_id IS NULL THEN
    -- Get Enterprise plan ID
    SELECT id INTO v_plan_id
    FROM subscription_plans
    WHERE name = 'enterprise'
    LIMIT 1;

    -- Create organization
    INSERT INTO organizations (
      name,
      slug,
      subscription_plan,
      branding,
      terminology,
      features,
      dashboard_layout,
      report_templates,
      created_at
    ) VALUES (
      'Super Admin Test Organization',
      'super-admin-test-org',
      'enterprise',
      '{"app_name": "BK POS Super Admin", "primary_color": "#3b82f6", "secondary_color": "#8b5cf6", "logo_url": "", "favicon_url": ""}'::jsonb,
      '{"rider": "Rider", "warehouse": "Gudang", "pos": "POS", "product": "Produk", "category": "Kategori", "transaction": "Transaksi", "distribution": "Distribusi", "return": "Return", "report": "Laporan", "dashboard": "Dashboard", "settings": "Pengaturan", "production": "Produksi", "rider_plural": "Riders", "product_plural": "Produk", "category_plural": "Kategori", "transaction_plural": "Transaksi"}'::jsonb,
      '{"pos": true, "warehouse": true, "gps_tracking": true, "production_tracking": true, "reports": true, "rider_management": true, "bulk_actions": true, "advanced_reports": true, "white_label": true, "api_access": true, "custom_integrations": true, "priority_support": true, "multi_location": true, "advanced_analytics": true}'::jsonb,
      '{"widgets": [], "charts": [], "show_weather": true, "show_gps_map": true, "default_view": "grid", "refresh_interval": 30}'::jsonb,
      '{}'::jsonb,
      NOW()
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE '✅ Created organization: Super Admin Test Organization (ID: %)', v_org_id;

    -- Create subscription history
    INSERT INTO subscription_history (
      organization_id,
      plan_id,
      amount,
      payment_status,
      payment_date,
      start_date,
      end_date
    ) VALUES (
      v_org_id,
      v_plan_id,
      0, -- Free for super admin
      'paid',
      NOW(),
      NOW(),
      NOW() + INTERVAL '365 days' -- 1 year
    );

    RAISE NOTICE '✅ Created subscription (Enterprise, 1 year)';
  ELSE
    RAISE NOTICE 'ℹ️  Organization already exists (ID: %)', v_org_id;
  END IF;

  -- Update super admin profile with organization_id
  UPDATE profiles
  SET organization_id = v_org_id
  WHERE user_id = v_user_id;

  RAISE NOTICE '✅ Assigned organization to super admin profile';

END $$;

-- 3. Verify setup
SELECT 
  p.user_id,
  p.full_name,
  p.organization_id,
  o.name as organization_name,
  o.slug,
  o.subscription_plan,
  ur.role,
  u.email
FROM profiles p
JOIN user_roles ur ON p.user_id = ur.user_id
JOIN auth.users u ON p.user_id = u.id
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE ur.role = 'super_admin';

-- 4. Create test rider for super admin org (optional)
DO $$
DECLARE
  v_org_id UUID;
  v_test_user_id UUID;
BEGIN
  -- Get organization ID
  SELECT id INTO v_org_id
  FROM organizations
  WHERE slug = 'super-admin-test-org';

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Super admin organization not found';
  END IF;

  -- Check if test rider already exists
  SELECT id INTO v_test_user_id
  FROM auth.users
  WHERE email = 'rider-test@bkpos.com';

  IF v_test_user_id IS NOT NULL THEN
    -- Update existing test rider's organization
    UPDATE profiles
    SET organization_id = v_org_id
    WHERE user_id = v_test_user_id;

    RAISE NOTICE '✅ Updated test rider organization';
  ELSE
    RAISE NOTICE 'ℹ️  Test rider not found (create via signup or super admin)';
  END IF;
END $$;

-- 5. Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Super Admin Organization Setup Complete!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Super Admin: fadlannafian@gmail.com';
  RAISE NOTICE 'Organization: Super Admin Test Organization';
  RAISE NOTICE 'Plan: Enterprise (1 year)';
  RAISE NOTICE 'Slug: super-admin-test-org';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Login as fadlannafian@gmail.com';
  RAISE NOTICE '2. You now have admin access + super admin access';
  RAISE NOTICE '3. Can see subscription badge in dashboard';
  RAISE NOTICE '4. Can test all admin features';
  RAISE NOTICE '5. Can still access /super-admin for super admin features';
  RAISE NOTICE '';
  RAISE NOTICE 'To create test accounts:';
  RAISE NOTICE '- Go to /signup to create new organization (test admin)';
  RAISE NOTICE '- Or use Settings → Add User (test rider)';
  RAISE NOTICE '';
END $$;
