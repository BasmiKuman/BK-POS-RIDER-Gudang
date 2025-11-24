# Setup Guide: Subscription Badge Feature

This guide will help you complete the subscription badge implementation and fix TypeScript errors.

## 📋 Current Status

✅ **Completed:**
- SubscriptionBadge component created (265 lines)
- Dashboard.tsx integration complete
- POS.tsx integration complete
- Super admin organization SQL script ready
- Merged features SQL scripts ready

❌ **TypeScript Errors (Expected):**
The SubscriptionBadge component has 9 TypeScript errors because required database columns don't exist yet:
- `profiles.organization_id` - missing
- Subscription tables - not created
- Organization schema - incomplete

**These errors will automatically resolve after running the SQL migrations.**

---

## 🚀 Step-by-Step Setup

### Step 1: Run Database Migration (CRITICAL - Do This First!)

The main multi-tenant schema already exists in your migrations folder. Run it in Supabase SQL Editor:

**File:** `supabase/migrations/20251103_add_multi_tenant_saas.sql`

This migration creates:
- ✅ `organizations` table with subscription fields
- ✅ `subscription_plans` table (Free/Basic/Pro/Enterprise)
- ✅ `subscription_history` table for tracking
- ✅ `organization_id` column added to all tables (profiles, products, etc.)
- ✅ RLS policies for multi-tenant data isolation
- ✅ `super_admin` role added to app_role enum

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy entire contents of `supabase/migrations/20251103_add_multi_tenant_saas.sql`
3. Paste and click "Run"
4. Wait for success confirmation

⚠️ **IMPORTANT:** This must run BEFORE any other SQL files. It creates the foundation for all other features.

---

### Step 2: Assign Super Admin Organization

After Step 1 completes, run this to give your super admin an organization for testing:

**File:** `assign-super-admin-organization.sql`

This script:
- Creates "Super Admin Test Organization" 
- Assigns Enterprise plan (1 year, free)
- Links to fadlannafian@gmail.com
- Allows super admin to test admin features

**How to run:**
1. Supabase Dashboard → SQL Editor
2. Copy contents of `assign-super-admin-organization.sql`
3. Run it
4. You should see: "✅ Super admin organization setup complete!"

---

### Step 3: Setup Merged Features

Run these SQL files in order to enable features merged from V.3-Lovable-POS:

**3a. Create Feeds Table (Announcements)**
```sql
-- File: create-feeds-table.sql
-- Creates: feeds table for video announcements with RLS
```

**3b. Add Role Change Audit Log**
```sql
-- File: add-role-change-audit-log.sql  
-- Creates: role_change_logs table for tracking admin/rider changes
```

**3c. Add Multi-Tenant RLS to Merged Tables**
```sql
-- File: add-multitenant-to-merged-tables.sql
-- Adds: RLS policies for feeds and role_change_logs
```

**3d. Fix Orphan Rider Stock**
```sql
-- File: fix-orphan-rider-stock.sql
-- Creates: cleanup_orphan_rider_stock() function
```

**How to run:**
1. Run files one by one in SQL Editor
2. Wait for each to complete before running next
3. Check for errors after each execution

---

### Step 4: Verify Database Setup

Run this verification query in SQL Editor:

```sql
-- Check if all required tables exist
SELECT 
  'organizations' AS table_name, 
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') AS exists
UNION ALL
SELECT 'subscription_plans', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans')
UNION ALL
SELECT 'subscription_history', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_history')
UNION ALL
SELECT 'feeds', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feeds')
UNION ALL
SELECT 'role_change_logs', EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'role_change_logs');

-- Check if organization_id column exists in profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'organization_id';

-- Check subscription plans are populated
SELECT name, display_name, price_monthly, max_users 
FROM subscription_plans 
ORDER BY price_monthly;

-- Verify super admin has organization
SELECT 
  p.id AS profile_id,
  p.full_name,
  o.name AS organization_name,
  o.subscription_plan,
  o.subscription_end_date
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'fadlannafian@gmail.com');
```

**Expected Results:**
- All 5 tables should show `exists = true`
- `organization_id` column exists in profiles as `uuid`
- 4 subscription plans listed (Free, Basic, Pro, Enterprise)
- Super admin profile linked to "Super Admin Test Organization" with Enterprise plan

