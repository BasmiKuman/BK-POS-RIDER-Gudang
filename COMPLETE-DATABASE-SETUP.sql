-- ============================================================================
-- COMPLETE DATABASE SETUP FOR NEW SUPABASE PROJECT
-- ============================================================================
-- Generated: 2025-11-03T11:40:00.936Z
-- Total Migration Files: 11
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Login to your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Create a new query
-- 4. Copy and paste ALL the SQL below
-- 5. Click "Run" to execute
-- 
-- ============================================================================



-- ============================================================================
-- Migration 1/11: 20251021051903_8a6bf870-fcb0-4822-9b34-684309cc0578.sql
-- ============================================================================

-- Create app role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'rider');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'rider',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  stock_in_warehouse INTEGER NOT NULL DEFAULT 0 CHECK (stock_in_warehouse >= 0),
  image_url TEXT,
  description TEXT,
  sku TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rider_stock table (stok produk di tangan rider)
CREATE TABLE public.rider_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(rider_id, product_id)
);

-- Create distributions table (history distribusi)
CREATE TABLE public.distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  distributed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create returns table (history return produk)
CREATE TABLE public.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  returned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transaction_items table
CREATE TABLE public.transaction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0)
);

-- Create tax_settings table
CREATE TABLE public.tax_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (tax_percentage >= 0 AND tax_percentage <= 100),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default tax setting
INSERT INTO public.tax_settings (tax_percentage) VALUES (0);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create function to handle new user (auto-create profile and assign rider role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign rider role by default (unless it's the admin email)
  IF NEW.email = 'fadlannafian@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'rider');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE PLPGSQL
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_rider_stock_updated_at
  BEFORE UPDATE ON public.rider_stock
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rider_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view all roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for categories
CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories"
  ON public.categories FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rider_stock
CREATE POLICY "Riders can view own stock"
  ON public.rider_stock FOR SELECT
  USING (auth.uid() = rider_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all stock"
  ON public.rider_stock FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for distributions
CREATE POLICY "Users can view relevant distributions"
  ON public.distributions FOR SELECT
  USING (auth.uid() = rider_id OR auth.uid() = admin_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can create distributions"
  ON public.distributions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for returns
CREATE POLICY "Users can view relevant returns"
  ON public.returns FOR SELECT
  USING (auth.uid() = rider_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Riders can create returns"
  ON public.returns FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view relevant transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = rider_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Riders can create transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = rider_id);

-- RLS Policies for transaction_items
CREATE POLICY "Users can view transaction items"
  ON public.transaction_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_items.transaction_id
      AND (transactions.rider_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE POLICY "Users can create transaction items"
  ON public.transaction_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE transactions.id = transaction_items.transaction_id
      AND transactions.rider_id = auth.uid()
    )
  );

-- RLS Policies for tax_settings
CREATE POLICY "Anyone can view tax settings"
  ON public.tax_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage tax settings"
  ON public.tax_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes for better performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_rider_stock_rider_id ON public.rider_stock(rider_id);
CREATE INDEX idx_rider_stock_product_id ON public.rider_stock(product_id);
CREATE INDEX idx_distributions_rider_id ON public.distributions(rider_id);
CREATE INDEX idx_distributions_product_id ON public.distributions(product_id);
CREATE INDEX idx_returns_rider_id ON public.returns(rider_id);
CREATE INDEX idx_returns_product_id ON public.returns(product_id);
CREATE INDEX idx_transactions_rider_id ON public.transactions(rider_id);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items(product_id);


-- ============================================================================
-- Migration 2/11: 20251021052201_22ccd93d-20a0-45aa-a35a-efa0ef0a29cc.sql
-- ============================================================================

-- Create function to decrement rider stock
CREATE OR REPLACE FUNCTION public.decrement_rider_stock(
  p_rider_id UUID,
  p_product_id UUID,
  p_quantity INTEGER
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rider_stock
  SET quantity = quantity - p_quantity
  WHERE rider_id = p_rider_id AND product_id = p_product_id;
END;
$$;


-- ============================================================================
-- Migration 3/11: 20251023021735_d9a06282-6438-453a-b979-377128bec830.sql
-- ============================================================================

-- Create return history table
CREATE TABLE public.return_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL,
  quantity integer NOT NULL,
  notes text,
  returned_at timestamp with time zone NOT NULL,
  approved_at timestamp with time zone NOT NULL DEFAULT now(),
  approved_by uuid NOT NULL
);

-- Enable RLS
ALTER TABLE public.return_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view relevant return history"
ON public.return_history
FOR SELECT
USING (
  auth.uid() = rider_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Only admins can insert return history"
ON public.return_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add index for better performance
CREATE INDEX idx_return_history_rider_id ON public.return_history(rider_id);
CREATE INDEX idx_return_history_product_id ON public.return_history(product_id);


-- ============================================================================
-- Migration 4/11: 20251024021121_23662d67-5510-4c26-8a1e-47a6edaad674.sql
-- ============================================================================

-- Add status column to returns table
CREATE TYPE return_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.returns
ADD COLUMN status return_status NOT NULL DEFAULT 'pending';

-- Add index for better query performance
CREATE INDEX idx_returns_status ON public.returns(status);


-- ============================================================================
-- Migration 5/11: 20251024021944_732d352d-0552-49ca-96d9-3d7795e530e7.sql
-- ============================================================================

-- Create policies only if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'returns' AND policyname = 'Admins can update returns'
  ) THEN
    CREATE POLICY "Admins can update returns" ON public.returns
    FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'returns' AND policyname = 'Admins can delete returns'
  ) THEN
    CREATE POLICY "Admins can delete returns" ON public.returns
    FOR DELETE TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;


-- ============================================================================
-- Migration 6/11: 20251024023322_add_profiles_rls.sql
-- ============================================================================

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles if admin" ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

CREATE POLICY "Users can view all profiles through user_roles if admin" ON public.user_roles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);


-- ============================================================================
-- Migration 7/11: 20251024024522_fix_rls_policies.sql
-- ============================================================================

-- Enable RLS on required tables (skip auth.users - it's managed by Supabase)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Update profiles policies
DROP POLICY IF EXISTS "Users can view all profiles if admin" ON public.profiles;
CREATE POLICY "Users can view all profiles if admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Add user_roles policies
DROP POLICY IF EXISTS "Users can view all user_roles if admin" ON public.user_roles;
CREATE POLICY "Users can view all user_roles if admin"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
  OR user_id = auth.uid()
);

-- Allow admins to insert into user_roles
DROP POLICY IF EXISTS "Only admins can insert user roles" ON public.user_roles;
CREATE POLICY "Only admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);


-- ============================================================================
-- Migration 8/11: 20251025021944_add_categories_rls.sql
-- ============================================================================

-- Add RLS policies for categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories
CREATE POLICY "Everyone can read categories"
ON public.categories
FOR SELECT
USING (true);

-- Only admins can insert/update/delete categories
CREATE POLICY "Only admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Only admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);


-- ============================================================================
-- Migration 9/11: 20251028000001_fix_profiles_insert_policy.sql
-- ============================================================================

-- Fix RLS policy for profiles table - Allow admin to insert new profiles
-- This fixes the issue: "new row violates row level security for tables profiles"

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create policy to allow admin to insert new profiles
CREATE POLICY "Admins can insert profiles"
  ON public.profiles 
  FOR INSERT
  WITH CHECK (
    -- Allow admin to insert any profile
    public.has_role(auth.uid(), 'admin')
    OR
    -- Allow user to insert their own profile (for auto-signup)
    auth.uid() = user_id
  );

-- Also ensure admins can delete profiles if needed
CREATE POLICY "Admins can delete profiles"
  ON public.profiles 
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));



