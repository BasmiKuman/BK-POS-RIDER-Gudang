-- ============================================================================
-- GENERATE DUMMY DATA: Organizations & Subscriptions
-- ============================================================================
-- Execute di Supabase SQL Editor untuk populate dummy data
-- ============================================================================

-- STEP 1: Check existing subscription plans
SELECT id, name, display_name, price_monthly, max_users, max_products, max_riders
FROM public.subscription_plans
ORDER BY price_monthly;

-- STEP 2: Insert dummy organizations
DO $$
BEGIN

  -- Insert dummy organizations
  -- Organization 1: Trial Free Plan
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Toko Kelontong Jaya',
    'toko-kelontong-jaya',
    'free',
    'trial',
    NOW(),
    NOW() + INTERVAL '14 days',
    3, 20, 2,
    true
  );

  -- Organization 2: Active Basic Plan
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Warung Mbok Sri',
    'warung-mbok-sri',
    'basic',
    'active',
    NOW() - INTERVAL '15 days',
    NOW() + INTERVAL '15 days',
    10, 100, 5,
    true
  );

  -- Organization 3: Active Pro Plan
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Minimarket Sumber Rezeki',
    'minimarket-sumber-rezeki',
    'pro',
    'active',
    NOW() - INTERVAL '45 days',
    NOW() + INTERVAL '45 days',
    50, 500, 20,
    true
  );

  -- Organization 4: Enterprise Plan
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Supermarket Keluarga Sejahtera',
    'supermarket-keluarga-sejahtera',
    'enterprise',
    'active',
    NOW() - INTERVAL '60 days',
    NOW() + INTERVAL '335 days',
    999, 9999, 100,
    true
  );

  -- Organization 5: Expired Trial
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Toko Bangunan Maju',
    'toko-bangunan-maju',
    'free',
    'expired',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '6 days',
    3, 20, 2,
    false
  );

  -- Organization 6: Cancelled Subscription
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Warung Pak Budi',
    'warung-pak-budi',
    'basic',
    'cancelled',
    NOW() - INTERVAL '90 days',
    NOW() - INTERVAL '30 days',
    10, 100, 5,
    false
  );

  -- Organization 7: Basic Plan - Almost Expired
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Toko Elektronik Digital',
    'toko-elektronik-digital',
    'basic',
    'active',
    NOW() - INTERVAL '28 days',
    NOW() + INTERVAL '2 days',
    10, 100, 5,
    true
  );

  -- Organization 8: Pro Plan - Baru Join
  INSERT INTO public.organizations (
    name, slug,
    subscription_plan,
    subscription_status,
    subscription_start_date,
    subscription_end_date,
    max_users, max_products, max_riders,
    is_active
  ) VALUES (
    'Apotek Sehat Sentosa',
    'apotek-sehat-sentosa',
    'pro',
    'active',
    NOW() - INTERVAL '3 days',
    NOW() + INTERVAL '27 days',
    50, 500, 20,
    true
  );

  RAISE NOTICE 'SUCCESS! Created 8 dummy organizations';
END $$;

-- STEP 3: Generate subscription history for each organization
DO $$
DECLARE
  v_org RECORD;
  v_plan RECORD;
BEGIN
  FOR v_org IN 
    SELECT o.id, o.subscription_plan, o.subscription_status, o.subscription_start_date, o.subscription_end_date
    FROM public.organizations o
  LOOP
    -- Get plan details by name
    SELECT * INTO v_plan FROM public.subscription_plans WHERE name = v_org.subscription_plan;
    
    -- Insert subscription history
    INSERT INTO public.subscription_history (
      organization_id,
      plan_id,
      amount,
      start_date,
      end_date,
      payment_status,
      payment_date
    ) VALUES (
      v_org.id,
      v_plan.id,
      v_plan.price_monthly,
      v_org.subscription_start_date,
      v_org.subscription_end_date,
      CASE 
        WHEN v_plan.name = 'free' THEN 'paid'
        WHEN v_org.subscription_status = 'active' THEN 'paid'
        WHEN v_org.subscription_status = 'trial' THEN 'pending'
        ELSE 'failed'
      END,
      CASE 
        WHEN v_org.subscription_status IN ('active', 'cancelled', 'expired') THEN v_org.subscription_start_date
        ELSE NULL
      END
    );
  END LOOP;

  RAISE NOTICE 'SUCCESS! Created subscription history records';
END $$;

-- STEP 4: Verify created data
SELECT 
  o.name,
  o.slug,
  o.subscription_plan as plan,
  o.subscription_status,
  o.is_active,
  DATE(o.subscription_end_date) as expires,
  CASE 
    WHEN o.subscription_end_date < NOW() THEN '⚠️ EXPIRED'
    WHEN o.subscription_end_date < NOW() + INTERVAL '7 days' THEN '⚠️ EXPIRING SOON'
    ELSE '✅ ACTIVE'
  END as status_indicator
FROM public.organizations o
ORDER BY o.created_at DESC;

-- STEP 5: Summary statistics
SELECT 
  '📊 SUMMARY' as info,
  COUNT(*) as total_organizations,
  COUNT(*) FILTER (WHERE is_active = true) as active_orgs,
  COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_orgs,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as paid_orgs,
  COUNT(*) FILTER (WHERE subscription_status = 'expired') as expired_orgs,
  COUNT(*) FILTER (WHERE subscription_status = 'cancelled') as cancelled_orgs
FROM public.organizations;

-- STEP 6: Revenue summary
SELECT 
  '💰 REVENUE' as info,
  COUNT(*) as total_payments,
  COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_count,
  SUM(amount) FILTER (WHERE payment_status = 'paid') as total_revenue,
  SUM(amount) FILTER (WHERE payment_status = 'pending') as pending_revenue
FROM public.subscription_history;
