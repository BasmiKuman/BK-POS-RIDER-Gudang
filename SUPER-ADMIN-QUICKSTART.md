# 🎯 Quick Start: Super Admin

## Login sebagai Super Admin

1. **Email**: fadlannafian@gmail.com
2. **Password**: (password yang sudah di-set)

## Dashboard URLs

- 🏠 Super Admin Dashboard: `http://localhost:8081/super-admin`
- ➕ Create Organization: `http://localhost:8081/super-admin/create-organization`
- ⚙️ Manage Plans: `http://localhost:8081/super-admin/subscription-plans`

## Quick Actions

### Create New Organization
```
1. Navigate to /super-admin
2. Click "New Organization"
3. Fill form:
   - Organization Name: "Test Organization"
   - Owner Email: "owner@test.com"
   - Owner Name: "Test Owner"
   - Select Plan: "Basic Plan"
4. Submit
5. ✅ Organization created with credentials
```

### Edit Subscription Plan
```
1. Navigate to /super-admin/subscription-plans
2. Click "Edit Plan" on any plan
3. Update:
   - Pricing (monthly/yearly)
   - Limits (users/products/riders)
   - Features (one per line)
4. Save Changes
5. ✅ Plan updated in database
```

### View Organization Details
```
1. Navigate to /super-admin
2. Click any organization row
3. View 4 tabs:
   - Overview: Info & usage
   - Users: Organization users
   - Products: Organization products
   - Billing: Payment history
```

## Current Test Data

**8 Organizations Created:**
1. Toko Kelontong Jaya (Free - Trial)
2. Warung Mbok Sri (Basic - Active)
3. Minimarket Sumber Rezeki (Pro - Active)
4. Supermarket Keluarga Sejahtera (Enterprise - Active)
5. Toko Bangunan Maju (Free - Expired)
6. Warung Pak Budi (Basic - Cancelled)
7. Toko Elektronik Digital (Basic - Expiring in 2 days)
8. Apotek Sehat Sentosa (Pro - New, 3 days old)

**Expected Dashboard Stats:**
- Total Organizations: 8
- Active Subscriptions: 5
- Monthly Revenue: Rp 1,795,000
- Trial Organizations: 1

## Verify Setup

### Check Super Admin Role
```sql
SELECT u.email, ur.role
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'super_admin';
```

Expected: fadlannafian@gmail.com | super_admin

### Check Organizations
```sql
SELECT name, subscription_plan, subscription_status, is_active
FROM public.organizations
ORDER BY created_at DESC;
```

Expected: 8 rows

### Check Revenue
```sql
SELECT 
  SUM(amount) FILTER (WHERE payment_status = 'paid') as total_revenue
FROM public.subscription_history;
```

Expected: 1795000.00

## Common Tasks

### Add New Super Admin
```sql
-- 1. Create user di Supabase Auth Dashboard
-- 2. Get user_id dari auth.users
-- 3. Update role:
UPDATE public.user_roles
SET role = 'super_admin'
WHERE user_id = 'USER_ID_HERE';
```

### Deactivate Organization
```
1. Go to organization detail page
2. Click "Deactivate" button
3. Confirm
4. ✅ Organization is_active = false
```

### Change Subscription Plan
```sql
-- Manual SQL update (nanti bisa via UI)
UPDATE public.organizations
SET 
  subscription_plan = 'pro',
  max_users = 50,
  max_products = 500,
  max_riders = 20
WHERE id = 'ORG_ID_HERE';

-- Create billing record
INSERT INTO public.subscription_history 
(organization_id, plan_id, amount, start_date, end_date, payment_status)
VALUES (
  'ORG_ID_HERE',
  (SELECT id FROM subscription_plans WHERE name = 'pro'),
  299000,
  NOW(),
  NOW() + INTERVAL '30 days',
  'pending'
);
```

## Troubleshooting

### Can't access /super-admin
❌ Shows "Access Denied"
✅ **Solution**: Verify role di database
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
-- Should return role = 'super_admin'
```

### Dashboard shows 0 organizations
❌ Empty table or stats = 0
✅ **Solution**: Run generate-dummy-data.sql

### Error 500 on page load
❌ Console shows RLS policy error
✅ **Solution**: Run FINAL-FIX-ADMIN.sql

### Can't edit subscription plan
❌ Save fails with permission error
✅ **Solution**: Check RLS policies on subscription_plans table

## Next Steps

1. ✅ Test all super admin features
2. ✅ Create test organization
3. ✅ Edit subscription plan
4. ✅ View organization details
5. 🔄 Integrate payment gateway (Midtrans/Xendit)
6. 🔄 Add organization invitation system
7. 🔄 Build billing portal untuk organization admins

---

**You're all set!** 🚀 Start exploring the Super Admin Dashboard.
