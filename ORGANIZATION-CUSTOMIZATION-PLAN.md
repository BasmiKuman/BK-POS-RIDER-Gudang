# 🎨 Organization Customization & White-Label Feature

## Overview
Sistem customization untuk setiap organization agar bisa:
- Custom branding (nama, logo, warna)
- Custom terminologi (rider → driver/kurir/sales, dll)
- Enable/disable features per organization
- Custom dashboard layout
- Custom report templates

## Database Schema Changes

### 1. Add Customization Columns to Organizations Table

```sql
-- Add customization columns
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS branding JSONB DEFAULT '{
  "primary_color": "#3b82f6",
  "secondary_color": "#8b5cf6",
  "logo_url": null,
  "favicon_url": null,
  "app_name": "BK POS"
}'::jsonb,
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
  "return_plural": "Returns"
}'::jsonb,
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
  "api_access": false
}'::jsonb,
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT '{
  "widgets": ["sales", "stock", "riders", "orders"],
  "charts": ["daily_sales", "top_products"],
  "show_weather": false,
  "show_gps_map": true
}'::jsonb,
ADD COLUMN IF NOT EXISTS report_templates JSONB DEFAULT '{
  "sales_report": {
    "enabled": true,
    "fields": ["product_name", "quantity", "total", "date"],
    "grouping": ["daily", "monthly"]
  },
  "stock_report": {
    "enabled": true,
    "fields": ["product_name", "stock", "category"],
    "show_low_stock": true
  },
  "rider_report": {
    "enabled": true,
    "fields": ["rider_name", "deliveries", "returns"],
    "show_gps_track": true
  }
}'::jsonb;
```

### 2. Create Organization Settings Table (Alternative)

```sql
-- Option 2: Separate table untuk granular control
CREATE TABLE IF NOT EXISTS public.organization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'branding', 'terminology', 'features', etc
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, category, key)
);
```

## UI Features

### 1. Organization Settings Page

Route: `/super-admin/organization/:id/settings`

**Tabs:**
- **Branding**: Logo, colors, app name
- **Terminology**: Customize terms (rider, warehouse, POS, dll)
- **Features**: Enable/disable modules
- **Dashboard**: Configure widget layout
- **Reports**: Configure available report templates

### 2. Edit Organization Modal Enhancement

Add "Customize" button yang opens detailed settings.

## Implementation Examples

### Example 1: Toko Elektronik
```json
{
  "app_name": "ElectroShop Manager",
  "terminology": {
    "rider": "Sales Person",
    "warehouse": "Storage",
    "product": "Item"
  },
  "features": {
    "production_tracking": false,
    "weather_widget": false,
    "advanced_reports": true
  }
}
```

### Example 2: Warung Makan
```json
{
  "app_name": "Warung Mbok Sri",
  "terminology": {
    "rider": "Kurir",
    "warehouse": "Dapur",
    "product": "Menu"
  },
  "features": {
    "production_tracking": true, // untuk masak
    "weather_widget": true,
    "returns_management": false
  }
}
```

### Example 3: Distributor
```json
{
  "app_name": "Distributor Pro",
  "terminology": {
    "rider": "Driver",
    "warehouse": "Distribution Center",
    "product": "SKU"
  },
  "features": {
    "gps_tracking": true,
    "api_access": true,
    "advanced_reports": true
  }
}
```

## Context Provider

```typescript
// src/contexts/OrganizationContext.tsx
interface OrganizationSettings {
  branding: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
    app_name: string;
  };
  terminology: {
    rider: string;
    warehouse: string;
    pos: string;
    product: string;
    // ... etc
  };
  features: {
    pos: boolean;
    warehouse: boolean;
    reports: boolean;
    // ... etc
  };
}

const OrganizationContext = createContext<OrganizationSettings | null>(null);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  return context;
};
```

## Usage in Components

```typescript
// Before:
<h1>Riders</h1>

// After:
const { terminology } = useOrganization();
<h1>{terminology.rider_plural}</h1>
```

## Benefits

### For Organizations:
✅ Brand identity terjaga (white-label)
✅ Terminologi sesuai bisnis mereka
✅ Bayar hanya untuk features yang dipakai
✅ Dashboard sesuai kebutuhan

### For You (SaaS Owner):
✅ Upsell opportunities (premium features)
✅ Lebih competitive vs generic POS
✅ Higher customer retention
✅ Differentiation per industry

## Pricing Impact

### Feature-Based Pricing:
- **Free**: Basic features only
- **Basic**: + Custom terminology
- **Pro**: + Custom branding + Advanced reports
- **Enterprise**: + White-label + API access + Custom features

## Migration Path

### Phase 1: Database Schema ✅
Add columns to organizations table

### Phase 2: Settings UI 🔄
Create Organization Settings page

### Phase 3: Context Provider 🔄
Implement OrganizationContext

### Phase 4: Component Updates 🔄
Replace hardcoded terms dengan dynamic

### Phase 5: Branding System 🔄
Apply custom colors, logo, app name

## Technical Considerations

### 1. Performance
- Cache organization settings di localStorage
- Load once on login
- Refresh only when updated

### 2. Validation
- Validate terminology length (max chars)
- Validate color hex codes
- Validate logo URL/file size

### 3. Defaults
- Always fallback to default values
- Prevent breaking UI with invalid settings

### 4. Security
- Super admin can edit all
- Org admin can edit own organization only
- Regular users read-only

## Files to Create

1. `add-organization-customization.sql` - Database migration
2. `src/pages/OrganizationSettings.tsx` - Settings page
3. `src/contexts/OrganizationContext.tsx` - Context provider
4. `src/components/CustomizationTabs.tsx` - Settings tabs UI
5. `src/hooks/useTerminology.ts` - Helper hook

## Next Steps

1. Approve this design approach
2. Create database migration
3. Build Organization Settings UI
4. Implement Context Provider
5. Update existing components

**Should we proceed with this?** 🚀
