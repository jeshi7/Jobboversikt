"use client";

import { useState, useEffect, useCallback } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "consultant" | "client";
  organizationId: string;
  mustChangePassword?: boolean;
  passwordHash?: string;
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
      const res = await fetch(`/api/auth/login?sessionId=${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Error checking auth:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const refreshUser = useCallback(() => {
    checkAuth();
  }, [checkAuth]);

  return { 
    user, 
    loading, 
    refreshUser,
    isClient: user?.role === "client", 
    isConsultant: user?.role === "consultant", 
    isAdmin: user?.role === "admin" 
  };
}







