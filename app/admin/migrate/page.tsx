"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Alert, Loader } from "@navikt/ds-react";
import { useCurrentUser } from "../../../lib/hooks/useCurrentUser";

interface MigrationPreview {
  available: boolean;
  reason?: string;
  preview?: {
    totalApplications: number;
    hasCompetenceBank: boolean;
    hasMasterCV: boolean;
  };
}

interface MigrationResult {
  success: boolean;
  results: {
    applications: {
      success: number;
      failed: number;
      details: string[];
    };
    competenceBank: {
      success: boolean;
    };
    errors: string[];
  };
  totalApplications: number;
}

export default function MigratePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  
  const [preview, setPreview] = useState<MigrationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPreview();
  }, []);

  const fetchPreview = async () => {
    try {
      const res = await fetch("/api/migrate");
      const data = await res.json();
      setPreview(data);
    } catch (e) {
      setError("Kunne ikke hente migreringsinfo");
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!user) return;
    
    setMigrating(true);
    setError(null);
    setResult(null);

    try {
      // First, we need to get/create a client for this user
      const clientRes = await fetch("/api/clients");
      const clients = await clientRes.json();
      
      let clientId: string;
      
      if (clients && clients.length > 0) {
        clientId = clients[0].id;
      } else {
        // Create a client for this user
        const createRes = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            email: user.email,
            userId: user.id
          })
        });
        
        if (!createRes.ok) {
          throw new Error("Kunne ikke opprette klient");
        }
        
        const newClient = await createRes.json();
        clientId = newClient.id;
      }

      // Now run the migration
      const res = await fetch("/api/migrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          organizationId: user.organizationId,
          clientId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Migrering feilet");
      }

      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setMigrating(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="3xlarge" title="Laster..." />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Alert variant="error">
          Du har ikke tilgang til denne siden. Bare administratorer kan kjøre migrering.
        </Alert>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div>
        <Heading level="1" size="large">Migrer eksisterende data</Heading>
        <BodyShort className="text-slate-600 mt-2">
          Importer jobbsøknader fra Jobb_Søknad_Pakke-mappen til Supabase
        </BodyShort>
      </div>

      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}

      {!preview?.available ? (
        <Panel border className="p-6">
          <Alert variant="warning">
            <Heading level="2" size="small" className="mb-2">Migrering ikke tilgjengelig</Heading>
            <BodyShort>
              {preview?.reason || "Jobb_Søknad_Pakke-mappen ble ikke funnet, eller du kjører i produksjonsmiljø."}
            </BodyShort>
            <BodyShort className="mt-2 text-sm text-slate-600">
              Migrering kan bare kjøres lokalt (development mode) der filsystemet er tilgjengelig.
            </BodyShort>
          </Alert>
        </Panel>
      ) : result ? (
        <Panel border className="p-6 space-y-4">
          <Alert variant={result.results.errors.length === 0 ? "success" : "warning"}>
            <Heading level="2" size="small" className="mb-2">
              Migrering fullført!
            </Heading>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-700">
                {result.results.applications.success}
              </div>
              <BodyShort className="text-green-600">Søknader importert</BodyShort>
            </div>
            
            {result.results.applications.failed > 0 && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-red-700">
                  {result.results.applications.failed}
                </div>
                <BodyShort className="text-red-600">Feilet</BodyShort>
              </div>
            )}
          </div>

          {result.results.competenceBank.success && (
            <Alert variant="success" size="small">
              Kompetansebank importert
            </Alert>
          )}

          {result.results.applications.details.length > 0 && (
            <div className="mt-4">
              <Heading level="3" size="xsmall" className="mb-2">Importerte søknader:</Heading>
              <div className="max-h-60 overflow-y-auto bg-slate-50 rounded-lg p-3 text-sm font-mono">
                {result.results.applications.details.map((detail, i) => (
                  <div key={i} className="py-0.5">{detail}</div>
                ))}
              </div>
            </div>
          )}

          {result.results.errors.length > 0 && (
            <div className="mt-4">
              <Heading level="3" size="xsmall" className="mb-2 text-red-600">Feil:</Heading>
              <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3 text-sm">
                {result.results.errors.map((err, i) => (
                  <div key={i} className="py-0.5 text-red-700">{err}</div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="primary" onClick={() => router.push("/")}>
              Gå til oversikten
            </Button>
            <Button variant="secondary" onClick={() => router.push("/applications")}>
              Se søknader
            </Button>
          </div>
        </Panel>
      ) : (
        <Panel border className="p-6 space-y-4">
          <Heading level="2" size="small">Forhåndsvisning</Heading>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-700">
                {preview.preview?.totalApplications || 0}
              </div>
              <BodyShort className="text-blue-600">Søknader funnet</BodyShort>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${preview.preview?.hasCompetenceBank ? "bg-green-50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-1">
                {preview.preview?.hasCompetenceBank ? "✓" : "✗"}
              </div>
              <BodyShort className={preview.preview?.hasCompetenceBank ? "text-green-600" : "text-slate-400"}>
                Kompetansebank
              </BodyShort>
            </div>
            
            <div className={`p-4 rounded-lg text-center ${preview.preview?.hasMasterCV ? "bg-green-50" : "bg-slate-50"}`}>
              <div className="text-2xl mb-1">
                {preview.preview?.hasMasterCV ? "✓" : "✗"}
              </div>
              <BodyShort className={preview.preview?.hasMasterCV ? "text-green-600" : "text-slate-400"}>
                Master CV
              </BodyShort>
            </div>
          </div>

          <Alert variant="info" size="small">
            <BodyShort size="small">
              Migreringen vil importere alle søknader, CV-tekster, søknadsbrev og kompetansebank til Supabase-databasen.
              Eksisterende data i mappen vil ikke bli endret.
            </BodyShort>
          </Alert>

          <div className="pt-4">
            <Button 
              variant="primary" 
              onClick={handleMigrate}
              loading={migrating}
              disabled={migrating}
            >
              {migrating ? "Migrerer..." : "Start migrering"}
            </Button>
          </div>
        </Panel>
      )}

      <Panel border className="p-6">
        <Heading level="2" size="small" className="mb-3">Hva skjer under migrering?</Heading>
        <ul className="space-y-2 text-sm text-slate-600">
          <li>• Leser Søknadsoversikt.md for å få status på hver søknad</li>
          <li>• Går gjennom alle mapper i 02_Søknader/</li>
          <li>• Henter CV-profil og søknadsbrev fra hver bedriftsmappe</li>
          <li>• Importerer kompetansebank fra 01_Ressurser/Kompetansebank.md</li>
          <li>• Kobler alt til din bruker i Supabase</li>
        </ul>
      </Panel>
    </div>
  );
}

