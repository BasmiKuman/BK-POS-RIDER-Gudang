# Merge: V.3-Lovable-POS Updates

## 📋 Overview
Merged recent updates from `V.3-Lovable-POS-kxauidotesbcuypuokal` repository into `BK-POS-RIDER-Gudang` multi-tenant SaaS project.

**Source Repository:** https://github.com/BasmiKuman/V.3-Lovable-POS-kxauidotesbcuypuokal.git
**Merge Date:** November 14, 2025
**Commits Merged:** `ad783f9..e53ea8f` (10 commits)

---

## ✅ Merged Features

### 1. **Role Management System**
- ✅ **Component:** `src/components/settings/ManageUsersTab.tsx`
- **Features:**
  - Super Admin can change user roles (Rider ↔ Admin)
  - Role change button with Shield icons
  - Audit log for role changes
  - Confirmation dialogs for role changes
- **SQL Required:** `add-role-change-audit-log.sql`

### 2. **Feed Management System** (Admin Feature)
- ✅ **Components:**
  - `src/components/FeedManagement.tsx` - Admin can create/edit/delete feeds
  - `src/components/RiderFeedCard.tsx` - Rider view with video embeds
- **Features:**
  - Video embed support (YouTube, Facebook, Instagram)
  - Image upload support
  - Priority sorting
  - Active/Inactive status
  - Enhanced UX with better hints
- **SQL Required:** `create-feeds-table.sql`

### 3. **Orphan Rider Stock Cleanup**
- ✅ **Component:** `src/pages/Products.tsx`
- **Features:**
  - Auto-cleanup orphan rider_stock when deleting products
  - Warning dialog showing affected riders before deletion
  - Prevents data inconsistency
- **SQL Required:** `fix-orphan-rider-stock.sql`

### 4. **Settings Tab Components**
- ✅ **Folder:** `src/components/settings/`
- **Components:**
  - `ManageUsersTab.tsx` - User management with role change
  - `ProfileTab.tsx` - User profile editing
  - `GPSTab.tsx` - GPS tracking settings
  - `FeedTab.tsx` - Feed management tab

---

## 📄 Documentation Files Merged

1. ✅ `FIX-ORPHAN-RIDER-STOCK.md` - Guide for orphan stock cleanup
2. ✅ `INSTAGRAM-VIDEO-ALTERNATIVES.md` - Instagram video embedding alternatives
3. ✅ `VIDEO-FEED-GUIDE.md` - Comprehensive video feed guide
4. ✅ `CONTOH-FEED-VIDEO.md` - Video feed examples (Indonesian)

---

## 🗄️ SQL Files to Execute

### Required (Execute in Order):

1. **`add-role-change-audit-log.sql`**
   - Creates `role_change_logs` table
   - Tracks role changes (who, when, old/new role)
   - Required for ManageUsersTab role change feature

2. **`create-feeds-table.sql`**
   - Creates `feeds` table
   - Stores feed posts (text, images, videos)
   - Includes priority, status, timestamps
   - Required for FeedManagement component

3. **`fix-orphan-rider-stock.sql`**
   - Adds function `check_rider_stock_before_delete`
   - Prevents orphan stock when deleting products
   - Returns affected riders info

### Optional (Performance/Fixes):

4. **`fix-return-history-status-column.sql`**
   - Adds `status` column to return_history (already in project)

5. **`create-get-active-riders-function.sql`**
   - Creates RPC function for GPS tracking (already in project)

---

## 🔄 Multi-Tenant Compatibility

### ⚠️ Important Notes:

All copied components use **`(table_name as any)`** syntax which is compatible with our multi-tenant setup. However, these tables need **organization_id** column and **RLS policies**:

#### Tables to Update:

1. **`feeds` table:**
   ```sql
   ALTER TABLE feeds ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
   
   -- RLS Policy
   CREATE POLICY "Users can view their org feeds"
     ON feeds FOR SELECT
     USING (organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid()));
   
   CREATE POLICY "Admins can manage their org feeds"
     ON feeds FOR ALL
     USING (
       organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
       AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
     );
   ```

2. **`role_change_logs` table:**
   ```sql
   ALTER TABLE role_change_logs ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
   
   -- RLS Policy
   CREATE POLICY "Admins can view their org role changes"
     ON role_change_logs FOR SELECT
     USING (
       organization_id = (SELECT organization_id FROM profiles WHERE user_id = auth.uid())
       AND EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
     );
   ```

---

## 🧪 Testing Checklist

### Role Management:
- [ ] Execute `add-role-change-audit-log.sql`
- [ ] Add organization_id column to role_change_logs
- [ ] Setup RLS policies
- [ ] Test: Admin can change Rider → Admin
- [ ] Test: Admin can change Admin → Rider
- [ ] Test: Super Admin cannot be changed
- [ ] Test: Role change is logged in role_change_logs

### Feed Management:
- [ ] Execute `create-feeds-table.sql`
- [ ] Add organization_id column to feeds
- [ ] Setup RLS policies
- [ ] Test: Admin can create feed with text
- [ ] Test: Admin can upload image
- [ ] Test: Admin can embed YouTube video
- [ ] Test: Rider can view feeds
- [ ] Test: Feed notification works

### Orphan Stock Cleanup:
- [ ] Execute `fix-orphan-rider-stock.sql`
- [ ] Test: Delete product shows affected riders
- [ ] Test: Confirm deletion removes rider_stock
- [ ] Test: Products without riders delete normally

---

## 🎯 Integration with Current Project

### Settings Page Integration Options:

**Option 1: Keep Current Structure (Recommended)**
- Our Settings.tsx has user management built-in
- Already uses RPC function `get_organization_users()`
- Multi-tenant aware

**Option 2: Use New Tab Components**
- Import ManageUsersTab into Settings.tsx
- Add Tabs UI for better organization
- Requires refactoring Settings.tsx

**Recommended:** Keep current Settings.tsx, but extract role change logic from ManageUsersTab and add to our Settings.tsx.

---

## 📝 Next Steps

1. **Execute SQL files** in order (with organization_id modifications)
2. **Update Settings.tsx** to add role change button:
   ```tsx
   <Button 
     variant="secondary" 
     size="sm"
     onClick={() => handleRoleChange(user.user_id, user.role)}
     title={user.role === "admin" ? "Change to Rider" : "Change to Admin"}
   >
     {user.role === "admin" ? <Shield /> : <ShieldCheck />}
   </Button>
   ```
3. **Test all features** in multi-tenant context
4. **Update OrganizationSettings** to include Feed Management tab
5. **Documentation:** Update user guides with new features

---

## 🚀 Benefits

- ✅ Role management without needing super admin
- ✅ Feed/notification system for riders
- ✅ Better data consistency (orphan stock cleanup)
- ✅ Enhanced video support in feeds
- ✅ Audit trail for role changes

---

## 📚 Related Files

### Source Repository Files:
- Commits: e53ea8f, 325f881, c1ef52b, 9fd823b, 2b90268, e4c7958
- See: CHANGELOG-v1.1.0.md in source repo

### Current Project Context:
- Multi-tenant: organizations, subscription_plans, RLS policies
- Super Admin: Can manage all organizations
- Organization Admin: Can manage their org users
- Public Signup: New organizations can self-register

---

## ⚠️ Breaking Changes

**None** - All changes are additive. Existing functionality remains intact.

---

**Merge Completed By:** GitHub Copilot
**Date:** November 14, 2025
**Status:** ✅ Files Copied, SQL Ready, Testing Pending
