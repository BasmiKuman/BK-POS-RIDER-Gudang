# 🎯 QUICK START - Setup Database Baru

## ✅ Yang Sudah Selesai

1. ✅ **Konfigurasi Supabase** sudah diupdate ke database baru
2. ✅ **Migration SQL** sudah di-generate (787 baris)
3. ✅ **Dokumentasi lengkap** sudah dibuat

---

## 🚀 Yang Perlu Anda Lakukan Sekarang

### Step 1: Buka SQL Editor
👉 [Klik di sini untuk buka Supabase SQL Editor](https://supabase.com/dashboard/project/nqkziafaofdejhuqwtul/sql/new)

### Step 2: Copy & Paste SQL
1. Buka file: `COMPLETE-DATABASE-SETUP.sql` (787 baris)
2. **CTRL+A** untuk select all
3. **CTRL+C** untuk copy
4. Paste di SQL Editor Supabase
5. Klik **"Run"** atau tekan **CTRL+Enter**

### Step 3: Tunggu Eksekusi Selesai
⏱️ Proses biasanya memakan waktu 10-30 detik

### Step 4: Verifikasi
Check di **Table Editor** apakah tabel-tabel ini sudah ada:
- ✅ profiles
- ✅ user_roles  
- ✅ categories
- ✅ products
- ✅ rider_stock
- ✅ distributions
- ✅ returns
- ✅ transactions
- ✅ transaction_items
- ✅ tax_settings
- ✅ production_history
- ✅ gps_settings

---

## 📂 File-File Penting

| File | Deskripsi |
|------|-----------|
| `COMPLETE-DATABASE-SETUP.sql` | **SQL lengkap untuk setup database** (paste ini di SQL Editor) |
| `SETUP-DATABASE-BARU.md` | Dokumentasi detail lengkap |
| `.env` | Konfigurasi environment (sudah diupdate) |
| `.env.local` | Konfigurasi local dengan service role key |

---

## 🔑 Credentials Database Baru

```
URL: https://nqkziafaofdejhuqwtul.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...Z4HfPEcmEi3tOZ2bkuPSE70vGMAzjs1gdvelrvW0XOI
Service Role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...bM_0oK46DqkB0PSuUXfWZGvwV-TYhdWXR53jWWSjB1Y
```

---

## 👤 Setelah Database Setup

### Buat Admin User

Setelah database setup selesai, jalankan SQL ini untuk set user sebagai admin:

```sql
-- Ganti email dengan email admin Anda
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'fadlannafian@gmail.com'
);
```

---

## 🧪 Test Aplikasi

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Buka browser dan test:
1. Register user baru
2. Login
3. Check apakah data terload

---

## ❓ Troubleshooting

**Error saat run SQL?**
- Pastikan semua SQL di-paste dengan benar
- Run ulang jika ada error

**Database tidak connect?**
- Check `.env` file
- Restart dev server (`npm run dev`)

**Tabel tidak muncul?**
- Refresh Table Editor
- Check di SQL Editor apakah ada error

---

## 📚 Dokumentasi Lengkap

Baca file `SETUP-DATABASE-BARU.md` untuk:
- Penjelasan struktur database
- Security & RLS policies
- Troubleshooting detail
- Dan lainnya

---

**Selamat! Database baru Anda siap digunakan! 🎉**
