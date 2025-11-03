# Setup Dummy Data - Multi-Tenant SaaS

## 📋 Overview

File ini untuk generate dummy organizations dan subscription data supaya bisa test Super Admin Dashboard dengan data yang realistis.

---

## 🔄 Execution Order (PENTING!)

Execute SQL files dalam urutan ini di **Supabase SQL Editor**:

### **1️⃣ Setup RLS Policies (WAJIB DULU!)**
File: `setup-multi-tenant-rls.sql`

**Purpose:** Set up Row Level Security policies untuk:
- ✅ `organizations` table
- ✅ `subscription_plans` table
- ✅ `subscription_history` table
- ✅ `organization_invitations` table

**What it does:**
- Super admin bisa CRUD semua data
- Regular users hanya bisa view data organization mereka
- Everyone bisa view subscription plans (untuk pilih plan)

**Expected Output:**
```
16 policies created successfully
✅ organizations - 4 policies
✅ subscription_plans - 4 policies
✅ subscription_history - 3 policies
✅ organization_invitations - 3 policies
```

---

### **2️⃣ Generate Dummy Data**
File: `generate-dummy-data.sql`

**Purpose:** Create 8 dummy organizations dengan berbagai status

**What it creates:**

#### **Organizations Created:**

1. **Toko Kelontong Jaya** 
   - Plan: Free (Trial)
   - Status: Trial
   - Expires: 14 days from now
   - Active: Yes

2. **Warung Mbok Sri**
   - Plan: Basic (Rp 99k)
   - Status: Active (Paid)
   - Expires: 15 days from now
   - Active: Yes

3. **Minimarket Sumber Rezeki**
   - Plan: Pro (Rp 299k)
   - Status: Active (Paid)
   - Expires: 45 days from now
   - Active: Yes

4. **Supermarket Keluarga Sejahtera**
   - Plan: Enterprise (Rp 999k)
   - Status: Active (Paid)
   - Expires: 335 days from now
   - Active: Yes

5. **Toko Bangunan Maju**
   - Plan: Free
   - Status: Expired
   - Expired: 6 days ago
   - Active: No

6. **Warung Pak Budi**
   - Plan: Basic
   - Status: Cancelled
   - Cancelled: 30 days ago
   - Active: No

7. **Toko Elektronik Digital**
   - Plan: Basic
   - Status: Active (Almost Expired!)
   - Expires: 2 days from now
   - Active: Yes

8. **Apotek Sehat Sentosa**
   - Plan: Pro
   - Status: Active (Baru Join)
   - Expires: 27 days from now
   - Active: Yes

**Subscription History:** Auto-generated untuk setiap organization

---

## 📊 Expected Results

### **After Step 1 (RLS Setup):**
```sql
| tablename                  | policyname                              | command |
|----------------------------|-----------------------------------------|---------|
| organizations              | Enable read access for organizations    | SELECT  |
| organizations              | Super admin can insert organizations    | INSERT  |
| organizations              | Super admin can update organizations    | UPDATE  |
| organizations              | Super admin can delete organizations    | DELETE  |
| subscription_plans         | Enable read access for subscription plans | SELECT |
| subscription_plans         | Super admin can insert plans            | INSERT  |
| ...                        | ...                                     | ...     |
```

### **After Step 2 (Dummy Data):**
```sql
| name                           | plan       | status    | expires    | status_indicator |
|--------------------------------|------------|-----------|------------|------------------|
| Apotek Sehat Sentosa          | Pro        | active    | 2025-11-30 | ✅ ACTIVE        |
| Toko Elektronik Digital       | Basic      | active    | 2025-11-05 | ⚠️ EXPIRING SOON |
| Warung Pak Budi               | Basic      | cancelled | 2025-10-04 | ⚠️ EXPIRED       |
| Toko Bangunan Maju            | Free       | expired   | 2025-10-28 | ⚠️ EXPIRED       |
| Supermarket Keluarga Sejahtera| Enterprise | active    | 2026-10-04 | ✅ ACTIVE        |
| Minimarket Sumber Rezeki      | Pro        | active    | 2025-12-18 | ✅ ACTIVE        |
| Warung Mbok Sri               | Basic      | active    | 2025-11-18 | ✅ ACTIVE        |
| Toko Kelontong Jaya           | Free       | trial     | 2025-11-17 | ✅ ACTIVE        |
```

