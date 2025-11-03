# Troubleshooting: Super Admin Access Denied

## 🔴 Masalah yang Terjadi

User dengan email `fadlannafian@gmail.com` tidak bisa akses halaman `/super-admin` meskipun sudah di-set sebagai super_admin di database.

**Symptoms:**
- Login sebagai rider (bukan super_admin)
- Akses ke `/super-admin` menampilkan "Access Denied"
- Console browser mungkin menunjukkan error role check

---

## 🔍 Root Cause Analysis

### 1. **RLS Policy Issue**
Table `user_roles` mungkin tidak memiliki RLS policy yang benar, sehingga user tidak bisa query role mereka sendiri.

### 2. **Role Not Updated in Database**
Kemungkinan query UPDATE di `EXECUTE-TODO-2.sql` tidak ter-execute dengan benar.

### 3. **Caching Issue**
Frontend mungkin cache role lama dari session sebelumnya.

---

## ✅ Solusi (Step by Step)

### **STEP 1: Execute Fix SQL**

Buka **Supabase SQL Editor** dan jalankan file:
```
FIX-SUPER-ADMIN-ACCESS.sql
```

File ini akan:
1. ✅ Verify role user saat ini
2. ✅ Update role ke `super_admin`
3. ✅ Fix RLS policies untuk `user_roles` table
4. ✅ Verify update berhasil

**Expected Output:**
```
| email                    | role        | status         |
|-------------------------|-------------|----------------|
| fadlannafian@gmail.com  | super_admin | ✅ Super Admin |
```

---

### **STEP 2: Clear Browser Cache & Logout**

1. Logout dari aplikasi
2. Clear browser cache (Ctrl + Shift + Delete)
3. Close all browser tabs
4. Buka aplikasi lagi di fresh tab

---

### **STEP 3: Login Ulang**

1. Login dengan `fadlannafian@gmail.com`
2. Buka Console Browser (F12)
3. Perhatikan log: harus muncul `"User role: super_admin"`

---

### **STEP 4: Test Akses Super Admin**

1. Navigate ke `/super-admin`
2. Seharusnya langsung masuk ke Super Admin Dashboard
3. Lihat:
   - Total Organizations
   - Active Subscriptions
   - Total Revenue
   - Trial Organizations
   - Organization List Table

---

## 🔧 Technical Changes Made

### 1. **Updated ProtectedRoute.tsx**
```typescript
// OLD: Menggunakan RPC has_role (bisa error)
const { data } = await supabase.rpc('has_role', {
  _user_id: userId,
  _role: 'super_admin'
});

// NEW: Direct query ke user_roles table
const { data: roleData } = await supabase
  .from("user_roles")
  .select("role")
  .eq("user_id", userId)
  .maybeSingle();

setIsSuperAdmin(roleData?.role === 'super_admin');
setIsAdmin(roleData?.role === 'admin' || roleData?.role === 'super_admin');
```

**Why?** 
- Lebih reliable
- Tidak depend on RPC function
- Langsung dari source of truth

### 2. **Fixed RLS Policy**
```sql
CREATE POLICY "Users can view their own role"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Why?**
- Memastikan setiap user bisa query role mereka sendiri
- Tanpa ini, frontend tidak bisa cek role

### 3. **Updated TypeScript Types**
```typescript
// Added to src/integrations/supabase/types.ts
app_role: "admin" | "rider" | "super_admin"
```

**Why?**
- TypeScript harus recognize 'super_admin' sebagai valid enum value
- Tanpa ini, compilation error

---

## 📋 Verification Checklist

Setelah execute fix, pastikan:

- [ ] SQL query menunjukkan role = 'super_admin'
- [ ] Browser console log: `"User role: super_admin"`
- [ ] Bisa akses `/super-admin` tanpa redirect
- [ ] Dashboard menampilkan stats dan organization list
- [ ] Tidak ada error di browser console
- [ ] Navigation menu menunjukkan "Super Admin" option

---

## 🚨 If Still Not Working

### Check 1: Verify di Database
```sql
SELECT email, role 
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE email = 'fadlannafian@gmail.com';
```

Harus return: `role = super_admin`

### Check 2: Browser Console
Cek ada error message:
- "Role check error" → RLS policy issue
- "Access Denied" → Role tidak match

### Check 3: Network Tab
1. Buka Network tab di DevTools
2. Filter: `user_roles`
3. Cek response: harus ada `role: "super_admin"`

### Check 4: Hard Refresh
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

---

## 📞 Additional Support

Jika masih bermasalah, check:

1. **Supabase Dashboard** → Authentication → Users
   - Pastikan email confirmed
   - User ID match dengan user_roles

2. **Supabase Dashboard** → Table Editor → user_roles
   - Manual check row untuk user ini
   - Pastikan tidak ada duplicate rows

3. **Browser Console Logs**
   - Copy semua error messages
   - Share untuk debugging

---

## ✨ Success Indicators

Ketika berhasil, kamu akan lihat:

1. **Login Screen** → Login as super_admin
2. **Dashboard** → Shows Super Admin Dashboard with stats
3. **URL** → `/super-admin` (no redirect)
4. **Console** → `"User role: super_admin"`
5. **Access** → All super admin features unlocked

---

**Last Updated:** November 3, 2025
**Status:** 🟢 SOLVED
