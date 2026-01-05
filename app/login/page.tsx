"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if setup is needed
    const checkSetup = async () => {
      try {
        const res = await fetch("/api/setup/check");
        const data = await res.json();
        
        if (data.needsSetup) {
          router.push("/setup");
          return;
        }
      } catch {
        // Continue to login page
      }
      setCheckingSetup(false);
    };
    
    checkSetup();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        const data = await res.json();
        // Store session in localStorage
        localStorage.setItem("sessionId", data.sessionId);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // If user must change password, redirect to settings
        if (data.user.mustChangePassword) {
          router.push("/settings");
        } else {
          // Redirect based on role
          if (data.user.role === "admin" || data.user.role === "consultant") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      } else {
        const data = await res.json();
        setError(data.error || "Innlogging feilet");
      }
    } catch (err) {
      setError("Nettverksfeil. Prøv igjen.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <BodyShort className="text-white">Laster...</BodyShort>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Panel border className="w-full max-w-md p-8">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📋</div>
          <Heading level="1" size="medium">
            Jobboversikt
          </Heading>
          <BodyShort size="small" className="text-slate-600 mt-1">
            Logg inn for å fortsette
          </BodyShort>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              E-post
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="din@epost.no"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Passord
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full !py-3" disabled={loading}>
            {loading ? "Logger inn..." : "Logg inn"}
          </Button>
        </form>
      </Panel>
    </div>
  );
}
