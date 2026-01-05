"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { BodyShort } from "@navikt/ds-react";

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: "admin" | "consultant" | "client";
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth for public pages
      if (pathname === "/login" || pathname === "/setup") {
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // Check if setup is needed
      try {
        const setupRes = await fetch("/api/setup/check");
        const setupData = await setupRes.json();
        
        if (setupData.needsSetup) {
          router.push("/setup");
          return;
        }
      } catch {
        // If setup check fails, continue with auth check
      }

      const sessionId = localStorage.getItem("sessionId");
      
      if (!sessionId) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/auth/me?sessionId=${sessionId}`);
        
        if (res.ok) {
          const data = await res.json();
          
          // Store user in localStorage for quick access
          localStorage.setItem("user", JSON.stringify(data.user));

          // Check if user must change password
          if (data.user.mustChangePassword && pathname !== "/settings") {
            router.push("/settings");
            return;
          }

          // Check role if required
          if (requiredRole) {
            const roleHierarchy: Record<string, number> = {
              client: 1,
              consultant: 2,
              admin: 3
            };
            
            if (roleHierarchy[data.user.role] < roleHierarchy[requiredRole]) {
              router.push("/");
              return;
            }
          }

          setAuthorized(true);
        } else {
          localStorage.removeItem("sessionId");
          localStorage.removeItem("user");
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <BodyShort size="small" className="text-slate-500">Laster...</BodyShort>
      </div>
    );
  }

  if (!authorized && pathname !== "/login" && pathname !== "/setup") {
    return null;
  }

  return <>{children}</>;
}
