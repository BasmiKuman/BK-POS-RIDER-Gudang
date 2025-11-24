-- ============================================================================
-- Incremental Multi-Tenant Setup (Safe for existing database)
-- Run this if organizations table already exists
-- ============================================================================

-- 1. Add missing columns to organizations if needed
DO $$ 
BEGIN
  -- Check and add columns one by one
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'subscription_status') THEN
    ALTER TABLE public.organizations ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'trial' 
      CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'subscription_plan') THEN
    ALTER TABLE public.organizations ADD COLUMN subscription_plan TEXT NOT NULL DEFAULT 'free' 
      CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'subscription_start_date') THEN
    ALTER TABLE public.organizations ADD COLUMN subscription_start_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE public.organizations ADD COLUMN subscription_end_date TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'max_users') THEN
    ALTER TABLE public.organizations ADD COLUMN max_users INTEGER DEFAULT 5;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'max_products') THEN
    ALTER TABLE public.organizations ADD COLUMN max_products INTEGER DEFAULT 50;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'organizations' AND column_name = 'max_riders') THEN
    ALTER TABLE public.organizations ADD COLUMN max_riders INTEGER DEFAULT 3;
  END IF;
END $$;

-- 2. Add organization_id to existing tables (IF NOT EXISTS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.rider_stock ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.distributions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.production_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. Add super_admin role if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin' 
                 AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'super_admin';
  END IF;
END $$;

-- 4. Create subscription_plans table if not exists
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_products INTEGER NOT NULL DEFAULT 50,
  max_riders INTEGER NOT NULL DEFAULT 3,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans if table is empty
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_products, max_riders, features)
SELECT * FROM (VALUES
  ('free', 'Free Trial', '30 days free trial', 0, 0, 5, 50, 3, '["Basic POS", "Product Management", "Up to 3 Riders", "Basic Reports", "Email Support"]'::jsonb),
  ('basic', 'Basic Plan', 'For small business', 99000, 990000, 20, 200, 10, '["Full POS Features", "Product Management", "Up to 10 Riders", "Standard Reports", "Email Support"]'::jsonb),
  ('pro', 'Pro Plan', 'For growing business', 299000, 2990000, 100, 1000, 50, '["All Basic Features", "Up to 50 Riders", "Advanced Reports", "Advanced Analytics", "Priority Support", "API Access"]'::jsonb),
  ('enterprise', 'Enterprise', 'For large business', 999000, 9990000, 999999, 999999, 999999, '["All Pro Features", "Unlimited Users", "Unlimited Products", "Unlimited Riders", "Advanced Analytics", "Priority Support", "Custom Branding", "API Access"]'::jsonb)
) AS new_plans
WHERE NOT EXISTS (SELECT 1 FROM public.subscription_plans);

-- 5. Create subscription_history table if not exists
CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'free')),
  payment_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  invoice_url TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add is_active column if subscription_history exists but doesn't have it
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'subscription_history') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'subscription_history' AND column_name = 'is_active') THEN
      ALTER TABLE public.subscription_history ADD COLUMN is_active BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added is_active column to subscription_history table';
    END IF;
  END IF;
END $$;

-- 6. Create organization_invitations table if not exists
CREATE TABLE IF NOT EXISTS public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'rider',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  token TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Create or replace helper functions
CREATE OR REPLACE FUNCTION public.is_organization_active(org_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    is_active AND 
    (subscription_status IN ('trial', 'active')) AND
    (subscription_end_date IS NULL OR subscription_end_date > NOW())
  FROM public.organizations
  WHERE id = org_id;
$$;

CREATE OR REPLACE FUNCTION public.check_organization_limit(
  org_id UUID,
  limit_type TEXT -- 'users', 'products', 'riders'
)
RETURNS BOOLEAN
LANGUAGE PLPGSQL
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
  max_count INTEGER;
BEGIN
  -- Get max limit
  SELECT 
    CASE limit_type
      WHEN 'users' THEN max_users
      WHEN 'products' THEN max_products
      WHEN 'riders' THEN max_riders
    END
  INTO max_count
  FROM public.organizations
  WHERE id = org_id;

  -- Count current usage
  IF limit_type = 'users' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.profiles
    WHERE organization_id = org_id;
  ELSIF limit_type = 'products' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.products
    WHERE organization_id = org_id;
  ELSIF limit_type = 'riders' THEN
    SELECT COUNT(*) INTO current_count
    FROM public.user_roles
    WHERE organization_id = org_id AND role = 'rider';
  END IF;

  RETURN current_count < max_count;
END;
$$;

-- 8. Update handle_new_user function to support multi-tenant
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  user_role app_role;
BEGIN
  -- Check if this is super admin
  IF NEW.email = 'fadlannafian@gmail.com' THEN
    user_role := 'super_admin';
    org_id := NULL; -- Super admin tidak terikat organization
  ELSE
    -- Get organization from metadata or set to NULL
    org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    
    -- Default role
    IF (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
      user_role := (NEW.raw_user_meta_data->>'role')::app_role;
    ELSE
      user_role := 'rider';
    END IF;
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone, address, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    organization_id = EXCLUDED.organization_id;
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, user_role, org_id)
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role,
    organization_id = EXCLUDED.organization_id;
  
  RETURN NEW;
END;
$$;

-- 9. Enable RLS on new tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies (drop existing if any)

-- Subscription plans - anyone can view
DROP POLICY IF EXISTS "Anyone can view subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Super admin can manage plans" ON public.subscription_plans;
CREATE POLICY "Super admin can manage plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Subscription history - organization members can view their history
DROP POLICY IF EXISTS "Users can view their org subscription history" ON public.subscription_history;
CREATE POLICY "Users can view their org subscription history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 11. Update existing RLS policies for multi-tenant (safely)

-- Products: update policy
DROP POLICY IF EXISTS "Users can view products in their organization" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Categories: update policy
DROP POLICY IF EXISTS "Users can view categories in their organization" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
DROP POLICY IF EXISTS "Everyone can read categories" ON public.categories;
CREATE POLICY "Users can view categories in their organization"
ON public.categories FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  organization_id IN (
    SELECT organization_id FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- 12. Create indexes if not exists
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_organization_id ON public.subscription_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_is_active ON public.subscription_history(is_active) WHERE is_active = true;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Multi-tenant setup completed successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Run assign-super-admin-organization.sql to setup super admin';
  RAISE NOTICE '2. Run create-feeds-table.sql for feed system';
  RAISE NOTICE '3. Run add-role-change-audit-log.sql for audit logging';
  RAISE NOTICE '4. Run add-multitenant-to-merged-tables.sql for RLS';
END $$;
