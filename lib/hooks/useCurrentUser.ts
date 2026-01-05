"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "consultant" | "client";
  organizationId: string;
  mustChangePassword?: boolean;
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/me?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          // Update localStorage with fresh data
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      } else {
        // Session invalid, clear storage
        localStorage.removeItem("sessionId");
        localStorage.removeItem("user");
        setUser(null);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Try to load from localStorage first for faster initial render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    // Then verify with server
    checkAuth();
  }, [checkAuth]);

  const refreshUser = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  const logout = useCallback(async () => {
    const sessionId = localStorage.getItem("sessionId");
    if (sessionId) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "x-session-id": sessionId,
          },
        });
      } catch {
        // Ignore errors
      }
    }
    localStorage.removeItem("sessionId");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/login";
  }, []);

  return { 
    user, 
    loading, 
    refreshUser,
    logout,
    isClient: user?.role === "client", 
    isConsultant: user?.role === "consultant", 
    isAdmin: user?.role === "admin" 
  };
}
