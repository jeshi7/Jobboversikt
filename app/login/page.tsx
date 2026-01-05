"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Panel border className="w-full max-w-md p-8">
        <Heading level="1" size="medium" className="mb-2">
          Logg inn
        </Heading>
        <BodyShort size="small" className="text-slate-600 mb-6">
          Logg inn for å få tilgang til jobboversikt
        </BodyShort>

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
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Passord <span className="text-slate-400 text-xs">(valgfritt i demo)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              disabled={loading}
            />
          </div>

          {error && (
            <BodyShort size="small" className="text-red-600">
              {error}
            </BodyShort>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? "Logger inn..." : "Logg inn"}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-sm">
          <BodyShort size="small" className="font-medium text-slate-700">
            Demo-kontoer (ingen passord kreves):
          </BodyShort>
          <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg">
            <div>
              <strong>Admin:</strong> admin@demo.no
            </div>
            <div>
              <strong>Konsulent:</strong> konsulent@demo.no
            </div>
            <div>
              <strong>Klient:</strong> jessie.macharia@demo.no
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

