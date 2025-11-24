import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Calendar, CheckCircle2, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface SubscriptionInfo {
  plan: string;
  start_date: string;
  end_date: string;
  payment_status: string;
  organization_name: string;
  days_remaining: number;
}

export function SubscriptionBadge() {
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's organization
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.organization_id) return;

      // Get organization details
      const { data: org } = await supabase
        .from("organizations" as any)
        .select("name, subscription_plan")
        .eq("id", profile.organization_id)
        .single();

      // Get latest subscription history
      const { data: subHistory } = await supabase
        .from("subscription_history" as any)
        .select("start_date, end_date, payment_status")
        .eq("organization_id", profile.organization_id)
        .order("start_date", { ascending: false })
        .limit(1)
        .single();

      if (org && subHistory) {
        const endDate = new Date(subHistory.end_date);
        const today = new Date();
        const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        setSubscription({
          plan: org.subscription_plan,
          start_date: subHistory.start_date,
          end_date: subHistory.end_date,
          payment_status: subHistory.payment_status,
          organization_name: org.name,
          days_remaining: daysRemaining,
        });
      }
    } catch (error) {
      console.error("Error loading subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      pro: "bg-purple-500",
      enterprise: "bg-yellow-500",
    };
    return colors[plan] || "bg-gray-500";
  };

  const getPlanFeatures = (plan: string) => {
    const features: Record<string, string[]> = {
      free: [
        "5 Users maksimal",
        "50 Produk maksimal",
        "3 Riders maksimal",
        "Fitur dasar POS & Gudang",
      ],
      basic: [
        "25 Users",
        "200 Produk",
        "10 Riders",
        "GPS Tracking",
        "Laporan Basic",
      ],
      pro: [
        "100 Users",
        "1000 Produk",
        "50 Riders",
        "GPS Tracking Advanced",
        "Laporan Detail",
        "Production Tracking",
        "White-label Branding",
      ],
      enterprise: [
        "Unlimited Users",
        "Unlimited Produk",
        "Unlimited Riders",
        "Semua Fitur Pro",
        "Priority Support",
        "Custom Integration",
        "Dedicated Account Manager",
      ],
    };
    return features[plan] || [];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || !subscription) return null;

  const isExpiringSoon = subscription.days_remaining <= 7 && subscription.days_remaining > 0;
  const isExpired = subscription.days_remaining <= 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 ${isExpired ? "border-red-500 text-red-500" : isExpiringSoon ? "border-yellow-500 text-yellow-500" : ""}`}
        >
          <Crown className="h-4 w-4" />
          <span className="hidden md:inline">
            {subscription.plan.toUpperCase()}
          </span>
          {subscription.plan !== "free" && (
            <Badge variant={isExpired ? "destructive" : "secondary"} className="ml-1">
              {isExpired ? "Expired" : `${subscription.days_remaining}d`}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Subscription Details
          </DialogTitle>
          <DialogDescription>
            {subscription.organization_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Plan</span>
                <Badge className={getPlanColor(subscription.plan)}>
                  {subscription.plan.toUpperCase()}
                </Badge>
              </CardTitle>
              <CardDescription>
                {subscription.payment_status === "paid" ? (
                  <span className="text-green-600 font-medium">✓ Active</span>
                ) : (
                  <span className="text-yellow-600 font-medium">⏳ Pending Payment</span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </div>
                  <div className="font-medium">{formatDate(subscription.start_date)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </div>
                  <div className={`font-medium ${isExpired ? "text-red-500" : isExpiringSoon ? "text-yellow-600" : ""}`}>
                    {formatDate(subscription.end_date)}
                    {subscription.plan !== "free" && (
                      <span className="ml-2 text-sm">
                        ({isExpired ? "Expired" : `${subscription.days_remaining} days left`})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expiry Warning */}
              {isExpiringSoon && !isExpired && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  ⚠️ Your subscription will expire in {subscription.days_remaining} days. Upgrade or renew to continue using premium features.
                </div>
              )}

              {isExpired && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  🚫 Your subscription has expired. Please upgrade to restore access to premium features.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>What's included in your {subscription.plan} plan</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getPlanFeatures(subscription.plan).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Upgrade CTA */}
          {subscription.plan !== "enterprise" && (
            <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-purple-600" />
                  Want More?
                </CardTitle>
                <CardDescription>
                  Upgrade to unlock more features and capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => {
                    setOpen(false);
                    navigate("/organization-settings?tab=subscription");
                    toast.info("Contact Super Admin to upgrade your plan");
                  }}
                >
                  View Upgrade Options
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Need Help */}
          <div className="text-center text-sm text-muted-foreground">
            Need help with your subscription?{" "}
            <Button
              variant="link"
              className="p-0 h-auto"
              onClick={() => {
                setOpen(false);
                navigate("/settings");
              }}
            >
              Contact Support
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
