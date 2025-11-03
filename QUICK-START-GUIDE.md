# 🚀 Quick Start Guide - Multi-Tenant SaaS BK POS

## **Arsitektur yang Sudah Dibangun**

✅ **Multi-Tenant Database** (Organizations, Subscriptions, Custom Settings)  
✅ **Super Admin Dashboard** (Manage all organizations)  
✅ **Organization Customization** (White-label: branding, terminology, features)  
✅ **Public Signup Flow** (4-step wizard untuk calon pelanggan)  
✅ **Dynamic Terminology** (Semua halaman sudah responsive terhadap custom terms)  

---

## **📱 Untuk User Biasa (Rider/Staff)**

### **Cara Login:**

1. **Download aplikasi** (saat ini: web app, nanti: Android APK)
2. **Buka** `https://your-app.com`
3. **Login** dengan email & password yang diberikan admin
4. **Otomatis masuk** ke organization mereka

### **Flow:**

```
User buka app
  ↓
Login dengan email/password
  ↓
System auto-detect organization_id dari profiles table
  ↓
Load organization settings (branding, terminology)
  ↓
Apply customization (logo, colors, custom terms)
  ↓
Dashboard muncul sesuai role (Rider/Admin/Warehouse)
```

**User TIDAK PERLU tahu tentang subscription atau organization** - semuanya otomatis!

---

## **🏢 Untuk Calon Pelanggan Baru (Organization Owner)**

### **Cara Daftar:**

1. **Buka** `https://your-app.com/signup`
2. **Isi informasi bisnis:**
   - Nama bisnis: "Warung Makan Sederhana"
   - Jenis bisnis: Restaurant
   - Email & phone
3. **Pilih paket langganan:**
   - Free (Rp 0/bulan)
   - Basic (Rp 99k/bulan)
   - Pro (Rp 299k/bulan)
   - Enterprise (Rp 999k/bulan)
4. **Buat akun admin** (nama, password)
5. **Review & submit**
6. **Akun langsung aktif!** (jika Free) atau **lanjut ke pembayaran** (jika paid plan)

### **Setelah Signup:**

```
Organization baru terbuat
  ↓
Admin login pertama kali
  ↓
Redirect ke onboarding (opsional - belum diimplementasi)
  ↓
Admin bisa:
  - Customize branding (logo, colors)
  - Customize terminology (rider→kurir, warehouse→dapur)
  - Enable/disable features
  - Invite team members (rider, warehouse staff)
```

---

## **👨‍💼 Untuk Super Admin**

### **Cara Login:**

1. Login dengan email: `fadlannafian@gmail.com`
2. Otomatis redirect ke `/super-admin` dashboard
3. Bisa manage semua organizations

### **Fitur Super Admin:**

- ✅ Lihat semua organizations (8 dummy data sudah ada)
- ✅ Create new organization manual
- ✅ View organization detail (users, products, billing history)
- ✅ Customize organization settings (branding, terminology, features)
- ✅ Manage subscription plans (edit pricing, limits, features)
- ✅ View revenue statistics

---

## **🎨 Customization System**

### **Cara Customize Organization:**

1. **Login sebagai Super Admin** atau **Admin Organization**
2. **Buka Organization Detail** → klik "Customize"
3. **5 Tab tersedia:**

#### **Tab 1: Branding**
- App name
- Primary color
- Secondary color
- Logo URL

#### **Tab 2: Terminology** (16 terms)
```
Rider → Kurir / Sales / Driver
Warehouse → Dapur / Toko / Gudang
POS → Kasir / Penjualan
Product → Menu / Barang / Item
```

#### **Tab 3: Features** (14 toggles)
```
✅ POS
✅ Warehouse
✅ Reports
☐ GPS Tracking (Basic+ only)
☐ Production Tracking (Pro+ only)
☐ Advanced Reports (Pro+ only)
☐ API Access (Enterprise only)
```

#### **Tab 4: Dashboard Layout**
- Select widgets (sales summary, stock alerts, rider status, etc)
- Select chart types (line, bar, pie, area)
- Show/hide weather widget
- Show/hide GPS map
- Default view (overview/sales/inventory/riders)
- Auto-refresh interval

#### **Tab 5: Report Templates**
- Enable/disable 4 report types:
  - Sales Report (with customizable sections)
  - Stock Report
  - Rider Report
  - Financial Report

4. **Klik "Save Changes"**
5. **Refresh browser** → perubahan langsung terlihat!

---

## **💳 Subscription & Billing**

### **Paket Langganan:**

| Plan | Price/month | Max Riders | Features |
|------|-------------|------------|----------|
| Free | Rp 0 | 0 | Basic POS, Warehouse, Reports |
| Basic | Rp 99k | 5 | + GPS Tracking, Email Support |
| Pro | Rp 299k | 20 | + Advanced Reports, Production Tracking |
| Enterprise | Rp 999k | Unlimited | + API, White-label, Dedicated Support |

### **Payment Flow (Coming Soon):**

```
User pilih upgrade to Pro
  ↓
Redirect ke Midtrans payment page
  ↓
User bayar via QRIS/VA/Credit Card
  ↓
Midtrans webhook hit backend
  ↓
Update subscription_history table
  ↓
Update organization.subscription_plan = 'pro'
  ↓
Auto-enable Pro features
  ↓
Send confirmation email
```

---

## **📊 Database Schema (Simplified)**

