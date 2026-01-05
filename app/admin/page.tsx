"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Tag } from "@navikt/ds-react";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import { useToast } from "../components/Toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "consultant" | "client";
  organization_id: string;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const { showToast } = useToast();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    userId: string;
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (!userLoading && user && (user.role === "admin" || user.role === "consultant")) {
      fetchData();
    } else if (!userLoading && user?.role === "client") {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const fetchData = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      
      // Fetch organization
      const orgRes = await fetch(`/api/organizations?sessionId=${sessionId}`);
      const orgs = await orgRes.json();
      if (orgs && orgs.length > 0) {
        setOrganization(orgs[0]);
      }
      
      // Fetch users
      const usersRes = await fetch(`/api/users?sessionId=${sessionId}`);
      const usersData = await usersRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      showToast("Kunne ikke laste data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as "admin" | "consultant" | "client";

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || ""
        },
        body: JSON.stringify({ email, name, role })
      });

      const data = await res.json();

      if (res.ok) {
        setShowNewUserForm(false);
        fetchData();
        
        if (data.temporaryPassword) {
          showToast(`Bruker opprettet! Midlertidig passord: ${data.temporaryPassword}`, "success");
        } else {
          showToast("Bruker opprettet!", "success");
        }
      } else {
        showToast(data.error || "Kunne ikke opprette bruker", "error");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      showToast("Kunne ikke opprette bruker", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteConfirm) return;
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/users/${deleteConfirm.userId}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || ""
        }
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteConfirm(null);
        showToast("Bruker slettet", "success");
        fetchData();
      } else {
        showToast(data.error || "Kunne ikke slette bruker", "error");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      showToast("Kunne ikke slette bruker", "error");
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <BodyShort>Laster...</BodyShort>
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "consultant") {
    return (
      <div className="flex items-center justify-center py-12">
        <BodyShort>Ingen tilgang</BodyShort>
      </div>
    );
  }

  const roleLabels: Record<string, { text: string; variant: "info" | "success" | "warning" }> = {
    admin: { text: "Admin", variant: "warning" },
    consultant: { text: "Konsulent", variant: "info" },
    client: { text: "Klient", variant: "success" },
  };

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Administrasjon
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-600">
          Administrer brukere i din organisasjon
        </BodyShort>
      </header>

      {/* Organization info */}
      <Panel border>
        <Heading level="2" size="small" className="mb-4">
          Din organisasjon
        </Heading>
        {organization ? (
          <div className="flex items-center justify-between">
            <div>
              <BodyShort className="font-medium">{organization.name}</BodyShort>
              <BodyShort size="small" className="text-slate-500">
                {users.length} brukere • Opprettet {new Date(organization.created_at).toLocaleDateString("nb-NO")}
              </BodyShort>
            </div>
          </div>
        ) : (
          <BodyShort className="text-slate-500">Ingen organisasjon funnet</BodyShort>
        )}
      </Panel>

      {/* Users */}
      <Panel border>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Heading level="2" size="small">
              Brukere
            </Heading>
            <BodyShort size="small" className="text-slate-500 mt-1">
              Administrer brukere i organisasjonen
            </BodyShort>
          </div>
          {user?.role === "admin" && (
            <Button size="small" variant="primary" onClick={() => setShowNewUserForm(true)}>
              + Ny bruker
            </Button>
          )}
        </div>

        {/* New user form */}
        {showNewUserForm && user?.role === "admin" && (
          <form onSubmit={handleCreateUser} className="mb-6 space-y-4 p-4 bg-slate-50 rounded-lg">
            <Heading level="3" size="xsmall">Opprett ny bruker</Heading>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-1">Navn</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="Fullt navn"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">E-post</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  placeholder="bruker@eksempel.no"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rolle</label>
              <select
                name="role"
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="client">Klient (jobbsøker)</option>
                <option value="consultant">Konsulent</option>
                <option value="admin">Admin</option>
              </select>
              <BodyShort size="small" className="text-slate-500 mt-1 text-xs">
                Klient: Kan se og administrere egne søknader. Konsulent: Kan se alle klienters søknader. Admin: Full tilgang.
              </BodyShort>
            </div>
            <div className="flex gap-2">
              <Button size="small" type="submit">Opprett bruker</Button>
              <Button size="small" variant="secondary" onClick={() => setShowNewUserForm(false)}>
                Avbryt
              </Button>
            </div>
            <BodyShort size="small" className="text-slate-500">
              Et midlertidig passord vil bli generert automatisk. Del dette med brukeren.
            </BodyShort>
          </form>
        )}

        {/* Users list */}
        {users.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <BodyShort>Ingen brukere ennå</BodyShort>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-medium">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <BodyShort className="font-medium">{u.name}</BodyShort>
                    <BodyShort size="small" className="text-slate-500">{u.email}</BodyShort>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Tag variant={roleLabels[u.role]?.variant || "info"} size="small">
                    {roleLabels[u.role]?.text || u.role}
                  </Tag>
                  {user?.role === "admin" && u.id !== user.id && (
                    <Button
                      variant="tertiary"
                      size="xsmall"
                      onClick={() => setDeleteConfirm({ userId: u.id, userName: u.name })}
                    >
                      Slett
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Role guide */}
      <Panel border>
        <Heading level="2" size="small" className="mb-4">
          Roller og tilganger
        </Heading>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Tag variant="success" size="small">Klient</Tag>
            <BodyShort size="small" className="text-slate-600">
              Jobbsøkere. Kan opprette og administrere sine egne søknader, laste opp CV og søknadsbrev.
            </BodyShort>
          </div>
          <div className="flex items-start gap-3">
            <Tag variant="info" size="small">Konsulent</Tag>
            <BodyShort size="small" className="text-slate-600">
              Kan se og hjelpe alle klienter i organisasjonen. Kan ikke opprette nye brukere.
            </BodyShort>
          </div>
          <div className="flex items-start gap-3">
            <Tag variant="warning" size="small">Admin</Tag>
            <BodyShort size="small" className="text-slate-600">
              Full tilgang. Kan opprette og slette brukere, samt alt konsulenter og klienter kan gjøre.
            </BodyShort>
          </div>
        </div>
      </Panel>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Panel border className="w-full max-w-md p-6">
            <Heading level="2" size="small" className="mb-4">
              Bekreft sletting
            </Heading>
            <BodyShort className="mb-6">
              Er du sikker på at du vil slette brukeren <strong>{deleteConfirm.userName}</strong>? 
              Dette kan ikke angres.
            </BodyShort>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                Avbryt
              </Button>
              <Button variant="danger" onClick={handleDeleteUser}>
                Slett bruker
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
