"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Tag } from "@navikt/ds-react";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import type { Organization, Client } from "../../lib/db";

export default function AdminPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clients, setClients] = useState<Record<string, Client[]>>({});
  const [users, setUsers] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [showNewOrgForm, setShowNewOrgForm] = useState(false);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "user" | "organization";
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!userLoading && user && (user.role === "admin" || user.role === "consultant")) {
      fetchOrganizations();
    } else if (!userLoading && user?.role === "client") {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const fetchOrganizations = async () => {
    try {
      const res = await fetch("/api/organizations");
      const orgs = await res.json();
      setOrganizations(orgs);
      
      // Fetch clients and users for each org
      const clientsMap: Record<string, Client[]> = {};
      const usersMap: Record<string, any[]> = {};
      for (const org of orgs) {
        const clientsRes = await fetch(`/api/clients?organizationId=${org.id}`);
        const orgClients = await clientsRes.json();
        clientsMap[org.id] = orgClients;
        
        const usersRes = await fetch(`/api/users?organizationId=${org.id}&sessionId=${localStorage.getItem("sessionId")}`);
        const orgUsers = await usersRes.json();
        // Ensure orgUsers is an array (API might return error object)
        usersMap[org.id] = Array.isArray(orgUsers) ? orgUsers : [];
      }
      setClients(clientsMap);
      setUsers(usersMap);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;

    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug })
      });

      if (res.ok) {
        setShowNewOrgForm(false);
        fetchOrganizations();
      }
    } catch (error) {
      console.error("Error creating organization:", error);
    }
  };

  if (userLoading || loading) {
    return <div>Laster...</div>;
  }

  if (user?.role !== "admin" && user?.role !== "consultant") {
    return <div>Ingen tilgang</div>;
  }

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const role = formData.get("role") as "admin" | "consultant" | "client";
    const organizationId = formData.get("organizationId") as string;

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-session-id": sessionId || ""
        },
        body: JSON.stringify({ email, name, role, organizationId, generatePassword: true })
      });

      const data = await res.json();

      if (res.ok) {
        setShowNewUserForm(false);
        setSelectedOrgId("");
        fetchOrganizations();
        
        // Show temporary password to admin
        if (data.temporaryPassword) {
          alert(`Bruker opprettet!\n\nMidlertidig passord: ${data.temporaryPassword}\n\nDel dette med brukeren. De må endre passordet ved første innlogging.`);
        }
      } else {
        alert(`Feil: ${data.error || "Kunne ikke opprette bruker"}`);
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Kunne ikke opprette bruker");
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || ""
        }
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteConfirm(null);
        fetchOrganizations();
      } else {
        alert(`Feil: ${data.error || "Kunne ikke slette bruker"}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Kunne ikke slette bruker");
    }
  };

  const handleDeleteOrganization = async (orgId: string, orgName: string) => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || ""
        }
      });

      const data = await res.json();

      if (res.ok) {
        setDeleteConfirm(null);
        fetchOrganizations();
      } else {
        alert(`Feil: ${data.error || "Kunne ikke slette organisasjon"}`);
      }
    } catch (error) {
      console.error("Error deleting organization:", error);
      alert("Kunne ikke slette organisasjon");
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Administrasjon
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-600">
          {user?.role === "admin" 
            ? "Administrer organisasjoner, klienter og innstillinger"
            : "Oversikt over klienter og organisasjon"}
        </BodyShort>
      </header>

      <section>
        <Panel border>
          <div className="mb-4 flex items-center justify-between">
            <Heading level="2" size="small">
              Organisasjoner
            </Heading>
            {user?.role === "admin" && (
              <Button size="small" variant="primary" onClick={() => setShowNewOrgForm(true)}>
                + Ny organisasjon
              </Button>
            )}
          </div>

          {showNewOrgForm && user?.role === "admin" && (
            <form onSubmit={handleCreateOrganization} className="mb-4 space-y-3 p-4 bg-slate-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Navn</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug (URL-vennlig)</label>
                <input
                  type="text"
                  name="slug"
                  required
                  pattern="[a-z0-9-]+"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Button size="small" type="submit">Opprett</Button>
                <Button size="small" variant="secondary" onClick={() => setShowNewOrgForm(false)}>
                  Avbryt
                </Button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {organizations.map((org) => (
              <div key={org.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Heading level="3" size="xsmall" className="text-slate-900">
                      {org.name}
                    </Heading>
                    <BodyShort size="small" className="text-slate-500 text-[11px] mt-1">
                      Slug: {org.slug} • {clients[org.id]?.length || 0} klienter • {users[org.id]?.length || 0} brukere
                    </BodyShort>
                    
                    {/* Show users for this organization */}
                    {users[org.id] && users[org.id].length > 0 && (
                      <div className="mt-3 space-y-1">
                        <BodyShort size="small" className="font-medium text-slate-700">Brukere:</BodyShort>
                        {users[org.id].map((u) => (
                          <div key={u.id} className="text-xs text-slate-600 ml-2">
                            {u.name} ({u.email}) - {u.role}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag size="small" variant="neutral">
                      {org.settings.autoGenerateCV ? "Auto CV" : "Manual"}
                    </Tag>
                    <Tag size="small" variant="neutral">
                      {org.settings.autoGenerateCoverLetter ? "Auto Søknad" : "Manual"}
                    </Tag>
                    {user?.role === "admin" && (
                      <Button
                        size="xsmall"
                        variant="danger"
                        onClick={() => setDeleteConfirm({ type: "organization", id: org.id, name: org.name })}
                      >
                        Slett
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {organizations.length === 0 && (
              <BodyShort size="small" className="text-slate-500 text-center py-8">
                Ingen organisasjoner ennå. Opprett din første organisasjon for å komme i gang.
              </BodyShort>
            )}
          </div>
        </Panel>
      </section>

      {/* Users section - Admin only */}
      {user?.role === "admin" && (
        <section>
          <Panel border>
            <div className="mb-4 flex items-center justify-between">
              <Heading level="2" size="small">
                Brukere
              </Heading>
              <Button size="small" variant="primary" onClick={() => setShowNewUserForm(true)}>
                + Ny bruker
              </Button>
            </div>

            {showNewUserForm && (
              <form onSubmit={handleCreateUser} className="mb-4 space-y-3 p-4 bg-slate-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium mb-1">Organisasjon</label>
                  <select
                    name="organizationId"
                    required
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Velg organisasjon</option>
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>{org.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">E-post</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Navn</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rolle</label>
                  <select
                    name="role"
                    required
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="client">Client</option>
                    <option value="consultant">Consultant</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-2 text-xs text-blue-700">
                  Et midlertidig passord vil bli generert automatisk. Brukeren må endre passordet ved første innlogging.
                </div>
                <div className="flex gap-2">
                  <Button size="small" type="submit">Opprett</Button>
                  <Button size="small" variant="secondary" onClick={() => {
                    setShowNewUserForm(false);
                    setSelectedOrgId("");
                  }}>
                    Avbryt
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {Object.entries(users).flatMap(([orgId, orgUsers]) => 
                (Array.isArray(orgUsers) ? orgUsers : []).map(u => (
                  <div key={u.id} className="border border-slate-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{u.name}</span>
                        <span className="text-slate-500 ml-2">({u.email})</span>
                        <Tag size="small" variant="neutral" className="ml-2">{u.role}</Tag>
                        {u.mustChangePassword && (
                          <Tag size="small" variant="warning" className="ml-1">Må endre passord</Tag>
                        )}
                      </div>
                      <Button
                        size="xsmall"
                        variant="secondary"
                        className="text-red-600 hover:bg-red-50 border-red-300"
                        onClick={() => setDeleteConfirm({ type: "user", id: u.id, name: u.name })}
                      >
                        Slett
                      </Button>
                    </div>
                  </div>
                ))
              )}
              {Object.values(users).flat().length === 0 && (
                <BodyShort size="small" className="text-slate-500 text-center py-4">
                  Ingen brukere ennå. Opprett din første bruker for å komme i gang.
                </BodyShort>
              )}
            </div>
          </Panel>
        </section>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <Panel border className="w-full max-w-md p-6">
            <Heading level="2" size="small" className="mb-2">
              Bekreft sletting
            </Heading>
            <BodyShort size="small" className="mb-4 text-slate-600">
              Er du sikker på at du vil slette {deleteConfirm.type === "user" ? "brukeren" : "organisasjonen"} <strong>{deleteConfirm.name}</strong>?
              {deleteConfirm.type === "organization" && (
                <>
                  <br /><br />
                  Dette vil også slette alle tilknyttede brukere og klienter.
                </>
              )}
              <br /><br />
              Denne handlingen kan ikke angres.
            </BodyShort>
            <div className="flex gap-2">
              <Button
                size="small"
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white border-red-700"
                onClick={() => {
                  if (deleteConfirm.type === "user") {
                    handleDeleteUser(deleteConfirm.id, deleteConfirm.name);
                  } else {
                    handleDeleteOrganization(deleteConfirm.id, deleteConfirm.name);
                  }
                }}
              >
                Ja, slett
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Avbryt
              </Button>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