```sql
-- Organizations (tenants)
organizations
  - id
  - name
  - subscription_plan (free/basic/pro/enterprise)
  - branding (JSONB: logo, colors, app_name)
  - terminology (JSONB: 16 customizable terms)
  - features (JSONB: 14 feature toggles)
  - dashboard_layout (JSONB)
  - report_templates (JSONB)

-- Users
profiles
  - user_id
  - organization_id  ← Link ke tenant
  - full_name
  - phone

user_roles
  - user_id
  - role (admin/rider/warehouse/super_admin)

-- Subscriptions
subscription_plans
  - id
  - name
  - price
  - max_riders
  - features

subscription_history
  - organization_id
  - plan
  - amount
  - status (pending/active/expired)
  - paid_at

-- Invitations
organization_invitations
  - organization_id
  - email
  - role
  - token
  - status (pending/accepted/expired)
```

---

## **🚀 Deployment Steps**

### **Phase 1: Testing (Current)**

1. ✅ Test di local development
2. ✅ Test public signup flow di `/signup`
3. ✅ Test customization system
4. ✅ Test dengan multiple dummy organizations

### **Phase 2: Production Deployment**

1. **Deploy ke Vercel:**
   ```bash
   npm run build
   vercel --prod
   ```

2. **Setup custom domain:**
   - Buy domain: `bkpos.id` or `bkpos.com`
   - Point DNS to Vercel
   - Enable SSL

3. **Configure environment:**
   ```env
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Setup email service:**
   - Resend.com or SendGrid
   - Configure email templates

5. **Setup payment gateway:**
   - Midtrans/Xendit account
   - Configure webhook URL

### **Phase 3: Mobile App**

1. **Build Android APK:**
   ```bash
   npm run build
   npx cap sync android
   npx cap open android
   # Build APK di Android Studio
   ```

2. **Upload to Play Store:**
   - Create developer account
   - Upload APK
   - Add screenshots, description
   - Publish

---

## **🎯 User Acquisition Strategy**

### **For Organizations:**

1. **Signup via website** (`/signup`)
2. **Choose subscription plan**
3. **Pay (if not free)**
4. **Account activated**
5. **Invite team members**

### **For Team Members (Riders/Staff):**

1. **Receive invitation email** from admin
2. **Click invitation link** with token
3. **Create password**
4. **Auto-join organization**
5. **Start using app**

### **Marketing Channels:**

- Google Ads (keyword: "aplikasi kasir", "software POS")
- Facebook/Instagram Ads (targeting UMKM)
- WhatsApp Business (direct sales)
- Content marketing (blog, YouTube)
- Partnership dengan supplier

---

## **📈 Success Metrics**

**First 3 Months Goals:**

- 50 organizations signed up
- 20% trial-to-paid conversion
- 10 active paying customers
- Rp 2-5 juta MRR
- < 5% monthly churn

---

## **🔧 Next Features to Build**

### **Priority 1 (Week 1-2):**
- [ ] Payment integration (Midtrans/Xendit)
- [ ] Email invitation system with token
- [ ] Onboarding wizard setelah signup
- [ ] Landing page (marketing site)

### **Priority 2 (Week 3-4):**
- [ ] Email notifications (welcome, payment, etc)
- [ ] Subscription expiry handling
- [ ] Trial period countdown
- [ ] Feature gating enforcement

### **Priority 3 (Month 2):**
- [ ] Advanced analytics dashboard
- [ ] API access untuk Enterprise
- [ ] White-label app builder
- [ ] Custom domain support

---

## **💡 Tips & Best Practices**

### **Untuk Testing:**

1. **Test dengan multiple accounts:**
   - Super admin: `fadlannafian@gmail.com`
   - Organization admin: buat di `/signup`
   - Rider: invite via organization settings

2. **Test customization:**
   - Ubah terminology jadi "Kurir", "Dapur", "Menu"
   - Ubah colors
   - Toggle features on/off
   - Refresh browser dan cek perubahan

3. **Test subscription limits:**
   - Free plan: coba invite rider (should fail if > 0)
   - Basic plan: coba access advanced reports (should be hidden)

### **Untuk Production:**

1. **Always backup database** before major changes
2. **Test payment flow** dengan Midtrans sandbox first
3. **Monitor error logs** (Sentry/LogRocket)
4. **Track analytics** (Google Analytics, Mixpanel)

---

## **❓ FAQ**

### **Q: Apakah setiap user harus signup sendiri?**
**A:** Tidak. Hanya organization owner yang signup via `/signup`. Team members (rider/staff) di-invite via email invitation.

### **Q: Bagaimana rider login?**
**A:** Rider buka app → login dengan email/password yang dibuat saat accept invitation → otomatis masuk ke organization mereka.

### **Q: Apakah bisa 1 user di multiple organizations?**
**A:** Saat ini tidak. 1 user = 1 organization. Tapi bisa diimplementasi jika dibutuhkan.

### **Q: Bagaimana cara downgrade/upgrade subscription?**
**A:** Admin masuk ke Organization Settings → Billing tab → pilih plan baru → bayar (jika upgrade) → otomatis aktif.

### **Q: Apakah rider perlu tahu tentang subscription?**
**A:** Tidak. Rider hanya login dan pakai app. Semua subscription management dihandle admin.

### **Q: Bagaimana kalau subscription expired?**
**A:** Auto-downgrade ke Free plan. Features yang premium akan disabled. Data tetap aman.

---

## **📞 Support**

**Technical Issues:**
- Check logs di browser console
- Check Supabase logs
- Open issue di GitHub

**Business Inquiries:**
- Email: support@bkpos.com
- WhatsApp: +62-xxx-xxx-xxxx

---

**Built with ❤️ by BK POS Team**
