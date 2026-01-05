"use client";

import { useState } from "react";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";

export default function SettingsPage() {
  const { user, loading } = useCurrentUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword.length < 8) {
      setError("Passordet må være minst 8 tegn langt");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Nye passord matcher ikke");
      return;
    }

    setChanging(true);

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || ""
        },
        body: JSON.stringify({
          currentPassword: currentPassword || undefined,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setShowPasswordForm(false);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        setError(data.error || "Kunne ikke endre passord");
      }
    } catch (err) {
      setError("Nettverksfeil. Prøv igjen.");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return <div>Laster...</div>;
  }

  if (!user) {
    return <div>Du må være innlogget for å se innstillinger</div>;
  }

  // Check if user must change password (first time login)
  const mustChangePassword = (user as any).mustChangePassword;

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Innstillinger
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-600">
          Administrer din brukerkonto
        </BodyShort>
      </header>

      {mustChangePassword && (
        <Panel border className="bg-amber-50 border-amber-200">
          <Heading level="2" size="small" className="text-amber-900">
            ⚠️ Du må endre passordet ditt
          </Heading>
          <BodyShort size="small" className="mt-2 text-amber-700">
            Dette er første gang du logger inn. Vennligst endre passordet ditt før du fortsetter.
          </BodyShort>
        </Panel>
      )}

      <section>
        <Panel border>
          <Heading level="2" size="small">
            Min informasjon
          </Heading>
          <div className="mt-4 space-y-2">
            <div>
              <BodyShort size="small" className="text-slate-500">Navn</BodyShort>
              <BodyShort size="medium" className="text-slate-900">{user.name}</BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="text-slate-500">E-post</BodyShort>
              <BodyShort size="medium" className="text-slate-900">{user.email}</BodyShort>
            </div>
            <div>
              <BodyShort size="small" className="text-slate-500">Rolle</BodyShort>
              <BodyShort size="medium" className="text-slate-900 capitalize">{user.role}</BodyShort>
            </div>
          </div>
        </Panel>
      </section>

      <section>
        <Panel border>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Heading level="2" size="small">
                Passord
              </Heading>
              <BodyShort size="small" className="mt-1 text-slate-600">
                Endre ditt passord
              </BodyShort>
            </div>
            {!showPasswordForm && (
              <Button 
                size="small" 
                variant="primary"
                onClick={() => setShowPasswordForm(true)}
              >
                Endre passord
              </Button>
            )}
          </div>

          {showPasswordForm && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              {!mustChangePassword && (
                <div>
                  <label className="block text-sm font-medium mb-1">Nåværende passord</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required={!mustChangePassword}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nytt passord <span className="text-slate-400 text-xs">(minst 8 tegn)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bekreft nytt passord</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-lg border border-green-300 bg-green-50 p-3 text-sm text-green-700">
                  Passord endret vellykket!
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  size="small" 
                  type="submit"
                  disabled={changing}
                >
                  {changing ? "Endrer..." : "Lagre nytt passord"}
                </Button>
                <Button 
                  size="small" 
                  variant="secondary"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setError(null);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  disabled={changing}
                >
                  Avbryt
                </Button>
              </div>
            </form>
          )}
        </Panel>
      </section>
    </div>
  );
}

