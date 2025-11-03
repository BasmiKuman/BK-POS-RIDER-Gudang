-- ============================================================================
-- ADD RPC FUNCTION: Get Organization Users with Emails
-- ============================================================================
-- Function untuk super admin get list users dalam organization dengan email
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_organization_users(org_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role app_role,
  created_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only super admin can call this function
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin only.';
  END IF;

  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    u.email,
    p.full_name,
    ur.role,
    p.created_at
  FROM public.profiles p
  INNER JOIN auth.users u ON u.id = p.user_id
  LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE p.organization_id = org_id
  ORDER BY p.created_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_organization_users(UUID) TO authenticated;

-- Test query
-- SELECT * FROM public.get_organization_users('YOUR_ORG_ID_HERE');
