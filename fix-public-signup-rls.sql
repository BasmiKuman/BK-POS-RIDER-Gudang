-- ============================================================================
-- FIX: Public Signup - Create Organization RPC Function
-- ============================================================================
-- Function untuk handle signup organization baru dengan proper permissions
-- ============================================================================

-- 1. Create function untuk signup organization baru
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
BEGIN
  -- Generate slug from organization name
  v_slug := lower(regexp_replace(p_organization_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing dashes
  
  -- Add random suffix to ensure uniqueness
  v_slug := v_slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
  
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

  -- 4. Create subscription history
  INSERT INTO public.subscription_history (
    organization_id,
    plan,
    amount,
    status
  ) VALUES (
    v_organization_id,
    p_subscription_plan,
    CASE 
      WHEN p_subscription_plan = 'free' THEN 0
      WHEN p_subscription_plan = 'basic' THEN 99000
      WHEN p_subscription_plan = 'pro' THEN 299000
      WHEN p_subscription_plan = 'enterprise' THEN 999000
      ELSE 0
    END,
    CASE 
      WHEN p_subscription_plan = 'free' THEN 'active'
      ELSE 'pending'
    END
  );

  RETURN v_organization_id;
END;
$$;

-- 2. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.signup_organization(
  TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT, TEXT, UUID
) TO authenticated;

-- 3. Verify function exists
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'signup_organization';

-- 4. Test query (replace with actual values)
-- SELECT public.signup_organization(
--   'Test Organization',
--   'free',
--   '{"app_name": "BK POS", "primary_color": "#3b82f6", "secondary_color": "#8b5cf6"}'::jsonb,
--   '{"rider": "Rider", "warehouse": "Gudang"}'::jsonb,
--   '{"pos": true, "warehouse": true}'::jsonb,
--   '{}'::jsonb,
--   '{}'::jsonb,
--   'Admin Name',
--   '08123456789',
--   'user-uuid-here'
-- );

-- 5. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function signup_organization created successfully';
  RAISE NOTICE '✅ Now you can signup new organizations from PublicSignup page';
END $$;
