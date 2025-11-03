import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Building2, Loader2 } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  max_users: number;
  max_products: number;
  max_riders: number;
}

export default function CreateOrganization() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    subscription_plan_id: "",
    owner_email: "",
    owner_name: "",
  });

  // Load subscription plans
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("subscription_plans" as any)
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;
      setPlans((data as any) || []);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load subscription plans");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleNameChange = (value: string) => {
    setFormData({
      ...formData,
      name: value,
      slug: generateSlug(value),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.subscription_plan_id) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      // Get selected plan details
      const selectedPlan = plans.find(p => p.id === formData.subscription_plan_id);
      if (!selectedPlan) throw new Error("Invalid subscription plan");

      // Create organization
      const { data: org, error: orgError } = await supabase
        .from("organizations" as any)
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          subscription_plan_id: formData.subscription_plan_id,
          subscription_status: selectedPlan.name === 'Free' ? 'trial' : 'active',
          subscription_start_date: new Date().toISOString(),
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          max_users: selectedPlan.max_users,
          max_products: selectedPlan.max_products,
          max_riders: selectedPlan.max_riders,
          is_active: true,
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Create subscription history record
      await supabase.from("subscription_history" as any).insert({
        organization_id: (org as any).id,
        subscription_plan_id: formData.subscription_plan_id,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        amount: selectedPlan.price,
        payment_status: selectedPlan.name === 'Free' ? 'free' : 'pending',
      });

      toast.success(`Organization "${formData.name}" created successfully!`);
      navigate("/super-admin");
    } catch (error: any) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/super-admin")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Create New Organization</h1>
          </div>
          <p className="text-muted-foreground">
            Set up a new organization/tenant with subscription plan
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Enter the organization information and select a subscription plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Organization Name */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., Toko Kelontong Jaya"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">
                  Slug (Auto-generated)
                </Label>
                <Input
                  id="slug"
                  placeholder="toko-kelontong-jaya"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs: yourapp.com/org/{formData.slug || "slug"}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the organization..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Subscription Plan */}
              <div className="space-y-2">
                <Label htmlFor="plan">
                  Subscription Plan <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.subscription_plan_id}
                  onValueChange={(value) => setFormData({ ...formData, subscription_plan_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">{plan.name}</span>
                          <span className="text-muted-foreground ml-4">
                            {plan.price === 0 ? 'Free' : `Rp ${plan.price.toLocaleString('id-ID')}/mo`}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {plan.max_users} users • {plan.max_products} products • {plan.max_riders} riders
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Owner Email (Optional - for future) */}
              <div className="space-y-2">
                <Label htmlFor="owner_email">Owner Email (Optional)</Label>
                <Input
                  id="owner_email"
                  type="email"
                  placeholder="owner@example.com"
                  value={formData.owner_email}
                  onChange={(e) => setFormData({ ...formData, owner_email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Will be invited as organization admin (feature coming soon)
                </p>
              </div>

              {/* Owner Name (Optional - for future) */}
              <div className="space-y-2">
                <Label htmlFor="owner_name">Owner Name (Optional)</Label>
                <Input
                  id="owner_name"
                  placeholder="John Doe"
                  value={formData.owner_name}
                  onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/super-admin")}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="w-4 h-4 mr-2" />
                  Create Organization
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