**Summary Stats:**
```
📊 SUMMARY
- Total Organizations: 8
- Active: 5
- Trial: 1
- Paid: 4
- Expired: 1
- Cancelled: 1

💰 REVENUE
- Total Payments: 8
- Paid: 4
- Total Revenue: Rp 1,397,000
- Pending: Rp 99,000
```

---

## 🧪 Testing Checklist

After executing both SQL files, test di aplikasi:

### **Super Admin Dashboard** (`/super-admin`)

- [ ] Stats cards menunjukkan angka yang benar:
  - Total Organizations: 8
  - Active Subscriptions: 4-5
  - Revenue: ~Rp 1,397,000
  - Trial Organizations: 1

- [ ] Organization table shows all 8 organizations
- [ ] Status badges berwarna benar (Active, Trial, Expired, Cancelled)
- [ ] Plan badges berwarna benar (Free, Basic, Pro, Enterprise)
- [ ] Click organization row → navigate ke detail

### **Organization Detail** (click any org)

- [ ] Overview tab shows correct info
- [ ] Stats cards show 0 users, 0 products (belum ada dummy users/products)
- [ ] Resource usage progress bars visible
- [ ] Billing History tab shows subscription record
- [ ] Payment status correct (Paid, Pending, Free, Failed)

### **Create Organization** (`/super-admin/create-organization`)

- [ ] Subscription plan dropdown shows 4 plans
- [ ] Plan details visible (price, limits)
- [ ] Can create new organization
- [ ] Auto-redirect to dashboard after create

---

## 🔧 Troubleshooting

### **Issue: No data visible di dashboard**

**Check 1:** RLS policies sudah dijalankan?
```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename = 'organizations';
```
Should return 4 policies.

**Check 2:** Data sudah ter-insert?
```sql
SELECT COUNT(*) FROM public.organizations;
```
Should return 8.

**Check 3:** User masih super_admin?
```sql
SELECT role FROM user_roles 
WHERE user_id = auth.uid();
```
Should return 'super_admin'.

---

### **Issue: "Access Denied" error**

**Solution:** Re-execute `setup-multi-tenant-rls.sql`

RLS policies mungkin blocking akses. Pastikan policy untuk super_admin sudah ada:
```sql
EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'super_admin'
)
```

---

### **Issue: Error saat insert dummy data**

**Error:** `foreign key violation`

**Solution:** Subscription plans belum ada. Execute `EXECUTE-TODO-1-PART-2.sql` dulu.

---

## 🗑️ Cleanup (Reset Data)

Jika mau hapus semua dummy data dan mulai fresh:

```sql
-- Delete subscription history
DELETE FROM public.subscription_history;

-- Delete organizations
DELETE FROM public.organizations;

-- Verify
SELECT COUNT(*) FROM public.organizations; -- Should return 0
```

Then re-run `generate-dummy-data.sql`.

---

## 📝 Notes

- Dummy data ini **tidak include users & products** di each organization
- Hanya populate organizations & subscription records
- Users & products bisa ditambahkan manual atau dengan script terpisah
- Semua dates relative (NOW() based) jadi selalu up-to-date

---

## ✅ Success Indicators

Kamu tahu berhasil jika:

1. ✅ Dashboard shows 8 organizations
2. ✅ Different subscription statuses visible (trial, active, expired, cancelled)
3. ✅ Revenue total ~Rp 1.4 juta
4. ✅ Can click any organization to see details
5. ✅ Billing history shows payment records
6. ✅ No "Access Denied" errors

---

**Happy Testing!** 🚀
