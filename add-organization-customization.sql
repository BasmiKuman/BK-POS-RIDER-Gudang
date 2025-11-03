-- ============================================================================
-- ADD ORGANIZATION CUSTOMIZATION COLUMNS
-- ============================================================================
-- Menambahkan kemampuan customization per organization:
-- - Branding (logo, colors, app name)
-- - Terminology (custom terms: rider, warehouse, POS, dll)
-- - Features (enable/disable modules)
-- - Dashboard Layout (widget configuration)
-- - Report Templates (custom report config)
-- ============================================================================

-- Add customization columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "primary_color": "#3b82f6",
  "secondary_color": "#8b5cf6",
  "logo_url": null,
  "favicon_url": null,
  "app_name": "BK POS"
}'::jsonb;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS terminology JSONB DEFAULT '{
  "rider": "Rider",
  "rider_plural": "Riders",
  "warehouse": "Warehouse",
  "pos": "POS",
  "product": "Product",
  "product_plural": "Products",
  "customer": "Customer",
  "customer_plural": "Customers",
  "order": "Order",
  "order_plural": "Orders",
  "return": "Return",
  "return_plural": "Returns",
  "report": "Report",
  "report_plural": "Reports",
  "dashboard": "Dashboard",
  "settings": "Settings"
}'::jsonb;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{
  "pos": true,
  "warehouse": true,
  "reports": true,
  "gps_tracking": true,
  "production_tracking": false,
  "low_stock_alerts": true,
  "returns_management": true,
  "weather_widget": false,
  "advanced_reports": false,
  "api_access": false,
  "multi_currency": false,
  "barcode_scanner": true,
  "email_notifications": true,
  "sms_notifications": false
}'::jsonb;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT '{
  "widgets": ["sales", "stock", "riders", "orders"],
  "charts": ["daily_sales", "top_products"],
  "show_weather": false,
  "show_gps_map": true,
  "default_view": "grid",
  "refresh_interval": 300
}'::jsonb;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS report_templates JSONB DEFAULT '{
  "sales_report": {
    "enabled": true,
    "fields": ["product_name", "quantity", "total", "date"],
    "grouping": ["daily", "monthly"],
    "export_formats": ["pdf", "excel"]
  },
  "stock_report": {
    "enabled": true,
    "fields": ["product_name", "stock", "category", "min_stock"],
    "show_low_stock": true,
    "export_formats": ["pdf", "excel"]
  },
  "rider_report": {
    "enabled": true,
    "fields": ["rider_name", "deliveries", "returns", "performance"],
    "show_gps_track": true,
    "export_formats": ["pdf"]
  },
  "financial_report": {
    "enabled": false,
    "fields": ["revenue", "expenses", "profit"],
    "export_formats": ["pdf", "excel"]
  }
}'::jsonb;

-- Create index for faster JSONB queries
CREATE INDEX IF NOT EXISTS idx_organizations_branding ON public.organizations USING gin (branding);
CREATE INDEX IF NOT EXISTS idx_organizations_terminology ON public.organizations USING gin (terminology);
CREATE INDEX IF NOT EXISTS idx_organizations_features ON public.organizations USING gin (features);

-- Verify the changes
SELECT 
  id, 
  name, 
  branding->>'app_name' as app_name,
  terminology->>'rider' as rider_term,
  features->>'pos' as pos_enabled,
  dashboard_layout->>'default_view' as default_view
FROM public.organizations
LIMIT 5;

-- Example: Update specific organization
-- UPDATE public.organizations
-- SET 
--   branding = jsonb_set(branding, '{app_name}', '"Warung Mbok Sri"'),
--   terminology = jsonb_set(terminology, '{rider}', '"Kurir"')
-- WHERE slug = 'warung-mbok-sri';

RAISE NOTICE '✅ Organization customization columns added successfully!';
RAISE NOTICE '📝 Now you can customize each organization branding, terminology, features, and more.';
