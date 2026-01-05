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
      const sessionId = localStorage.getItem("sessionId");
      
      if (!sessionId) {
        router.push("/login");
        return;
      }

      try {
        const res = await fetch(`/api/auth/login?sessionId=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          
          if (!data.authenticated) {
            localStorage.removeItem("sessionId");
            localStorage.removeItem("user");
            router.push("/login");
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

    // Skip auth check for login page
    if (pathname === "/login") {
      setAuthorized(true);
      setLoading(false);
      return;
    }

    checkAuth();
  }, [router, pathname, requiredRole]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <BodyShort size="small">Laster...</BodyShort>
      </div>
    );
  }

  if (!authorized && pathname !== "/login") {
    return null;
  }

  return <>{children}</>;
}







