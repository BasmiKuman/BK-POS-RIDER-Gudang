import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, CreditCard, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  max_riders: number;
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    max_riders: 0,
    features: ["POS Dasar", "Warehouse Management", "Laporan Dasar", "1 Admin"]
  },
  {
    id: "basic",
    name: "Basic",
    price: 99000,
    max_riders: 5,
    features: ["Semua fitur Free", "5 Riders", "GPS Tracking", "Email Support"]
  },
  {
    id: "pro",
    name: "Pro",
    price: 299000,
    max_riders: 20,
    features: ["Semua fitur Basic", "20 Riders", "Advanced Reports", "Production Tracking", "Priority Support"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999000,
    max_riders: -1, // unlimited
    features: ["Semua fitur Pro", "Unlimited Riders", "API Access", "White-label App", "Dedicated Support"]
  }
];

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Warung Makan / Restaurant" },
  { value: "retail", label: "Toko Retail" },
  { value: "distribution", label: "Distributor" },
  { value: "cafe", label: "Cafe / Coffee Shop" },
  { value: "grocery", label: "Toko Kelontong" },
  { value: "pharmacy", label: "Apotek" },
  { value: "other", label: "Lainnya" }
];

export default function PublicSignup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1: Organization Info
  const [organizationName, setOrganizationName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Subscription Plan
  const [selectedPlan, setSelectedPlan] = useState("free");

  // Step 3: Admin Account
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleNext = () => {
    if (step === 1) {
      if (!organizationName || !businessType || !email || !phone) {
        toast.error("Mohon lengkapi semua field");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        toast.error("Format email tidak valid");
        return;
      }
    }

    if (step === 3) {
      if (!fullName || !password || !confirmPassword) {
        toast.error("Mohon lengkapi semua field");
        return;
      }
      if (password.length < 6) {
        toast.error("Password minimal 6 karakter");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Password tidak cocok");
        return;
      }
    }

    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // 1. Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create user");

      // 2. Call RPC function to create organization (bypasses RLS)
      const { data: orgId, error: orgError } = await supabase.rpc('signup_organization' as any, {
        p_organization_name: organizationName,
        p_subscription_plan: selectedPlan,
        p_branding: getDefaultBranding(businessType),
        p_terminology: getDefaultTerminology(businessType),
        p_features: getDefaultFeatures(selectedPlan),
        p_dashboard_layout: {},
        p_report_templates: {},
        p_full_name: fullName,
        p_phone: phone,
        p_user_id: authData.user.id,
      });

      if (orgError) {
        console.error("Organization creation error:", orgError);
        throw new Error(orgError.message || "Failed to create organization");
      }

      if (!orgId) {
        throw new Error("Failed to get organization ID");
      }

      toast.success("Akun berhasil dibuat!");
      
      // If free plan, redirect to dashboard
      if (selectedPlan === "free") {
        toast.success("Selamat datang! Akun Free Anda sudah aktif");
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        // If paid plan, redirect to payment (implement later)
        toast.success("Silakan lanjutkan ke pembayaran");
        // navigate(`/payment?org_id=${orgId}&plan=${selectedPlan}`);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }

    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  // Helper functions for default settings
  const getDefaultBranding = (businessType: string) => {
    return {
      app_name: "BK POS",
      primary_color: "#3b82f6",
      secondary_color: "#8b5cf6",
      logo_url: null,
      favicon_url: null,
    };
  };

  const getDefaultTerminology = (businessType: string) => {
    if (businessType === "restaurant" || businessType === "cafe") {
      return {
        rider: "Kurir",
        warehouse: "Dapur",
        pos: "Kasir",
        product: "Menu",
        product_plural: "Menu",
        customer: "Pelanggan",
        order: "Pesanan",
        order_plural: "Pesanan",
        return: "Retur",
        report: "Laporan",
        report_plural: "Laporan",
        dashboard: "Dashboard",
        settings: "Pengaturan",
        rider_plural: "Kurir",
        warehouse_plural: "Dapur",
        customer_plural: "Pelanggan",
      };
    }
    // Default terminology
    return {
      rider: "Rider",
      warehouse: "Gudang",
      pos: "POS",
      product: "Produk",
      product_plural: "Produk",
      customer: "Pelanggan",
      order: "Transaksi",
      order_plural: "Transaksi",
      return: "Return",
      report: "Laporan",
      report_plural: "Laporan",
      dashboard: "Dashboard",
      settings: "Pengaturan",
      rider_plural: "Riders",
      warehouse_plural: "Gudang",
      customer_plural: "Pelanggan",
    };
  };

  const getDefaultFeatures = (plan: string) => {
    const baseFeatures = {
      pos: true,
      warehouse: true,
      reports: true,
      gps_tracking: false,
      production_tracking: false,
      low_stock_alerts: true,
      returns_management: true,
      weather_widget: false,
      advanced_reports: false,
      api_access: false,
      multi_currency: false,
      barcode_scanner: false,
      email_notifications: false,
      sms_notifications: false,
    };

    if (plan === "basic") {
      return { ...baseFeatures, gps_tracking: true, email_notifications: true };
    }
    if (plan === "pro") {
      return { 
        ...baseFeatures, 
        gps_tracking: true, 
        production_tracking: true,
        advanced_reports: true,
        email_notifications: true,
        barcode_scanner: true,
        weather_widget: true,
      };
    }
    if (plan === "enterprise") {
      return Object.keys(baseFeatures).reduce((acc, key) => ({ ...acc, [key]: true }), {});
    }

    return baseFeatures;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? "bg-primary text-white" : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`h-1 w-12 ${step > s ? "bg-primary" : "bg-gray-300"}`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-8 mt-3 text-sm">
            <span className={step >= 1 ? "text-primary font-medium" : "text-gray-500"}>Info Bisnis</span>
            <span className={step >= 2 ? "text-primary font-medium" : "text-gray-500"}>Paket</span>
            <span className={step >= 3 ? "text-primary font-medium" : "text-gray-500"}>Akun Admin</span>
            <span className={step >= 4 ? "text-primary font-medium" : "text-gray-500"}>Selesai</span>
          </div>
        </div>

        {/* Step 1: Organization Info */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Informasi Bisnis</CardTitle>
                  <CardDescription>Ceritakan tentang bisnis Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org_name">Nama Bisnis *</Label>
                <Input
                  id="org_name"
                  placeholder="Warung Makan Sederhana"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="business_type">Jenis Bisnis *</Label>
                <Select value={businessType} onValueChange={setBusinessType}>
                  <SelectTrigger id="business_type">
                    <SelectValue placeholder="Pilih jenis bisnis" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Admin *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@warungsederhana.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="08123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <Button onClick={handleNext} className="w-full" size="lg">
                Lanjutkan
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Choose Plan */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Pilih Paket Langganan</CardTitle>
                  <CardDescription>Pilih paket yang sesuai dengan kebutuhan bisnis Anda</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {SUBSCRIPTION_PLANS.map((plan) => (
                    <div
                      key={plan.id}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                        selectedPlan === plan.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      <div className="flex items-start gap-3">
                        <RadioGroupItem value={plan.id} id={plan.id} />
                        <div className="flex-1">
                          <Label htmlFor={plan.id} className="text-lg font-semibold cursor-pointer">
                            {plan.name}
                          </Label>
                          <p className="text-2xl font-bold mt-2">
                            {plan.price === 0 ? (
                              "Gratis"
                            ) : (
                              <>Rp {plan.price.toLocaleString("id-ID")}<span className="text-sm font-normal text-muted-foreground">/bulan</span></>
                            )}
                          </p>
                          <ul className="mt-3 space-y-2 text-sm">
                            {plan.features.map((feature, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Kembali
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Lanjutkan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Admin Account */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Buat Akun Admin</CardTitle>
              <CardDescription>Akun ini akan menjadi admin utama untuk {organizationName}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimal 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmasi Password *</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Ulangi password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Kembali
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Lanjutkan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Review & Konfirmasi</CardTitle>
              <CardDescription>Pastikan semua informasi sudah benar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground">Nama Bisnis</Label>
                  <p className="text-lg font-semibold">{organizationName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Jenis Bisnis</Label>
                  <p className="text-lg font-semibold">
                    {BUSINESS_TYPES.find(t => t.value === businessType)?.label}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Email Admin</Label>
                  <p className="text-lg font-semibold">{email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Paket Langganan</Label>
                  <p className="text-lg font-semibold">
                    {SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.name} -{" "}
                    {selectedPlan === "free" 
                      ? "Gratis" 
                      : `Rp ${SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan)?.price.toLocaleString("id-ID")}/bulan`
                    }
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  {selectedPlan === "free" ? (
                    "✅ Akun Free Anda akan langsung aktif setelah registrasi"
                  ) : (
                    "⚠️ Akun Anda akan aktif setelah melakukan pembayaran"
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleBack} variant="outline" className="flex-1">
                  Kembali
                </Button>
                <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Membuat Akun...
                    </>
                  ) : (
                    "Buat Akun"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Sudah punya akun?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Login di sini
          </a>
        </p>
      </div>
    </div>
  );
}
