-- ============================================================================
-- QUICK EXECUTE: Multi-Tenant SaaS Migration - PART 2
-- ============================================================================
-- Execute this AFTER PART 1 is completed
-- ============================================================================

-- 1. Create organizations/tenants table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- untuk subdomain atau URL unik
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  max_users INTEGER DEFAULT 5, -- batas user per organization
  max_products INTEGER DEFAULT 50, -- batas produk
  max_riders INTEGER DEFAULT 3, -- batas rider
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- 2. Add organization_id to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.rider_stock ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.distributions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.production_history ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. Create subscription_plans table (untuk pricing)
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_products INTEGER NOT NULL DEFAULT 50,
  max_riders INTEGER NOT NULL DEFAULT 3,
  features JSONB, -- fitur-fitur yang didapat
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plans
INSERT INTO public.subscription_plans (name, display_name, description, price_monthly, price_yearly, max_users, max_products, max_riders, features) VALUES
('free', 'Free Trial', '14 days free trial', 0, 0, 3, 20, 2, '["Basic POS", "Product Management", "2 Riders"]'::jsonb),
('basic', 'Basic Plan', 'For small business', 99000, 990000, 10, 100, 5, '["Full POS Features", "Product Management", "5 Riders", "Reports"]'::jsonb),
('pro', 'Pro Plan', 'For growing business', 299000, 2990000, 50, 500, 20, '["All Basic Features", "20 Riders", "Advanced Reports", "API Access"]'::jsonb),
('enterprise', 'Enterprise', 'For large business', 999000, 9990000, 999, 9999, 100, '["All Pro Features", "Unlimited Users", "Priority Support", "Custom Integration"]'::jsonb);

-- 4. Create subscription_history table (untuk tracking pembayaran)
CREATE TABLE public.subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_date TIMESTAMPTZ,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create organization_invitations table
CREATE TABLE public.organization_invitations (
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

-- 6. Function to check if organization subscription is active
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

-- 7. Function to check organization limits
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
  -- Check if this is super admin (your email)
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
  INSERT INTO public.profiles (user_id, full_name, phone, address, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', ''),
    org_id
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, user_role, org_id);
  
  RETURN NEW;
END;
$$;

-- 9. Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies for organizations

-- Super admin can see all organizations
CREATE POLICY "Super admin can view all organizations"
ON public.organizations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Users can see their own organization
  id IN (
    SELECT organization_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

-- Super admin can manage all organizations
CREATE POLICY "Super admin can manage organizations"
ON public.organizations FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- 11. RLS Policies for subscription_plans
CREATE POLICY "Anyone can view subscription plans"
ON public.subscription_plans FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Super admin can manage plans"
ON public.subscription_plans FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- 12. Update existing RLS policies to support multi-tenant
-- Users can only see data from their organization

-- Products: filter by organization
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
CREATE POLICY "Users can view products in their organization"
ON public.products FOR SELECT
TO authenticated
USING (
  -- Super admin sees all
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Users see their organization's products
  organization_id IN (
    SELECT organization_id FROM public.profiles
    WHERE user_id = auth.uid()
  )
);

-- Categories: filter by organization
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
    WHERE user_id = auth.uid()
  )
);

-- 13. Create indexes for performance
CREATE INDEX idx_organizations_subscription_status ON public.organizations(subscription_status);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);
CREATE INDEX idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_subscription_history_organization_id ON public.subscription_history(organization_id);

-- 14. Create trigger to update organization updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.organizations IS 'Multi-tenant organizations/businesses using the system';
COMMENT ON TABLE public.subscription_plans IS 'Available subscription plans and pricing';
COMMENT ON TABLE public.subscription_history IS 'Payment and subscription history for each organization';
COMMENT ON FUNCTION is_organization_active IS 'Check if organization subscription is active and not expired';
