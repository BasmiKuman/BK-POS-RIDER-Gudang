# 🚀 Quick Setup Guide: Merged Features

## ✅ Successfully Merged!

All updates from **V.3-Lovable-POS** have been merged into **BK-POS-RIDER-Gudang** with multi-tenant compatibility.

---

## 📋 Execute SQL Files (In Order)

### Step 1: Role Change Tracking
```bash
# Execute in Supabase SQL Editor
```
**File:** `add-role-change-audit-log.sql`
- Creates `role_change_logs` table
- Tracks who changed what role and when

### Step 2: Feed System
```bash
# Execute in Supabase SQL Editor
```
**File:** `create-feeds-table.sql`
- Creates `feeds` table
- Enables admin to post announcements/videos for riders

### Step 3: Orphan Stock Cleanup
```bash
# Execute in Supabase SQL Editor
```
**File:** `fix-orphan-rider-stock.sql`
- Prevents orphan rider_stock when deleting products
- Shows affected riders before deletion

### Step 4: Multi-Tenant Setup (IMPORTANT!)
```bash
# Execute in Supabase SQL Editor
```
**File:** `add-multitenant-to-merged-tables.sql`
- Adds `organization_id` to feeds and role_change_logs
- Creates RLS policies for multi-tenant isolation
- Creates indexes for performance

---

## 🎯 New Features Available

### 1. Role Management (Admin & Super Admin)

**Location:** Settings Page → Manage Users

**What's New:**
- Button to change roles: Rider ↔ Admin
- Shield icons indicate role
- Confirmation dialogs
- Audit log tracks all changes

**How to Use:**
1. Go to Settings page
2. Find user in list
3. Click Shield/ShieldCheck button
4. Confirm role change
5. Done! Change is logged in `role_change_logs`

**Who Can Use:**
- ✅ Admin: Can change users in their organization
- ✅ Super Admin: Can change users in any organization
- ❌ Rider: Cannot access this feature

---

### 2. Feed Management (Admin Only)

**Not Yet Integrated** - Components are ready but need UI integration.

**To Integrate:**
Add to OrganizationSettings.tsx or Settings.tsx:

```tsx
import { FeedManagement } from "@/components/FeedManagement";

// In your tabs/sections:
<Tab value="feeds">
  <FeedManagement />
</Tab>
```

**Features:**
- Create posts with text, images, videos
- Embed YouTube, Facebook, Instagram videos
- Set priority and status (draft/published)
- Riders see feeds in their dashboard

---

### 3. Orphan Stock Cleanup (Automatic)

**Location:** Products Page → Delete Product

**What's New:**
- When deleting a product, system checks for rider stock
- Shows warning with affected riders
- Auto-cleans up rider_stock on deletion
- Prevents orphan data

**Example Warning:**
```
⚠️ PERHATIAN!

User ini masih memiliki 50 item produk di stock mereka (3 produk berbeda).

Jika Anda menghapus produk ini, semua data berikut akan OTOMATIS DIHAPUS:
• Rider stock (50 items)
• Distribusi produk
• Data return
• Transaksi penjualan

Apakah Anda yakin ingin melanjutkan?
```

---

## 🧪 Testing Checklist

### ✅ Role Management
- [ ] Execute `add-role-change-audit-log.sql`
- [ ] Execute `add-multitenant-to-merged-tables.sql`
- [ ] Login as Admin
- [ ] Go to Settings → Manage Users
- [ ] Try changing a Rider to Admin
- [ ] Try changing an Admin to Rider
- [ ] Verify: Cannot change Super Admin role
- [ ] Check `role_change_logs` table has entries

### ✅ Feed Management
- [ ] Execute `create-feeds-table.sql`
- [ ] Execute `add-multitenant-to-merged-tables.sql`
- [ ] Integrate FeedManagement component (see above)
- [ ] Create feed with text only
- [ ] Create feed with image
- [ ] Create feed with YouTube video
- [ ] Verify: Riders can view feeds
- [ ] Verify: Other orgs cannot see your feeds

### ✅ Orphan Stock Cleanup
- [ ] Execute `fix-orphan-rider-stock.sql`
- [ ] Go to Products page as Admin
- [ ] Distribute some products to a rider
- [ ] Try to delete that product
- [ ] Verify: Warning shows affected riders
- [ ] Confirm deletion
- [ ] Verify: rider_stock is cleaned up

---

## 🔐 Multi-Tenant Verification

**IMPORTANT:** All features must respect organization boundaries!

### Test Isolation:
1. Create 2 test organizations (Org A, Org B)
2. Org A creates a feed → Org B should NOT see it
3. Org A changes a user role → Org B should NOT see the log
4. Org A deletes product → Only Org A riders affected

### RLS Policies Active:
```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('feeds', 'role_change_logs');

-- Should return: t (true) for both
```

---

## 📚 Documentation

Comprehensive guides included:

1. **MERGE-V3-LOVABLE-POS.md** - Full merge details
2. **FIX-ORPHAN-RIDER-STOCK.md** - Cleanup guide
3. **VIDEO-FEED-GUIDE.md** - How to use feeds
4. **INSTAGRAM-VIDEO-ALTERNATIVES.md** - Video embed tips
5. **CONTOH-FEED-VIDEO.md** - Examples (Indonesian)

---

## 🎨 UI Integration TODO

### Feed Management UI:

**Option 1:** Add to OrganizationSettings (Recommended)
```tsx
// In src/pages/OrganizationSettings.tsx
import { FeedManagement } from "@/components/FeedManagement";

<TabsContent value="feeds">
  <FeedManagement />
</TabsContent>
```

**Option 2:** Add to Settings (Simple)
```tsx
// In src/pages/Settings.tsx
import { FeedManagement } from "@/components/FeedManagement";

// Add section for admins only
{isAdmin && (
  <Card>
    <CardHeader>
      <CardTitle>Feed Management</CardTitle>
    </CardHeader>
    <CardContent>
      <FeedManagement />
    </CardContent>
  </Card>
)}
```

**Option 3:** Dedicated Page
```tsx
// Create src/pages/FeedManagement.tsx
import { FeedManagement } from "@/components/FeedManagement";

export default function FeedManagementPage() {
  return (
    <div className="container py-6">
      <FeedManagement />
    </div>
  );
}

// Add route in App.tsx
<Route path="/feeds" element={<FeedManagementPage />} />
```

---

## ⚠️ Known Limitations

1. **Feed Management** - UI not integrated yet (components ready)
2. **Settings Tabs** - Old structure kept, new components available separately
3. **Video Embeds** - Instagram Reels cannot be embedded (see alternatives)

---

## 🆘 Troubleshooting

### Error: "relation 'feeds' does not exist"
→ Execute `create-feeds-table.sql`

### Error: "relation 'role_change_logs' does not exist"
→ Execute `add-role-change-audit-log.sql`

### Error: "column organization_id does not exist"
→ Execute `add-multitenant-to-merged-tables.sql`

### Error: "permission denied for table feeds"
→ RLS policies not set up, execute `add-multitenant-to-merged-tables.sql`

### Role change button not showing
→ Check: User has admin or super_admin role
→ Check: ManageUsersTab component is being used

---

## 📞 Support

- Check `MERGE-V3-LOVABLE-POS.md` for detailed information
- All SQL files have inline comments
- Components have TypeScript types for clarity

---

**Status:** ✅ Merge Complete, Testing Pending
**Date:** November 14, 2025
**Merged By:** GitHub Copilot