---

### Step 5: Test Subscription Badge

After SQL execution, TypeScript errors will disappear. Now test the feature:

**Test as Super Admin (fadlannafian@gmail.com):**

1. **Login** → You should see crown icon badge in Dashboard header
2. **Check Badge Display:**
   - Shows "ENTERPRISE" in yellow badge
   - Displays days remaining (should show ~365 days)
   - Crown icon visible

3. **Click Badge** → Dialog opens showing:
   - Organization name: "Super Admin Test Organization"
   - Plan: ENTERPRISE (yellow badge)
   - Start date: Today's date
   - End date: 1 year from today
   - Payment status: "free"
   - Features list:
     - ∞ Unlimited Users
     - ∞ Unlimited Products  
     - ∞ Unlimited Riders
     - ✓ Advanced Analytics
     - ✓ Priority Support
     - ✓ Custom Branding
     - ✓ API Access

4. **Navigate to POS Page** → Badge should also appear in header

5. **Test Expiry Warning:**
   - Manually update end_date in database to 20 days from now
   - Badge should turn orange and show warning
   - Set to 5 days from now → Badge turns red with urgent warning

---

### Step 6: Create Test Accounts

**Test Account 1: New Organization Admin**

1. Logout from super admin
2. Go to `/signup`
3. Register new account (e.g., testadmin@example.com)
4. Complete signup flow → Creates new organization with FREE plan
5. Login → Badge should show "FREE" (gray) with 30 days trial
6. Click badge → Should see Free plan features:
   - ✓ Up to 5 Users
   - ✓ Up to 50 Products
   - ✓ Up to 3 Riders
   - ✓ Basic Reports
   - ✓ Email Support

**Test Account 2: Rider in Super Admin Org**

1. Login as super admin (fadlannafian@gmail.com)
2. Go to Settings → Manage Users tab
3. Click "Add User" button
4. Fill in:
   - Email: testrider@example.com
   - Password: (any secure password)
   - Role: Rider
5. Save → New rider account created in super admin's organization
6. Logout and login as testrider@example.com
7. **Verify:** Badge does NOT appear (rider role has no subscription badge)
8. **Verify:** Rider cannot access admin features (Settings, Products, etc.)

---

### Step 7: Test Merged Features

**Test Role Change (Admin Feature):**

1. Login as super admin
2. Go to Settings → Manage Users
3. Find test rider account
4. Click "Change to Admin" button
5. Confirm in dialog
6. Verify: Role changes to Admin
7. Check: role_change_logs table has audit entry
8. Login as that user → Should now see SubscriptionBadge

**Test Feed System (Announcements):**

1. Login as super admin
2. Go to Feed Management (sidebar)
3. Create new feed:
   - Title: "New Feature Announcement"
   - Content: "We've added subscription badges!"
   - Type: "announcement"
   - Add YouTube URL (optional)
4. Save → Feed created
5. Login as rider → Feed appears in rider dashboard
6. Video embed should work if YouTube URL provided

**Test Orphan Stock Cleanup:**

1. Login as super admin
2. Go to Products page
3. Look for "Clean Orphan Stock" button
4. Click to cleanup rider stock with no matching products
5. Toast notification confirms cleanup count

---

## 🛠️ Troubleshooting

### TypeScript Errors Still Show After SQL Migration

**Solution:**
1. Close VSCode
2. Delete `node_modules/.cache` folder
3. Run: `npm run build` or `bun run build`
4. Restart VSCode
5. Check errors again → Should be gone

### Badge Not Appearing

