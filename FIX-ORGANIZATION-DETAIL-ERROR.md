# 🔧 Fix Organization Detail Page Error

## Error yang Ditemukan
```
Failed to load resource: the server responded with a status of 400
Error: subscription_plans!inner(name) - Cannot JOIN
```

## Root Cause
Organizations table menggunakan `subscription_plan` sebagai **TEXT enum** ('free', 'basic', 'pro', 'enterprise'), bukan foreign key ke subscription_plans table. Supabase tidak bisa melakukan JOIN pada kolom TEXT.

## Solutions Applied

### 1. ✅ Fixed Organization Query
**Before:**
```typescript
.select('*, subscription_plans!inner(name)')
```

**After:**
```typescript
.select('*') // subscription_plan sudah tersedia langsung sebagai TEXT
```

### 2. ✅ Fixed Subscription History Query
**Before:**
```typescript
.select('id, start_date, end_date, amount, payment_status, subscription_plans!inner(name)')
```

**After:**
```typescript
// Step 1: Get history with plan_id
.select('id, start_date, end_date, amount, payment_status, plan_id')

// Step 2: Get plan details separately
const plansData = await supabase
  .from('subscription_plans')
  .select('id, name, display_name')
  .in('id', planIds);

// Step 3: Enrich history with plan names
const enrichedHistory = historyData.map(h => ({
  ...h,
  subscription_plans: plansMap.get(h.plan_id)
}));
```

### 3. ✅ Fixed Users Query with RPC Function
**Problem:** Cannot JOIN to `auth.users` table directly from client

**Solution:** Created RPC function `get_organization_users()`

#### SQL Function Created:
File: `add-get-org-users-function.sql`

```sql
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
AS $$
BEGIN
  -- Only super admin can call this
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
```

**Client Code:**
```typescript
const { data: usersData } = await supabase
  .rpc('get_organization_users', { org_id: id });
```

## 📝 Action Required

Execute this SQL in Supabase SQL Editor:

```bash
add-get-org-users-function.sql
```

This creates the RPC function to get users with their emails.

## ✅ After Fix

1. Navigate to `/super-admin`
2. Click any organization
3. Should load successfully:
   - ✅ Organization overview
   - ✅ Users tab (with real emails via RPC)
   - ✅ Products tab
   - ✅ Billing history tab

## Files Modified

1. `src/pages/OrganizationDetail.tsx`
   - Fixed organization query (removed JOIN)
   - Fixed subscription history query (separate queries + enrich)
   - Fixed users query (use RPC function)

2. `add-get-org-users-function.sql` (NEW)
   - RPC function for super admin to get org users with emails

## Testing

```typescript
// Test RPC function in Supabase SQL Editor:
SELECT * FROM get_organization_users('YOUR_ORG_ID_HERE');

// Expected output:
// id | user_id | email | full_name | role | created_at
```

---

**Status:** ✅ Fixed - Ready to test after executing SQL function
