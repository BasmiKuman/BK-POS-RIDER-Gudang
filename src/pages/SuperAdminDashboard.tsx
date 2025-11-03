import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Users, Package, TrendingUp, Plus, Settings, DollarSign } from "lucide-react";
import { toast } from "sonner";

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_end_date: string;
  max_users: number;
  max_products: number;
  max_riders: number;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  totalOrganizations: number;
  activeSubscriptions: number;
  totalRevenue: number;
  trialOrganizations: number;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalOrganizations: 0,
    activeSubscriptions: 0,
    totalRevenue: 0,
    trialOrganizations: 0,
  });

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Check if user has super_admin role
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error || roles?.role !== "super_admin") {
        toast.error("Access Denied: Super Admin only!");
        navigate("/");
        return;
      }

      setIsSuperAdmin(true);
      await loadDashboardData();
    } catch (error) {
      console.error("Error checking access:", error);
      navigate("/");
    }
  };

  const loadDashboardData = async () => {
    try {
      // Load organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (orgsError) throw orgsError;

      setOrganizations((orgs as any) || []);

      // Calculate stats
      const activeCount = orgs?.filter((org: any) => org.subscription_status === 'active').length || 0;
      const trialCount = orgs?.filter((org: any) => org.subscription_status === 'trial').length || 0;

      // Get revenue from subscription_history
      const { data: payments } = await supabase
        .from("subscription_history" as any)
        .select("amount")
        .eq("payment_status", "paid");

      const totalRevenue = payments?.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0) || 0;

      setStats({
        totalOrganizations: orgs?.length || 0,
        activeSubscriptions: activeCount,
        totalRevenue,
        trialOrganizations: trialCount,
      });

    } catch (error) {
      console.error("Error loading dashboard:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      trial: "secondary",
      expired: "destructive",
      cancelled: "outline",
    };
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-500",
      basic: "bg-blue-500",
      pro: "bg-purple-500",
      enterprise: "bg-yellow-500",
    };
    
    return (
      <Badge className={colors[plan] || "bg-gray-500"}>
        {plan.toUpperCase()}
      </Badge>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Super Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage all organizations and subscriptions
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate("/super-admin/create-organization")}>
              <Plus className="w-4 h-4 mr-2" />
              New Organization
            </Button>
            <Button variant="outline" onClick={() => navigate("/super-admin/subscription-plans")}>
              <Package className="w-4 h-4 mr-2" />
              Manage Plans
            </Button>
            <Button variant="outline" onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrganizations}</div>
              <p className="text-xs text-muted-foreground">
                {stats.trialOrganizations} on trial
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                Paying customers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                All-time revenue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground">
                vs last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Organizations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Organizations</CardTitle>
            <CardDescription>
              All registered organizations and their subscription status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Limits</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No organizations yet. Create your first one!
                    </TableCell>
                  </TableRow>
                ) : (
                  organizations.map((org) => (
                    <TableRow 
                      key={org.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/super-admin/organization/${org.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div>{org.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {org.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPlanBadge(org.subscription_plan)}</TableCell>
                      <TableCell>{getStatusBadge(org.subscription_status)}</TableCell>
                      <TableCell className="text-xs">
                        <div>Users: {org.max_users}</div>
                        <div>Products: {org.max_products}</div>
                        <div>Riders: {org.max_riders}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {org.subscription_end_date
                          ? formatDate(org.subscription_end_date)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(org.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/super-admin/organization/${org.id}`);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
