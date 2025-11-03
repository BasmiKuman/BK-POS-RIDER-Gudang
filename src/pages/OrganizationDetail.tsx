import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Package, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Settings,
  UserPlus,
  Loader2
} from "lucide-react";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string;
  subscription_status: string;
  subscription_plan: string;
  subscription_start_date: string;
  subscription_end_date: string;
  max_users: number;
  max_products: number;
  max_riders: number;
  is_active: boolean;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  stock: number;
  price: number;
}

interface SubscriptionHistory {
  id: string;
  start_date: string;
  end_date: string;
  amount: number;
  payment_status: string;
  plan_name: string;
}

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState<SubscriptionHistory[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (id) {
      loadOrganizationData();
    }
  }, [id]);

  const loadOrganizationData = async () => {
    try {
      setLoading(true);

      // Load organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations" as any)
        .select("*")
        .eq("id", id)
        .single();

      if (orgError) throw orgError;

      setOrganization(org as any);

      // Load users in this organization using RPC
      const { data: usersData, error: usersError } = await (supabase as any)
        .rpc("get_organization_users", { org_id: id });

      if (usersError) {
        console.error("Error loading users:", usersError);
        setUsers([]);
      } else {
        setUsers((usersData as any) || []);
      }

      // Load products in this organization
      const { data: productsData } = await supabase
        .from("products" as any)
        .select(`
          id,
          name,
          stock,
          price,
          categories(name)
        `)
        .eq("organization_id", id)
        .limit(100);

      setProducts((productsData as any) || []);

      // Load subscription history
      const { data: historyData } = await supabase
        .from("subscription_history" as any)
        .select(`
          id,
          start_date,
          end_date,
          amount,
          payment_status,
          plan_id
        `)
        .eq("organization_id", id)
        .order("start_date", { ascending: false });

      // Get plan names separately
      if (historyData && historyData.length > 0) {
        const planIds = [...new Set(historyData.map((h: any) => h.plan_id))];
        const { data: plansData } = await supabase
          .from("subscription_plans" as any)
          .select("id, name, display_name")
          .in("id", planIds);

        const plansMap = new Map((plansData || []).map((p: any) => [p.id, p]));
        
        const enrichedHistory = historyData.map((h: any) => ({
          ...h,
          subscription_plans: plansMap.get(h.plan_id) || { name: 'Unknown' }
        }));

        setSubscriptionHistory(enrichedHistory);
      } else {
        setSubscriptionHistory([]);
      }

    } catch (error: any) {
      console.error("Error loading organization:", error);
      toast.error(error.message || "Failed to load organization data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!organization) return;

    try {
      const newStatus = !organization.is_active;
      
      const { error } = await supabase
        .from("organizations" as any)
        .update({ is_active: newStatus })
        .eq("id", id);

      if (error) throw error;

      setOrganization({ ...organization, is_active: newStatus });
      toast.success(`Organization ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update organization status");
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

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-blue-500",
      rider: "bg-green-500",
      super_admin: "bg-purple-500",
    };
    
    return (
      <Badge className={colors[role] || "bg-gray-500"}>
        {role.toUpperCase()}
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
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading organization details...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Organization Not Found</h1>
          <Button onClick={() => navigate("/super-admin")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
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

          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Building2 className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold">{organization.name}</h1>
                {getStatusBadge(organization.subscription_status)}
                <Badge variant={organization.is_active ? "default" : "destructive"}>
                  {organization.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {organization.description || "No description"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Slug: <span className="font-mono">{organization.slug}</span>
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant={organization.is_active ? "destructive" : "default"}
                onClick={handleToggleStatus}
              >
                {organization.is_active ? "Deactivate" : "Activate"}
              </Button>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                of {organization.max_users} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                of {organization.max_products} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter((u: any) => u.user_roles?.role === 'rider').length}
              </div>
              <p className="text-xs text-muted-foreground">
                of {organization.max_riders} max
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{organization.subscription_plan}</div>
              <p className="text-xs text-muted-foreground">
                Until {formatDate(organization.subscription_end_date)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="billing">Billing History</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Organization ID</p>
                    <p className="font-mono text-sm">{organization.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created At</p>
                    <p className="text-sm">{formatDate(organization.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Plan</p>
                    <p className="text-sm font-medium">{organization.subscription_plan}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">{getStatusBadge(organization.subscription_status)}</div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription Start</p>
                    <p className="text-sm">{formatDate(organization.subscription_start_date)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Subscription End</p>
                    <p className="text-sm">{formatDate(organization.subscription_end_date)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Users</span>
                      <span className="text-sm text-muted-foreground">
                        {users.length} / {organization.max_users}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(users.length / organization.max_users) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Products</span>
                      <span className="text-sm text-muted-foreground">
                        {products.length} / {organization.max_products}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${(products.length / organization.max_products) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Riders</span>
                      <span className="text-sm text-muted-foreground">
                        {users.filter((u: any) => u.user_roles?.role === 'rider').length} / {organization.max_riders}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ 
                          width: `${(users.filter((u: any) => u.user_roles?.role === 'rider').length / organization.max_riders) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>All users in this organization</CardDescription>
                  </div>
                  <Button size="sm">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user: any) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell>{user.auth?.users?.email || 'N/A'}</TableCell>
                          <TableCell>{getRoleBadge(user.user_roles?.role || 'unknown')}</TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">Edit</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>Products managed by this organization</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((product: any) => (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.categories?.name || 'Uncategorized'}</TableCell>
                          <TableCell>{product.stock}</TableCell>
                          <TableCell>{formatCurrency(product.price)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing History Tab */}
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription History</CardTitle>
                <CardDescription>Payment and subscription records</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptionHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No billing history
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptionHistory.map((history: any) => (
                        <TableRow key={history.id}>
                          <TableCell className="font-medium">
                            {history.subscription_plans?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {formatDate(history.start_date)} - {formatDate(history.end_date)}
                          </TableCell>
                          <TableCell>{formatCurrency(history.amount)}</TableCell>
                          <TableCell>
                            <Badge variant={history.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {history.payment_status.toUpperCase()}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
