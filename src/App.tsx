import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Auth from "./pages/Auth";
import EmailVerified from "./pages/EmailVerified";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Warehouse from "./pages/Warehouse";
import Reports from "./pages/Reports";
import POS from "./pages/POS";
import Settings from "./pages/Settings";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import CreateOrganization from "./pages/CreateOrganization";
import OrganizationDetail from "./pages/OrganizationDetail";
import ManageSubscriptionPlans from "./pages/ManageSubscriptionPlans";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {({ isAdmin }) => (
                  <Navigate to={isAdmin ? "/dashboard" : "/pos"} replace />
                )}
              </ProtectedRoute>
            }
          />
          <Route path="/auth" element={<Auth />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Warehouse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pos"
            element={
              <ProtectedRoute>
                <POS />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          
          {/* Super Admin Routes */}
          <Route
            path="/super-admin"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/super-admin/create-organization"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <CreateOrganization />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/super-admin/organization/:id"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <OrganizationDetail />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/super-admin/subscription-plans"
            element={
              <ProtectedRoute requireSuperAdmin={true}>
                <ManageSubscriptionPlans />
              </ProtectedRoute>
            }
          />

          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
