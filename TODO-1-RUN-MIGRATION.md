# ✅ TODO #1: Run Migration SQL Multi-Tenant ke Database

## 📋 Langkah-langkah:

### 1. Buka Supabase SQL Editor
👉 [Klik di sini untuk buka SQL Editor](https://supabase.com/dashboard/project/nqkziafaofdejhuqwtul/sql/new)

### 2. Copy SQL Migration File
File yang harus di-copy: `supabase/migrations/20251103_add_multi_tenant_saas.sql`

**Total Lines:** 310 baris
**Content:** 
- Table `organizations` (untuk tenant/bisnis)
- Table `subscription_plans` (paket Free, Basic, Pro, Enterprise)
- Table `subscription_history` (tracking pembayaran)
- Table `organization_invitations` (invite user)
- Kolom `organization_id` ditambahkan ke semua tabel existing
- Role `super_admin` ditambahkan
- Functions & RLS policies untuk multi-tenant

### 3. Paste di SQL Editor
- Buka file: `supabase/migrations/20251103_add_multi_tenant_saas.sql`
- Select All (Ctrl+A)
- Copy (Ctrl+C)
- Paste di Supabase SQL Editor
- Klik **"Run"** atau tekan **Ctrl+Enter**

### 4. Verifikasi Setup Berhasil

Setelah SQL selesai dijalankan, cek apakah tabel-tabel baru sudah ada:

```sql
-- Cek tabel organizations
SELECT * FROM public.organizations;

-- Cek subscription plans
SELECT * FROM public.subscription_plans;

-- Cek kolom organization_id sudah ada di profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'organization_id';
```

### 5. Expected Results

✅ Tabel `organizations` terbuat
✅ Tabel `subscription_plans` terbuat dengan 4 plans (free, basic, pro, enterprise)
✅ Tabel `subscription_history` terbuat
✅ Tabel `organization_invitations` terbuat
✅ Kolom `organization_id` sudah ada di semua tabel (profiles, products, categories, dll)
✅ Role `super_admin` sudah ditambahkan ke enum `app_role`

---

## 🐛 Troubleshooting

**Error: "type app_role already has value super_admin"**
- Aman, skip saja. Artinya role sudah ada.

**Error: "column organization_id already exists"**
- Aman, skip saja. Artinya kolom sudah ada.

**Error: relation already exists**
- Tabel sudah ada, bisa skip atau drop dulu tabelnya.

---

## ✅ Setelah Selesai

Mark todo #1 sebagai **COMPLETED** dan lanjut ke **TODO #2**: Set user sebagai Super Admin

---

**Status:** 🔄 IN PROGRESS
**File:** `supabase/migrations/20251103_add_multi_tenant_saas.sql`
**Lines:** 310
