-- ============================================================================
-- CREATE: get_active_riders RPC Function
-- ============================================================================
-- Get riders yang aktif (GPS updated dalam 5 menit terakhir)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_active_riders()
RETURNS TABLE (
  rider_id UUID,
  full_name TEXT,
  phone TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  last_update TIMESTAMPTZ,
  accuracy DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  heading DOUBLE PRECISION
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id as rider_id,
    p.full_name,
    p.phone,
    g.latitude,
    g.longitude,
    g.updated_at as last_update,
    g.accuracy,
    g.speed,
    g.heading
  FROM public.gps_tracking g
  JOIN public.profiles p ON g.user_id = p.user_id
  JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'rider'
    AND g.updated_at > NOW() - INTERVAL '5 minutes'
    AND p.organization_id = (
      SELECT organization_id 
      FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  ORDER BY g.updated_at DESC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_active_riders() TO authenticated;

-- Verify function exists
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'get_active_riders';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Function get_active_riders created successfully';
  RAISE NOTICE '✅ RiderTrackingMap will now work';
END $$;
