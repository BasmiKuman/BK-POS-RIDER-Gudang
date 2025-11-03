import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  MapPin, 
  BarChart3, 
  Zap, 
  CheckCircle2, 
  TrendingUp,
  Smartphone,
  Cloud,
  Lock,
  Sparkles
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: ShoppingCart,
      title: "Point of Sale",
      description: "Sistem kasir modern & mudah digunakan untuk transaksi cepat"
    },
    {
      icon: Package,
      title: "Manajemen Gudang",
      description: "Kelola stok produk dengan real-time inventory tracking"
    },
    {
      icon: Users,
      title: "Manajemen Rider",
      description: "Distribusi produk ke rider dengan GPS tracking"
    },
    {
      icon: BarChart3,
      title: "Laporan & Analytics",
      description: "Dashboard analytics untuk insight bisnis yang actionable"
    },
    {
      icon: MapPin,
      title: "GPS Tracking",
      description: "Lacak pergerakan rider secara real-time"
    },
    {
      icon: TrendingUp,
      title: "Production Tracking",
      description: "Monitor proses produksi dari bahan baku hingga siap jual"
    }
  ];

  const benefits = [
    "Hemat waktu hingga 70% dalam pengelolaan stok",
    "Kurangi kesalahan manual dengan sistem otomatis",
    "Akses data real-time dari mana saja",
    "Multi-platform: Web & Mobile (Android/iOS)",
    "Customizable sesuai kebutuhan bisnis Anda",
    "Support & training gratis untuk semua paket"
  ];

  const pricing = [
    {
      name: "Free",
      price: "Rp 0",
      period: "Selamanya",
      features: ["POS Dasar", "Warehouse Management", "1 Admin", "Laporan Dasar"],
      cta: "Mulai Gratis",
      popular: false
    },
    {
      name: "Basic",
      price: "Rp 99.000",
      period: "per bulan",
      features: ["Semua fitur Free", "5 Riders", "GPS Tracking", "Email Support"],
      cta: "Coba 14 Hari Gratis",
      popular: false
    },
    {
      name: "Pro",
      price: "Rp 299.000",
      period: "per bulan",
      features: ["Semua fitur Basic", "20 Riders", "Advanced Reports", "Production Tracking", "Priority Support"],
      cta: "Coba 14 Hari Gratis",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Rp 999.000",
      period: "per bulan",
      features: ["Semua fitur Pro", "Unlimited Riders", "API Access", "White-label App", "Dedicated Support"],
      cta: "Hubungi Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-purple-50/30">
      {/* Header/Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                BK POS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Login
              </Button>
              <Button onClick={() => navigate("/signup")} className="bg-gradient-to-r from-blue-600 to-purple-600">
                Coba Gratis
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            🚀 Platform POS Multi-Tenant Terbaik di Indonesia
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold leading-tight">
            Kelola Bisnis Anda dengan{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Lebih Mudah & Efisien
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sistem POS all-in-one untuk warung makan, toko retail, dan distributor. 
            Kelola kasir, gudang, rider, dan laporan dalam satu platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-lg px-8"
              onClick={() => navigate("/signup")}
            >
              <Zap className="w-5 h-5 mr-2" />
              Mulai Gratis Sekarang
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              <Package className="w-5 h-5 mr-2" />
              Lihat Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Gratis selamanya</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Tanpa kartu kredit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Setup dalam 5 menit</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Fitur Unggulan
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Semua yang Anda Butuhkan dalam Satu Platform
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Tingkatkan efisiensi bisnis dengan fitur-fitur modern yang dirancang khusus untuk UMKM Indonesia
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => (
              <Card key={idx} className="border-2 hover:border-blue-200 hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mb-3">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="space-y-6">
              <Badge variant="outline" className="text-purple-600 border-purple-600">
                Mengapa BK POS?
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold">
                Dipercaya oleh Ribuan Bisnis di Indonesia
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-lg text-muted-foreground">{benefit}</p>
                  </div>
                ))}
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600"
                onClick={() => navigate("/signup")}
              >
                Mulai Sekarang →
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">5,000+</div>
                <div className="text-sm text-muted-foreground">Bisnis Aktif</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-purple-600 mb-2">99.9%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Transaksi/Hari</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-4xl font-bold text-orange-600 mb-2">4.9/5</div>
                <div className="text-sm text-muted-foreground">Rating Pengguna</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-b from-blue-50/50 to-purple-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Harga Transparan
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold">
              Pilih Paket yang Sesuai dengan Kebutuhan Anda
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja. Tidak ada biaya tersembunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {pricing.map((plan, idx) => (
              <Card 
                key={idx} 
                className={`relative ${
                  plan.popular 
                    ? "border-2 border-blue-600 shadow-xl scale-105" 
                    : "border-2 hover:border-blue-200"
                } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-blue-600 to-purple-600">
                      ⭐ Paling Populer
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Rp 0" && (
                      <span className="text-muted-foreground">/{plan.period}</span>
                    )}
                    {plan.price === "Rp 0" && (
                      <span className="text-muted-foreground ml-2">{plan.period}</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, fidx) => (
                      <li key={fidx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.popular 
                        ? "bg-gradient-to-r from-blue-600 to-purple-600" 
                        : ""
                    }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => navigate("/signup")}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              <span className="font-medium">Cloud-based</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="font-medium">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              <span className="font-medium">Mobile Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              <span className="font-medium">Real-time Sync</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-5xl font-bold">
            Siap Tingkatkan Bisnis Anda?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Bergabung dengan ribuan bisnis yang sudah berkembang bersama BK POS. Mulai gratis hari ini!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8"
              onClick={() => navigate("/signup")}
            >
              Mulai Gratis Sekarang →
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white/10 text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Login
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BK POS</span>
              </div>
              <p className="text-sm">
                Platform POS all-in-one untuk bisnis modern di Indonesia
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Fitur</a></li>
                <li><a href="#" className="hover:text-white">Harga</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
                <li><a href="#" className="hover:text-white">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Karir</a></li>
                <li><a href="#" className="hover:text-white">Kontak</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-white">Tutorial</a></li>
                <li><a href="#" className="hover:text-white">FAQ</a></li>
                <li><a href="#" className="hover:text-white">Support</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; 2025 BK POS. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white">Privacy Policy</a>
              <a href="#" className="hover:text-white">Terms of Service</a>
              <a href="#" className="hover:text-white">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
