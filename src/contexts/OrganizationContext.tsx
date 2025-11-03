import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Branding {
  primary_color: string;
  secondary_color: string;
  logo_url?: string;
  favicon_url?: string;
  app_name: string;
}

interface Terminology {
  rider: string;
  rider_plural: string;
  warehouse: string;
  pos: string;
  product: string;
  product_plural: string;
  customer: string;
  customer_plural: string;
  order: string;
  order_plural: string;
  return: string;
  return_plural: string;
  report: string;
  report_plural: string;
  dashboard: string;
  settings: string;
}

interface Features {
  pos: boolean;
  warehouse: boolean;
  reports: boolean;
  gps_tracking: boolean;
  production_tracking: boolean;
  low_stock_alerts: boolean;
  returns_management: boolean;
  weather_widget: boolean;
  advanced_reports: boolean;
  api_access: boolean;
  multi_currency: boolean;
  barcode_scanner: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

interface DashboardLayout {
  widgets: string[];
  charts: string[];
  show_weather: boolean;
  show_gps_map: boolean;
  default_view: string;
  refresh_interval: number;
}

interface OrganizationSettings {
  branding: Branding;
  terminology: Terminology;
  features: Features;
  dashboard_layout: DashboardLayout;
  organization_id?: string;
  organization_name?: string;
}

const defaultSettings: OrganizationSettings = {
  branding: {
    primary_color: "#3b82f6",
    secondary_color: "#8b5cf6",
    app_name: "BK POS",
  },
  terminology: {
    rider: "Rider",
    rider_plural: "Riders",
    warehouse: "Warehouse",
    pos: "POS",
    product: "Product",
    product_plural: "Products",
    customer: "Customer",
    customer_plural: "Customers",
    order: "Order",
    order_plural: "Orders",
    return: "Return",
    return_plural: "Returns",
    report: "Report",
    report_plural: "Reports",
    dashboard: "Dashboard",
    settings: "Settings",
  },
  features: {
    pos: true,
    warehouse: true,
    reports: true,
    gps_tracking: true,
    production_tracking: false,
    low_stock_alerts: true,
    returns_management: true,
    weather_widget: false,
    advanced_reports: false,
    api_access: false,
    multi_currency: false,
    barcode_scanner: true,
    email_notifications: true,
    sms_notifications: false,
  },
  dashboard_layout: {
    widgets: ["sales", "stock", "riders", "orders"],
    charts: ["daily_sales", "top_products"],
    show_weather: false,
    show_gps_map: true,
    default_view: "grid",
    refresh_interval: 300,
  },
};

const OrganizationContext = createContext<OrganizationSettings>(defaultSettings);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    return defaultSettings;
  }
  return context;
};

interface OrganizationProviderProps {
  children: ReactNode;
}

export const OrganizationProvider = ({ children }: OrganizationProviderProps) => {
  const [settings, setSettings] = useState<OrganizationSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationSettings();
  }, []);

  const loadOrganizationSettings = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Get user's profile to find organization_id
      const { data: profile } = await supabase
        .from("profiles" as any)
        .select("organization_id")
        .eq("user_id", user.id)
        .single();

      if (!profile || !(profile as any).organization_id) {
        console.log("No organization found for user");
        setLoading(false);
        return;
      }

      // Get organization settings
      const { data: org, error } = await supabase
        .from("organizations" as any)
        .select("id, name, branding, terminology, features, dashboard_layout")
        .eq("id", (profile as any).organization_id)
        .single();

      if (error) {
        console.error("Error loading organization settings:", error);
        setLoading(false);
        return;
      }

      if (org) {
        const orgData = org as any;
        const orgSettings: OrganizationSettings = {
          branding: orgData.branding || defaultSettings.branding,
          terminology: orgData.terminology || defaultSettings.terminology,
          features: orgData.features || defaultSettings.features,
          dashboard_layout: orgData.dashboard_layout || defaultSettings.dashboard_layout,
          organization_id: orgData.id,
          organization_name: orgData.name,
        };

        setSettings(orgSettings);

        // Cache settings in localStorage
        localStorage.setItem("org_settings", JSON.stringify(orgSettings));

        // Apply branding (colors, app name)
        applyBranding(orgSettings.branding);
      }
    } catch (error) {
      console.error("Error in loadOrganizationSettings:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyBranding = (branding: Branding) => {
    // Apply CSS variables for colors
    document.documentElement.style.setProperty("--primary-color", branding.primary_color);
    document.documentElement.style.setProperty("--secondary-color", branding.secondary_color);

    // Update page title
    if (branding.app_name) {
      document.title = branding.app_name;
    }

    // Update favicon if provided
    if (branding.favicon_url) {
      const link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (link) {
        link.href = branding.favicon_url;
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading organization settings...</p>
      </div>
    );
  }

  return (
    <OrganizationContext.Provider value={settings}>
      {children}
    </OrganizationContext.Provider>
  );
};

// Helper hooks
export const useTerminology = () => {
  const { terminology } = useOrganization();
  return terminology;
};

export const useFeatures = () => {
  const { features } = useOrganization();
  return features;
};

export const useBranding = () => {
  const { branding } = useOrganization();
  return branding;
};

export const useDashboardLayout = () => {
  const { dashboard_layout } = useOrganization();
  return dashboard_layout;
};
