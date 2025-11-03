import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Palette, Type, Zap, LayoutDashboard, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrganizationSettings {
  branding: any;
  terminology: any;
  features: any;
  dashboard_layout: any;
  report_templates: any;
}

export default function OrganizationSettings() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [settings, setSettings] = useState<OrganizationSettings>({
    branding: {},
    terminology: {},
    features: {},
    dashboard_layout: {},
    report_templates: {},
  });

  useEffect(() => {
    if (id) {
      loadSettings();
    }
  }, [id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Try to load with new columns first
      const { data, error } = await supabase
        .from("organizations" as any)
        .select("name, branding, terminology, features, dashboard_layout, report_templates")
        .eq("id", id)
        .single();

      if (error) {
        // If columns don't exist yet, just load name
        console.log("New columns not available yet, loading basic info only");
        const { data: basicData, error: basicError } = await supabase
          .from("organizations" as any)
          .select("name")
          .eq("id", id)
          .single();
        
        if (basicError) throw basicError;
        
        setOrgName((basicData as any).name);
        toast({
          title: "Migration Required",
          description: "Please execute add-organization-customization.sql in Supabase SQL Editor first",
          variant: "destructive",
        });
        return;
      }

      const orgData = data as any;
      setOrgName(orgData.name);
      setSettings({
        branding: orgData.branding || {},
        terminology: orgData.terminology || {},
        features: orgData.features || {},
        dashboard_layout: orgData.dashboard_layout || {},
        report_templates: orgData.report_templates || {},
      });
    } catch (error: any) {
      console.error("Error loading settings:", error);
      toast({
        title: "Error",
        description: "Failed to load organization settings. Make sure migration is executed.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from("organizations" as any)
        .update({
          branding: settings.branding,
          terminology: settings.terminology,
          features: settings.features,
          dashboard_layout: settings.dashboard_layout,
          report_templates: settings.report_templates,
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization settings updated successfully",
      });

      // Reload page to apply new settings
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateBranding = (key: string, value: any) => {
    setSettings({
      ...settings,
      branding: { ...settings.branding, [key]: value },
    });
  };

  const updateTerminology = (key: string, value: string) => {
    setSettings({
      ...settings,
      terminology: { ...settings.terminology, [key]: value },
    });
  };

  const updateFeature = (key: string, value: boolean) => {
    setSettings({
      ...settings,
      features: { ...settings.features, [key]: value },
    });
  };

  const updateDashboardLayout = (key: string, value: any) => {
    setSettings({
      ...settings,
      dashboard_layout: { ...settings.dashboard_layout, [key]: value },
    });
  };

  const updateReportTemplate = (reportType: string, key: string, value: any) => {
    setSettings({
      ...settings,
      report_templates: {
        ...settings.report_templates,
        [reportType]: {
          ...settings.report_templates[reportType as keyof typeof settings.report_templates],
          [key]: value,
        },
      },
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(`/super-admin/organization/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground">{orgName}</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="terminology">
            <Type className="h-4 w-4 mr-2" />
            Terminology
          </TabsTrigger>
          <TabsTrigger value="features">
            <Zap className="h-4 w-4 mr-2" />
            Features
          </TabsTrigger>
          <TabsTrigger value="dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="reports">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Appearance</CardTitle>
              <CardDescription>
                Customize colors, logo, and app name for this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app_name">App Name</Label>
                <Input
                  id="app_name"
                  value={settings.branding.app_name || ""}
                  onChange={(e) => updateBranding("app_name", e.target.value)}
                  placeholder="BK POS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary_color">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary_color"
                      type="color"
                      value={settings.branding.primary_color || "#3b82f6"}
                      onChange={(e) => updateBranding("primary_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.branding.primary_color || "#3b82f6"}
                      onChange={(e) => updateBranding("primary_color", e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary_color">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary_color"
                      type="color"
                      value={settings.branding.secondary_color || "#8b5cf6"}
                      onChange={(e) => updateBranding("secondary_color", e.target.value)}
                      className="w-20 h-10"
                    />
                    <Input
                      value={settings.branding.secondary_color || "#8b5cf6"}
                      onChange={(e) => updateBranding("secondary_color", e.target.value)}
                      placeholder="#8b5cf6"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={settings.branding.logo_url || ""}
                  onChange={(e) => updateBranding("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Upload logo to storage and paste URL here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Terminology Tab */}
        <TabsContent value="terminology">
          <Card>
            <CardHeader>
              <CardTitle>Custom Terminology</CardTitle>
              <CardDescription>
                Customize terms to match your business language
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(settings.terminology).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={key} className="capitalize">
                      {key.replace(/_/g, " ")}
                    </Label>
                    <Input
                      id={key}
                      value={(value as string) || ""}
                      onChange={(e) => updateTerminology(key, e.target.value)}
                      placeholder={key}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Enable/Disable Features</CardTitle>
              <CardDescription>
                Control which modules are available for this organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(settings.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label htmlFor={key} className="capitalize cursor-pointer">
                        {key.replace(/_/g, " ")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {getFeatureDescription(key)}
                      </p>
                    </div>
                    <Switch
                      id={key}
                      checked={value as boolean}
                      onCheckedChange={(checked) => updateFeature(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Layout</CardTitle>
              <CardDescription>
                Configure dashboard widgets and layout preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Visible Widgets</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "sales_summary", label: "Sales Summary" },
                    { key: "stock_alerts", label: "Stock Alerts" },
                    { key: "rider_status", label: "Rider Status" },
                    { key: "recent_orders", label: "Recent Orders" },
                    { key: "top_products", label: "Top Products" },
                    { key: "revenue_chart", label: "Revenue Chart" },
                  ].map((widget) => (
                    <div key={widget.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`widget_${widget.key}`}
                        checked={settings.dashboard_layout.widgets?.includes(widget.key) || false}
                        onChange={(e) => {
                          const currentWidgets = settings.dashboard_layout.widgets || [];
                          const newWidgets = e.target.checked
                            ? [...currentWidgets, widget.key]
                            : currentWidgets.filter((w) => w !== widget.key);
                          updateDashboardLayout("widgets", newWidgets);
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`widget_${widget.key}`} className="font-normal cursor-pointer">
                        {widget.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label>Chart Types</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: "line", label: "Line Chart" },
                    { key: "bar", label: "Bar Chart" },
                    { key: "pie", label: "Pie Chart" },
                    { key: "area", label: "Area Chart" },
                  ].map((chart) => (
                    <div key={chart.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`chart_${chart.key}`}
                        checked={settings.dashboard_layout.charts?.includes(chart.key) || false}
                        onChange={(e) => {
                          const currentCharts = settings.dashboard_layout.charts || [];
                          const newCharts = e.target.checked
                            ? [...currentCharts, chart.key]
                            : currentCharts.filter((c) => c !== chart.key);
                          updateDashboardLayout("charts", newCharts);
                        }}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={`chart_${chart.key}`} className="font-normal cursor-pointer">
                        {chart.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_weather"
                    checked={settings.dashboard_layout.show_weather || false}
                    onChange={(e) => updateDashboardLayout("show_weather", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="show_weather" className="font-normal cursor-pointer">
                    Show Weather Widget
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="show_gps_map"
                    checked={settings.dashboard_layout.show_gps_map || false}
                    onChange={(e) => updateDashboardLayout("show_gps_map", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="show_gps_map" className="font-normal cursor-pointer">
                    Show GPS Map
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="default_view">Default View</Label>
                <select
                  id="default_view"
                  value={settings.dashboard_layout.default_view || "overview"}
                  onChange={(e) => updateDashboardLayout("default_view", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="overview">Overview</option>
                  <option value="sales">Sales Focus</option>
                  <option value="inventory">Inventory Focus</option>
                  <option value="riders">Riders Focus</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="refresh_interval">Auto Refresh Interval (seconds)</Label>
                <Input
                  id="refresh_interval"
                  type="number"
                  min="0"
                  max="300"
                  value={settings.dashboard_layout.refresh_interval || 30}
                  onChange={(e) => updateDashboardLayout("refresh_interval", parseInt(e.target.value) || 30)}
                  placeholder="30"
                />
                <p className="text-xs text-muted-foreground">
                  Set to 0 to disable auto-refresh
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>
                Configure available reports and their default settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sales Report */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Sales Report</h4>
                    <p className="text-sm text-muted-foreground">Daily, weekly, and monthly sales analysis</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.report_templates.sales_report?.enabled ?? true}
                    onChange={(e) => updateReportTemplate("sales_report", "enabled", e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                {(settings.report_templates.sales_report?.enabled ?? true) && (
                  <div className="pl-4 space-y-2">
                    <Label className="text-sm">Include Sections:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["summary", "by_product", "by_rider", "by_payment_method"].map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`sales_${section}`}
                            checked={settings.report_templates.sales_report?.sections?.includes(section) ?? true}
                            onChange={(e) => {
                              const current = settings.report_templates.sales_report?.sections || ["summary", "by_product", "by_rider", "by_payment_method"];
                              const newSections = e.target.checked
                                ? [...current, section]
                                : current.filter((s) => s !== section);
                              updateReportTemplate("sales_report", "sections", newSections);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`sales_${section}`} className="text-sm font-normal cursor-pointer">
                            {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stock Report */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Stock Report</h4>
                    <p className="text-sm text-muted-foreground">Inventory levels and movement tracking</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.report_templates.stock_report?.enabled ?? true}
                    onChange={(e) => updateReportTemplate("stock_report", "enabled", e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                {(settings.report_templates.stock_report?.enabled ?? true) && (
                  <div className="pl-4 space-y-2">
                    <Label className="text-sm">Include Sections:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["current_stock", "low_stock_alerts", "stock_movement", "expiry_tracking"].map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`stock_${section}`}
                            checked={settings.report_templates.stock_report?.sections?.includes(section) ?? true}
                            onChange={(e) => {
                              const current = settings.report_templates.stock_report?.sections || ["current_stock", "low_stock_alerts", "stock_movement"];
                              const newSections = e.target.checked
                                ? [...current, section]
                                : current.filter((s) => s !== section);
                              updateReportTemplate("stock_report", "sections", newSections);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`stock_${section}`} className="text-sm font-normal cursor-pointer">
                            {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rider Report */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Rider Report</h4>
                    <p className="text-sm text-muted-foreground">Delivery performance and GPS tracking</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.report_templates.rider_report?.enabled ?? true}
                    onChange={(e) => updateReportTemplate("rider_report", "enabled", e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                {(settings.report_templates.rider_report?.enabled ?? true) && (
                  <div className="pl-4 space-y-2">
                    <Label className="text-sm">Include Sections:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["delivery_summary", "gps_routes", "performance_metrics", "attendance"].map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`rider_${section}`}
                            checked={settings.report_templates.rider_report?.sections?.includes(section) ?? true}
                            onChange={(e) => {
                              const current = settings.report_templates.rider_report?.sections || ["delivery_summary", "gps_routes", "performance_metrics"];
                              const newSections = e.target.checked
                                ? [...current, section]
                                : current.filter((s) => s !== section);
                              updateReportTemplate("rider_report", "sections", newSections);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`rider_${section}`} className="text-sm font-normal cursor-pointer">
                            {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Financial Report */}
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Financial Report</h4>
                    <p className="text-sm text-muted-foreground">Revenue, expenses, and profit analysis</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.report_templates.financial_report?.enabled ?? true}
                    onChange={(e) => updateReportTemplate("financial_report", "enabled", e.target.checked)}
                    className="h-5 w-5"
                  />
                </div>
                {(settings.report_templates.financial_report?.enabled ?? true) && (
                  <div className="pl-4 space-y-2">
                    <Label className="text-sm">Include Sections:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {["revenue", "expenses", "profit_loss", "tax_summary"].map((section) => (
                        <div key={section} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`financial_${section}`}
                            checked={settings.report_templates.financial_report?.sections?.includes(section) ?? true}
                            onChange={(e) => {
                              const current = settings.report_templates.financial_report?.sections || ["revenue", "expenses", "profit_loss"];
                              const newSections = e.target.checked
                                ? [...current, section]
                                : current.filter((s) => s !== section);
                              updateReportTemplate("financial_report", "sections", newSections);
                            }}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={`financial_${section}`} className="text-sm font-normal cursor-pointer">
                            {section.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getFeatureDescription(key: string): string {
  const descriptions: Record<string, string> = {
    pos: "Point of Sale module",
    warehouse: "Warehouse & stock management",
    reports: "Sales and inventory reports",
    gps_tracking: "GPS tracking for riders",
    production_tracking: "Production & manufacturing tracking",
    low_stock_alerts: "Automatic low stock notifications",
    returns_management: "Product returns management",
    weather_widget: "Weather information widget",
    advanced_reports: "Advanced analytics & insights",
    api_access: "API access for integrations",
    multi_currency: "Multiple currency support",
    barcode_scanner: "Barcode scanning feature",
    email_notifications: "Email notification system",
    sms_notifications: "SMS notification system",
  };
  return descriptions[key] || "Feature configuration";
}
