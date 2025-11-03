import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  max_riders: number;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
}

interface EditFormData {
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_products: number;
  max_riders: number;
  features: string;
  is_active: boolean;
}

export default function ManageSubscriptionPlans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<EditFormData>({
    display_name: "",
    price_monthly: 0,
    price_yearly: 0,
    max_users: 0,
    max_products: 0,
    max_riders: 0,
    features: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscription_plans" as any)
        .select("*")
        .order("price_monthly", { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      console.error("Error fetching plans:", error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setFormData({
      display_name: plan.display_name,
      price_monthly: plan.price_monthly,
      price_yearly: plan.price_yearly,
      max_users: plan.max_users,
      max_products: plan.max_products,
      max_riders: plan.max_riders,
      features: plan.features ? plan.features.join("\n") : "",
      is_active: plan.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedPlan) return;

    try {
      setSaving(true);

      // Convert features text to array
      const featuresArray = formData.features
        .split("\n")
        .map((f) => f.trim())
        .filter((f) => f.length > 0);

      const { error } = await supabase
        .from("subscription_plans" as any)
        .update({
          display_name: formData.display_name,
          price_monthly: formData.price_monthly,
          price_yearly: formData.price_yearly,
          max_users: formData.max_users,
          max_products: formData.max_products,
          max_riders: formData.max_riders,
          features: featuresArray,
          is_active: formData.is_active,
        })
        .eq("id", selectedPlan.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });

      setEditDialogOpen(false);
      fetchPlans();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription plan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/super-admin")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Subscription Plans</h1>
            <p className="text-muted-foreground">
              Edit pricing, limits, and features for each plan
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="capitalize">{plan.display_name}</CardTitle>
                  <CardDescription className="uppercase text-xs mt-1">
                    {plan.name}
                  </CardDescription>
                </div>
                <Badge variant={plan.is_active ? "default" : "secondary"}>
                  {plan.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pricing */}
              <div>
                <p className="text-3xl font-bold">
                  {formatCurrency(plan.price_monthly)}
                </p>
                <p className="text-sm text-muted-foreground">/month</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(plan.price_yearly)}/year
                </p>
              </div>

              {/* Limits */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Users</span>
                  <span className="font-medium">{plan.max_users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Products</span>
                  <span className="font-medium">{plan.max_products}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Max Riders</span>
                  <span className="font-medium">{plan.max_riders}</span>
                </div>
              </div>

              {/* Features */}
              {plan.features && plan.features.length > 0 && (
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium">Features:</p>
                  <ul className="space-y-1">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                        <span>•</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                    {plan.features.length > 3 && (
                      <li className="text-xs text-muted-foreground">
                        +{plan.features.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Edit Button */}
              <Button
                className="w-full mt-4"
                onClick={() => handleEdit(plan)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Plan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Edit {selectedPlan?.display_name} Plan
            </DialogTitle>
            <DialogDescription>
              Update pricing, limits, and features for this subscription plan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                placeholder="e.g., Free Plan"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price_monthly">Monthly Price (Rp)</Label>
                <Input
                  id="price_monthly"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price_monthly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_monthly: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price_yearly">Yearly Price (Rp)</Label>
                <Input
                  id="price_yearly"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.price_yearly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price_yearly: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_users">Max Users</Label>
                <Input
                  id="max_users"
                  type="number"
                  min="1"
                  value={formData.max_users}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_users: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_products">Max Products</Label>
                <Input
                  id="max_products"
                  type="number"
                  min="1"
                  value={formData.max_products}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_products: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_riders">Max Riders</Label>
                <Input
                  id="max_riders"
                  type="number"
                  min="1"
                  value={formData.max_riders}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_riders: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label htmlFor="features">
                Features (one per line)
              </Label>
              <Textarea
                id="features"
                rows={8}
                value={formData.features}
                onChange={(e) =>
                  setFormData({ ...formData, features: e.target.value })
                }
                placeholder="Basic POS features&#10;Inventory management&#10;Sales reports&#10;..."
              />
              <p className="text-xs text-muted-foreground">
                Enter each feature on a new line
              </p>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-4 w-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Plan is active (visible to customers)
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
