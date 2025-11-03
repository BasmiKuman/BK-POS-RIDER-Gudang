-- ============================================================================
-- FIX: Add unique constraint to user_roles.user_id
-- ============================================================================
-- Diperlukan untuk ON CONFLICT clause di signup_organization function
-- ============================================================================

-- 1. Check existing constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass;

-- 2. Drop any duplicate entries first (keep the latest)
DELETE FROM public.user_roles a
USING public.user_roles b
WHERE a.id < b.id 
  AND a.user_id = b.user_id;

-- 3. Add unique constraint on user_id
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_key UNIQUE (user_id);

-- 4. Recreate the signup_organization function with fixed ON CONFLICT
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

  -- 3. Set user role as admin (now with proper unique constraint)
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

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION public.signup_organization(
  TEXT, TEXT, JSONB, JSONB, JSONB, JSONB, JSONB, TEXT, TEXT, UUID
) TO authenticated;

-- 6. Verify constraint exists
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
  AND conname = 'user_roles_user_id_key';

-- 7. Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Unique constraint added to user_roles.user_id';
  RAISE NOTICE '✅ Function signup_organization updated successfully';
  RAISE NOTICE '✅ Signup should now work without ON CONFLICT error';
END $$;
