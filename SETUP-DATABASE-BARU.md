# 🗄️ Setup Database Supabase Baru

## ✅ Konfigurasi Telah Diupdate

Project ini sudah dikonfigurasi untuk menggunakan database Supabase baru:

**URL:** `https://nqkziafaofdejhuqwtul.supabase.co`

File yang sudah diupdate:
- ✅ `.env`
- ✅ `.env.example`
- ✅ `.env.local`
- ✅ `src/integrations/supabase/client.ts`

---

## 📋 Langkah-langkah Setup Database

### 1️⃣ Buka Supabase SQL Editor

Klik link berikut untuk membuka SQL Editor:
👉 **[Buka Supabase SQL Editor](https://supabase.com/dashboard/project/nqkziafaofdejhuqwtul/sql/new)**

### 2️⃣ Copy SQL Setup Lengkap

Buka file yang sudah di-generate:
```bash
COMPLETE-DATABASE-SETUP.sql
```

File ini berisi **semua migrations** yang diperlukan untuk membuat:
- ✅ Tables (profiles, products, categories, transactions, dll)
- ✅ Functions (has_role, handle_new_user, dll)
- ✅ Triggers (auto-update timestamps, auto-create profile)
- ✅ RLS Policies (Row Level Security)
- ✅ Indexes (untuk performance)

### 3️⃣ Paste & Run di SQL Editor

1. Copy **SEMUA** isi dari file `COMPLETE-DATABASE-SETUP.sql`
2. Paste ke SQL Editor di Supabase Dashboard
3. Klik tombol **"Run"** atau tekan `Ctrl + Enter`

### 4️⃣ Verifikasi Setup

Setelah SQL berhasil dijalankan, cek:

1. **Table Editor** - Pastikan semua tabel sudah terbuat:
   - profiles
   - user_roles
   - categories
   - products
   - rider_stock
   - distributions
   - returns
   - transactions
   - transaction_items
   - tax_settings
   - production_history
   - gps_settings

2. **Authentication** - Settings:
   - Enable Email provider
   - Configure redirect URLs (optional)

3. **Storage** (Optional):
   - Buat bucket `avatars` untuk foto profil user
   - Enable public access jika diperlukan

---

## 🔧 Struktur Database

### Core Tables

#### `profiles`
Menyimpan informasi profil user
- `id`, `user_id`, `full_name`, `avatar_url`, `phone`

#### `user_roles`
Menyimpan role user (admin/rider)
- `id`, `user_id`, `role`

#### `categories`
Kategori produk
- `id`, `name`, `description`

#### `products`
Data produk
- `id`, `name`, `category_id`, `price`, `stock_in_warehouse`, `image_url`, `sku`

#### `rider_stock`
Stok produk di tangan rider
- `id`, `rider_id`, `product_id`, `quantity`

#### `distributions`
History distribusi produk dari admin ke rider
- `id`, `product_id`, `rider_id`, `admin_id`, `quantity`

#### `returns`
History return produk dari rider ke gudang
- `id`, `product_id`, `rider_id`, `quantity`

#### `transactions`
Transaksi penjualan
- `id`, `rider_id`, `subtotal`, `tax_amount`, `total_amount`

#### `transaction_items`
Detail item dalam transaksi
- `id`, `transaction_id`, `product_id`, `quantity`, `price`

---

## 🔐 Security (RLS Policies)

Database ini menggunakan Row Level Security (RLS) untuk memastikan:

- ✅ Rider hanya bisa melihat stok & transaksi sendiri
- ✅ Admin bisa melihat semua data
- ✅ User hanya bisa update profil sendiri
- ✅ Hanya admin yang bisa manage products, categories, dan distribute stock

---

## 👤 Admin Setup

Setelah database setup selesai, buat user admin:

### Option 1: Via SQL (Recommended)

```sql
-- Ganti email dengan email admin Anda
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'fadlannafian@gmail.com'
);
```

### Option 2: Via Authentication Dashboard

1. Buat user baru via Auth → Users
2. Copy User ID
3. Insert ke `user_roles` table dengan role 'admin'

---

## 🧪 Test Connection

Setelah semua setup selesai, test koneksi:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Coba login dengan user yang sudah dibuat. Jika berhasil, berarti database sudah terkoneksi dengan benar! 🎉

---

## 📝 Notes

- ⚠️ Database baru ini **terpisah** dari database lama (mlwvrqjsaomthfcsmoit)
- ✅ Semua data mulai dari awal (clean slate)
- ✅ Struktur tabel sama dengan project sebelumnya
- ✅ Bisa develop tanpa khawatir merusak data production lama

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
- Pastikan semua SQL di `COMPLETE-DATABASE-SETUP.sql` sudah di-run
- Check di Table Editor apakah tabel sudah terbuat

### Error: "JWT expired" atau "Invalid API key"
- Double check `.env` file
- Pastikan URL dan API key sudah benar
- Restart development server

### Error: "Row Level Security policy violation"
- Pastikan RLS policies sudah di-apply
- Check user role di table `user_roles`

---

## 📞 Support

Jika ada masalah, check:
1. Supabase Dashboard → Logs
2. Browser Console (F12)
3. File README.md di root project

---

**Happy Coding! 🚀**