-- ============================================================================
-- Migration 10/11: 20251028000002_fix_handle_new_user_with_metadata.sql
-- ============================================================================

-- Fix handle_new_user function to include phone and address from metadata
-- This prevents 409 conflict when admin adds new user

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with all metadata
  INSERT INTO public.profiles (user_id, full_name, phone, address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', '')
  );
  
  -- Assign rider role by default (unless it's the admin email)
  IF NEW.email = 'fadlannafian@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'rider');
  END IF;
  
  RETURN NEW;
END;
$$;



-- ============================================================================
-- Migration 11/11: 20251029_create_production_history.sql
-- ============================================================================

-- Create production_history table
CREATE TABLE IF NOT EXISTS production_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  notes TEXT,
  produced_by UUID NOT NULL REFERENCES auth.users(id),
  produced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_production_history_product_id ON production_history(product_id);
CREATE INDEX IF NOT EXISTS idx_production_history_produced_at ON production_history(produced_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_history_produced_by ON production_history(produced_by);

-- Enable RLS
ALTER TABLE production_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Admin can view all production history
CREATE POLICY "Admin can view all production history"
  ON production_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admin can insert production history
CREATE POLICY "Admin can insert production history"
  ON production_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admin can update production history
CREATE POLICY "Admin can update production history"
  ON production_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Admin can delete production history
CREATE POLICY "Admin can delete production history"
  ON production_history
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Function to add production and update stock
CREATE OR REPLACE FUNCTION add_production(
  p_product_id UUID,
  p_quantity INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_production_id UUID;
  v_user_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = v_user_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admin can add production';
  END IF;

  -- Check if product exists
  IF NOT EXISTS (SELECT 1 FROM products WHERE id = p_product_id) THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Insert production history
  INSERT INTO production_history (product_id, quantity, notes, produced_by)
  VALUES (p_product_id, p_quantity, p_notes, v_user_id)
  RETURNING id INTO v_production_id;

  -- Update product stock
  UPDATE products
  SET stock_in_warehouse = stock_in_warehouse + p_quantity
  WHERE id = p_product_id;

  RETURN v_production_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_production(UUID, INTEGER, TEXT) TO authenticated;

COMMENT ON TABLE production_history IS 'Tracks all production activities and stock additions';
COMMENT ON FUNCTION add_production IS 'Adds production record and automatically updates product stock in warehouse';



-- ============================================================================
-- END OF ALL MIGRATIONS
-- ============================================================================
-- 
-- ✅ All tables, functions, triggers, and policies have been created!
-- 
-- Next steps:
-- 1. Verify all tables are created in Table Editor
-- 2. Check RLS policies are enabled
-- 3. Test the application connection
-- 
-- ============================================================================
