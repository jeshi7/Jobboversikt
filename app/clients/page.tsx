"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Tag } from "@navikt/ds-react";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";
import type { Client } from "../../lib/db";

export default function ClientsPage() {
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && user && (user.role === "admin" || user.role === "consultant")) {
      fetchClients();
    } else if (!userLoading && user?.role === "client") {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const fetchClients = async () => {
    if (!user?.organizationId) return;
    
    try {
      const res = await fetch(`/api/clients?organizationId=${user.organizationId}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
    return <div>Laster...</div>;
  }

  if (user?.role !== "admin" && user?.role !== "consultant") {
    return <div>Ingen tilgang</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          Klienter
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-600">
          Oversikt over alle klienter i din organisasjon
        </BodyShort>
      </header>

      <section>
        <Panel border>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <Panel
                key={client.id}
                border
                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/clients/${client.id}`)}
              >
                <Heading level="3" size="xsmall" className="text-slate-900">
                  {client.name}
                </Heading>
                {client.email && (
                  <BodyShort size="small" className="text-slate-500 mt-1">
                    {client.email}
                  </BodyShort>
                )}
                {client.competenceBankId && (
                  <Tag size="small" variant="success" className="mt-2">
                    Kompetansebank opprettet
                  </Tag>
                )}
              </Panel>
            ))}
            {clients.length === 0 && (
              <BodyShort size="small" className="text-slate-500 text-center py-8 col-span-full">
                Ingen klienter i systemet ennå.
              </BodyShort>
            )}
          </div>
        </Panel>
      </section>
    </div>
  );
}