**Check:**
- User role is admin or super_admin (riders don't see badge)
- User has organization_id in profiles table
- Organization has active subscription_history entry

**Debug Query:**
```sql
SELECT 
  u.email,
  ur.role,
  p.organization_id,
  o.subscription_plan,
  sh.end_date
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN subscription_history sh ON o.id = sh.organization_id AND sh.is_active = true
WHERE u.email = 'YOUR_EMAIL_HERE';
```

### Dialog Shows Wrong Data

**Check:**
- subscription_history has `is_active = true` for current subscription
- end_date is in the future
- organization_id matches between profiles and subscription_history

**Fix Query:**
```sql
-- Update super admin subscription to active
UPDATE subscription_history
SET is_active = true, end_date = NOW() + INTERVAL '1 year'
WHERE organization_id = (
  SELECT organization_id FROM profiles 
  WHERE id = (SELECT id FROM auth.users WHERE email = 'fadlannafian@gmail.com')
);
```

### "Upgrade Now" Button Does Nothing

**Expected Behavior:** Currently just a placeholder
**Future Implementation:** 
- Link to payment page (Stripe/Midtrans integration)
- Contact sales form
- WhatsApp business link

---

## 📱 Feature Requirements

### Plan Features Matrix

| Feature | FREE | BASIC | PRO | ENTERPRISE |
|---------|------|-------|-----|------------|
| Max Users | 5 | 20 | 100 | Unlimited |
| Max Products | 50 | 200 | 1000 | Unlimited |
| Max Riders | 3 | 10 | 50 | Unlimited |
| Basic Reports | ✅ | ✅ | ✅ | ✅ |
| Advanced Analytics | ❌ | ❌ | ✅ | ✅ |
| Email Support | ✅ | ✅ | ✅ | ✅ |
| Priority Support | ❌ | ❌ | ✅ | ✅ |
| Custom Branding | ❌ | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ❌ | ✅ |

### Expiry Warning Colors

| Days Remaining | Badge Color | Alert Level |
|----------------|-------------|-------------|
| 30+ days | Green/Original | None |
| 8-29 days | Orange | Warning |
| 0-7 days | Red | Urgent |
| Expired | Red | Expired |

---

## 📚 Files Modified/Created

### New Files:
1. `src/components/SubscriptionBadge.tsx` (265 lines)
2. `assign-super-admin-organization.sql` (185 lines)
3. `SETUP-SUBSCRIPTION-BADGE.md` (this file)

### Modified Files:
1. `src/pages/Dashboard.tsx` - Added badge to header
2. `src/pages/POS.tsx` - Added badge to header

### Existing Files (Already in migrations):
1. `supabase/migrations/20251103_add_multi_tenant_saas.sql` - Base schema
2. `create-feeds-table.sql` - Feed system
3. `add-role-change-audit-log.sql` - Audit logging
4. `add-multitenant-to-merged-tables.sql` - RLS policies
5. `fix-orphan-rider-stock.sql` - Cleanup function

---

## ✅ Success Checklist

- [ ] Step 1: Main migration executed (20251103_add_multi_tenant_saas.sql)
- [ ] Step 2: Super admin organization assigned
- [ ] Step 3: All 4 merged feature SQL files executed
- [ ] Step 4: Verification queries pass (all tables exist)
- [ ] Step 5: Super admin sees ENTERPRISE badge
- [ ] Step 5: Badge dialog opens with correct data
- [ ] Step 5: Badge appears on both Dashboard and POS
- [ ] Step 6: Free plan test account created
- [ ] Step 6: Rider test account created (no badge visible)
- [ ] Step 7: Role change feature works
- [ ] Step 7: Feed system works
- [ ] Step 7: Orphan stock cleanup works
- [ ] TypeScript errors resolved (0 errors in SubscriptionBadge.tsx)

---

## 🎯 Next Steps After Setup

1. **Payment Integration** - Connect Stripe/Midtrans for subscription upgrades
2. **Usage Limits** - Enforce max_users, max_products, max_riders
3. **Email Notifications** - Send expiry warnings (7 days, 3 days, 1 day before)
4. **Admin Panel** - Super admin dashboard to manage all organizations
5. **Analytics** - Track subscription revenue, churn rate, upgrades

---

## 📞 Support

If you encounter issues:

1. Check TypeScript errors in VSCode
2. Check browser console for runtime errors
3. Check Supabase logs for database errors
4. Run verification queries to check data
5. Review this guide's troubleshooting section

**Common Error Patterns:**
- "organization_id does not exist" → Run Step 1 migration
- "Cannot read property 'subscription_plan'" → Run Step 2 super admin SQL
- Badge not visible → Check user role (must be admin/super_admin)
- Dialog empty → Check subscription_history has active entry

---

**Documentation Generated:** January 2025  
**Version:** 1.0.0  
**Feature:** Subscription Badge with Multi-Tenant Support
