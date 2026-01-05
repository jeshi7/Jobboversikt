"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Client } from "../../lib/db";
import { BodyShort } from "@navikt/ds-react";
import { useCurrentUser } from "../../lib/hooks/useCurrentUser";

interface Props {
  clients?: Client[];
  onClientChange?: (clientId: string) => void;
}

export function ClientSwitcher({ clients: propsClients, onClientChange }: Props = {} as Props) {
  const { user } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [clients, setClients] = useState<Client[]>(propsClients || []);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    searchParams?.get("clientId") || null
  );

  useEffect(() => {
    if (propsClients) {
      setClients(propsClients);
      return;
    }
    
    if (user?.organizationId && (user.role === "admin" || user.role === "consultant")) {
      fetch(`/api/clients?organizationId=${user.organizationId}`)
        .then(res => res.json())
        .then(data => setClients(data))
        .catch(() => {});
    }
  }, [user, propsClients]);

  if (!user || (user.role !== "admin" && user.role !== "consultant")) {
    return null;
  }

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId || null);
    if (clientId) {
      localStorage.setItem("selectedClientId", clientId);
    } else {
      localStorage.removeItem("selectedClientId");
    }
    
    if (onClientChange) {
      onClientChange(clientId);
    } else {
      router.refresh();
    }
  };

  if (clients.length === 0) {
    return (
      <BodyShort size="small" className="text-slate-500">
        Ingen klienter i systemet
      </BodyShort>
    );
  }

  const currentClientId = selectedClientId || searchParams?.get("clientId") || localStorage.getItem("selectedClientId");

  return (
    <div className="flex items-center gap-2">
      <BodyShort size="small" className="text-slate-600">
        Klient:
      </BodyShort>
      <select
        value={currentClientId || ""}
        onChange={(e) => handleClientChange(e.target.value)}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      >
        <option value="">Alle klienter</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
}

