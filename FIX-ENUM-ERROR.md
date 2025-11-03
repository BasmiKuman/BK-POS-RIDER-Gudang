# 🔧 FIX: Error "unsafe use of new value super_admin"

## ❌ Error Yang Muncul:
```
ERROR: 55P04: unsafe use of new value "super_admin" of enum type app_role
HINT: New enum values must be committed before they can be used.
```

## ✅ Solusi:

PostgreSQL tidak bisa langsung menggunakan enum value baru dalam transaction yang sama. 
Kita harus **pisahkan menjadi 2 query terpisah**.

---

## 📋 Langkah-langkah Perbaikan:

### Step 1: Execute PART 1 (Add Enum Value)

**File:** `EXECUTE-TODO-1.sql`

1. Buka file `EXECUTE-TODO-1.sql`
2. Copy isinya (hanya 1 baris ALTER TYPE)
3. Paste di Supabase SQL Editor
4. **Run**
5. **Tunggu sampai selesai** (akan muncul "Success")

**SQL yang dijalankan:**
```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
```

---

### Step 2: Execute PART 2 (Create Tables & Functions)

**File:** `EXECUTE-TODO-1-PART-2.sql`

1. **BUKA SQL EDITOR BARU** (jangan di query yang sama!)
2. Buka file `EXECUTE-TODO-1-PART-2.sql`
3. Copy **SEMUA** isinya
4. Paste di SQL Editor (yang baru)
5. **Run**

**Isi Part 2:**
- Create table `organizations`
- Create table `subscription_plans` + insert 4 plans
- Create table `subscription_history`
- Create table `organization_invitations`
- Add kolom `organization_id` ke semua tabel
- Create functions & RLS policies

---

## ✅ Verification

Setelah kedua query berhasil, verifikasi dengan:

```sql
-- Check enum super_admin sudah ada
SELECT unnest(enum_range(NULL::app_role));

-- Check tabel organizations ada
SELECT * FROM public.organizations;

-- Check subscription plans ada
SELECT * FROM public.subscription_plans;
```

**Expected Results:**
- Enum `app_role` punya value: `admin`, `rider`, `super_admin`
- Tabel `organizations` kosong tapi exist
- Tabel `subscription_plans` punya 4 rows (free, basic, pro, enterprise)

---

## 🎯 Next Steps

Setelah PART 1 & PART 2 sukses:
- ✅ TODO #1: COMPLETED
- ➡️ Lanjut ke TODO #2: Set user sebagai Super Admin

---

**Files:**
- Part 1: `EXECUTE-TODO-1.sql` (16 lines)
- Part 2: `EXECUTE-TODO-1-PART-2.sql` (309 lines)
