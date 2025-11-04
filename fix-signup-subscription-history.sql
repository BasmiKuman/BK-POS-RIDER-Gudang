-- ============================================================================
-- FIX: Signup Organization Function - Correct subscription_history columns
-- ============================================================================
-- Fix kolom plan → plan_id dan tambah start_date, end_date
-- ============================================================================

-- Recreate signup_organization function dengan kolom yang benar
CREATE OR REPLACE FUNCTION public.signup_organization(
  p_organization_name TEXT,
  p_subscription_plan TEXT,
  p_branding JSONB,
  p_terminology JSONB,
  p_features JSONB,
  p_dashboard_layout JSONB,
  p_report_templates JSONB,
  p_full_name TEXT,
  p_phone TEXT,
  p_user_id UUID
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_organization_id UUID;
  v_slug TEXT;
  v_plan_id UUID;
  v_amount DECIMAL(10,2);
  v_payment_status TEXT;
BEGIN
  -- Generate slug from organization name
  v_slug := lower(regexp_replace(p_organization_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing dashes
  
  -- Add random suffix to ensure uniqueness
  v_slug := v_slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
  
  -- Get plan_id and amount from subscription_plans table
  SELECT id, price_monthly INTO v_plan_id, v_amount
  FROM public.subscription_plans
  WHERE name = p_subscription_plan
  LIMIT 1;
  
  -- If plan not found, use free plan as default
  IF v_plan_id IS NULL THEN
    SELECT id, price_monthly INTO v_plan_id, v_amount
    FROM public.subscription_plans
    WHERE name = 'free'
    LIMIT 1;
  END IF;
  
  -- Set payment status based on plan
  v_payment_status := CASE 
    WHEN p_subscription_plan = 'free' THEN 'paid'
    ELSE 'pending'
  END;
  
  -- 1. Create organization
  INSERT INTO public.organizations (
    name,
    slug,
    subscription_plan,
    branding,
    terminology,
    features,
    dashboard_layout,
    report_templates
  ) VALUES (
    p_organization_name,
    v_slug,
    p_subscription_plan,
    p_branding,
    p_terminology,
    p_features,
    p_dashboard_layout,
    p_report_templates
  )
  RETURNING id INTO v_organization_id;

  -- 2. Update user profile with organization_id
  UPDATE public.profiles
  SET 
    organization_id = v_organization_id,
    full_name = p_full_name,
    phone = p_phone
  WHERE user_id = p_user_id;

  -- 3. Set user role as admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (p_user_id, 'admin')
  ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

  -- 4. Create subscription history with correct columns
  INSERT INTO public.subscription_history (
    organization_id,
    plan_id,
    amount,
    payment_status,
    payment_date,
    start_date,
    end_date
  ) VALUES (
    v_organization_id,
    v_plan_id,
    v_amount,
    v_payment_status,
    CASE WHEN v_payment_status = 'paid' THEN NOW() ELSE NULL END,
    NOW(), -- Start immediately
    NOW() + INTERVAL '30 days' -- 30 days subscription
  );

  RETURN v_organization_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.signup_organization(
  TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT, TEXT, UUID
) TO authenticated;

-- Verify function
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'signup_organization';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function signup_organization updated with correct subscription_history columns';
  RAISE NOTICE '✅ Now uses plan_id (UUID) instead of plan (TEXT)';
  RAISE NOTICE '✅ Added start_date and end_date (30 days subscription)';
  RAISE NOTICE '✅ Signup should now work correctly';
END $$;
