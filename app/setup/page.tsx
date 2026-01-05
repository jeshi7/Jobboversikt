"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Textarea } from "@navikt/ds-react";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [needsSetup, setNeedsSetup] = useState(false);

  const [orgName, setOrgName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    checkSetupNeeded();
  }, []);

  const checkSetupNeeded = async () => {
    try {
      const res = await fetch("/api/setup/check");
      const data = await res.json();
      
      if (data.needsSetup) {
        setNeedsSetup(true);
      } else {
        router.push("/login");
      }
    } catch (err) {
      setError("Kunne ikke sjekke oppsett-status. Sjekk at Supabase er konfigurert.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (adminPassword !== confirmPassword) {
      setError("Passordene matcher ikke");
      return;
    }

    if (adminPassword.length < 8) {
      setError("Passordet må være minst 8 tegn");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/setup/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName: orgName,
          adminName,
          adminEmail,
          adminPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        // Auto-login the admin
        localStorage.setItem("sessionId", data.sessionId);
        router.push("/");
      } else {
        setError(data.error || "Noe gikk galt");
      }
    } catch (err) {
      setError("Nettverksfeil. Prøv igjen.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <BodyShort>Sjekker oppsett...</BodyShort>
      </div>
    );
  }

  if (!needsSetup) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Panel border className="w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-4">🚀</div>
          <Heading level="1" size="large">
            Velkommen til Jobboversikt
          </Heading>
          <BodyShort className="text-slate-600 mt-2">
            La oss sette opp appen for første gang
          </BodyShort>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`w-3 h-3 rounded-full transition-colors ${
                s <= step ? "bg-accent" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Heading level="2" size="small">
                1. Din organisasjon
              </Heading>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Organisasjonsnavn
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="F.eks. NAV Karriereveiledning"
                  required
                />
                <BodyShort size="small" className="text-slate-500 mt-1">
                  Dette er navnet på byrået eller organisasjonen som skal bruke appen.
                </BodyShort>
              </div>
              <Button
                type="button"
                variant="primary"
                className="w-full"
                onClick={() => orgName && setStep(2)}
                disabled={!orgName}
              >
                Neste →
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <Heading level="2" size="small">
                2. Administrator-konto
              </Heading>
              <BodyShort size="small" className="text-slate-500">
                Denne kontoen vil ha full tilgang til å administrere organisasjonen.
              </BodyShort>
              
              <div>
                <label className="block text-sm font-medium mb-1">Navn</label>
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Ditt fulle navn"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">E-post</label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="din@epost.no"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Passord</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Minst 8 tegn"
                  required
                  minLength={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bekreft passord</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-md border border-slate-300 px-4 py-3 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Skriv passordet på nytt"
                  required
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  disabled={saving}
                >
                  ← Tilbake
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={saving}
                >
                  {saving ? "Oppretter..." : "Fullfør oppsett"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Panel>
    </div>
  );
}

