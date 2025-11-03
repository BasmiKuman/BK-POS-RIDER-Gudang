import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2 } from "lucide-react";
import { startTracking, stopTracking, resumeTracking } from "@/lib/gps-tracking";
import { requestAllPermissions } from "@/lib/permissions";
import GPSConsentCheck from "./GPSConsentCheck";

interface ProtectedRouteProps {
  children: React.ReactNode | ((props: { isAdmin: boolean; isSuperAdmin: boolean }) => React.ReactNode);
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
}

export const ProtectedRoute = ({ children, requireAdmin = false, requireSuperAdmin = false }: ProtectedRouteProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const fetchIsAdmin = async (userId: string) => {
      try {
        console.log("🔍 Checking role for user:", userId);
        
        // Direct query to user_roles table - more reliable
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        
        if (roleError) {
          console.error("❌ Role check error:", roleError);
          console.error("Error details:", {
            message: roleError.message,
            details: roleError.details,
            hint: roleError.hint,
            code: roleError.code
          });
          if (mounted) {
            setIsAdmin(false);
            setIsSuperAdmin(false);
          }
          return;
        }
        
        console.log("✅ User role data:", roleData);
        console.log("👤 Current role:", roleData?.role);
        
        if (mounted) {
          const role = roleData?.role;
          const isSuperAdminRole = role === 'super_admin';
          const isAdminRole = role === 'admin' || role === 'super_admin';
          
          setIsSuperAdmin(isSuperAdminRole);
          setIsAdmin(isAdminRole);
          
          console.log("🎯 Role state set:", {
            role,
            isSuperAdmin: isSuperAdminRole,
            isAdmin: isAdminRole
          });
        }
      } catch (e) {
        console.error("💥 Roles check exception:", e);
        if (mounted) {
          setIsAdmin(false);
          setIsSuperAdmin(false);
        }
      }
    };

    // Subscribe FIRST to avoid missing events and keep callback synchronous
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Defer any Supabase calls to avoid deadlocks
        setTimeout(() => fetchIsAdmin(session.user!.id), 0);
        
        // Auto-start GPS tracking on login (for riders only)
        if (event === 'SIGNED_IN') {
          setTimeout(async () => {
            // Request all permissions on login
            console.log('Requesting app permissions...');
            const permissions = await requestAllPermissions();
            console.log('Permissions granted:', permissions);
            
            const { data: roles } = await supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", session.user.id)
              .eq("role", "rider")
              .maybeSingle();
            
            if (roles) {
              console.log('User logged in, starting GPS tracking...');
              await startTracking(session.user.id);
            }
          }, 1000);
        }
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
        
        // Auto-stop GPS tracking on logout
        if (event === 'SIGNED_OUT') {
          console.log('User logged out, stopping GPS tracking...');
          stopTracking();
        }
      }
    });

    // THEN get the current session to initialize state
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error("Session error:", error);
          if (mounted) setLoading(false);
          return;
        }
        if (mounted) setUser(session?.user ?? null);
        if (session?.user) {
          fetchIsAdmin(session.user.id).finally(() => {
            if (mounted) setLoading(false);
          });
          
          // Resume GPS tracking if it was active (on app restart)
          setTimeout(() => resumeTracking(session.user.id), 1500);
        } else {
          if (mounted) setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Auth check error:", err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-screen-xl mx-auto p-4 text-center pt-12">
          <div className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4">🔒</div>
          <h1 className="text-xl font-semibold mb-2">Akses Super Admin Only</h1>
          <p className="text-muted-foreground">
            Maaf, halaman ini hanya untuk Super Admin
          </p>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-screen-xl mx-auto p-4 text-center pt-12">
          <div className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-4">🔒</div>
          <h1 className="text-xl font-semibold mb-2">Akses Dibatasi</h1>
          <p className="text-muted-foreground">
            Maaf, Anda tidak memiliki akses ke halaman ini
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* GPS Consent Check for Riders */}
      <GPSConsentCheck />
      
      {/* Render protected content */}
      {typeof children === 'function' ? children({ isAdmin, isSuperAdmin }) : children}
    </>
  );
};
