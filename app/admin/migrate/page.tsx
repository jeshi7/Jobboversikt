"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Alert, Select, Loader } from "@navikt/ds-react";
import { useCurrentUser } from "../../../lib/hooks/useCurrentUser";
import { useToast } from "../../components/Toast";

interface ScannedApplication {
  company: string;
  jobTitle: string;
  status: string;
  location?: string;
  hasCV: boolean;
  hasCoverLetter: boolean;
  hasCvText: boolean;
  hasCoverLetterText: boolean;
}

interface ScanResult {
  success: boolean;
  applicationCount: number;
  applications: ScannedApplication[];
  hasCompetenceBank: boolean;
  hasCvMasterText: boolean;
  errors: string[];
}

interface Organization {
  id: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
}

export default function MigratePage() {
  const router = useRouter();
  const { user, loading: userLoading } = useCurrentUser();
  const { showToast } = useToast();
  
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [importResult, setImportResult] = useState<{
    success: boolean;
    applicationsCreated: number;
    competenceBankUpdated: boolean;
    errors: string[];
  } | null>(null);
  
  useEffect(() => {
    if (!userLoading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, userLoading, router]);
  
  useEffect(() => {
    if (user?.role === "admin") {
      fetchOrganizations();
    }
  }, [user]);
  
  useEffect(() => {
    if (selectedOrg) {
      fetchClients(selectedOrg);
    }
  }, [selectedOrg]);
  
  const fetchOrganizations = async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/organizations", {
        headers: { "x-session-id": sessionId || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
        if (data.length > 0) {
          setSelectedOrg(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
    }
  };
  
  const fetchClients = async (orgId: string) => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/clients?organizationId=${orgId}`, {
        headers: { "x-session-id": sessionId || "" },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data);
        if (data.length > 0) {
          setSelectedClient(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch clients:", err);
    }
  };
  
  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/migrate/scan", {
        headers: { "x-session-id": sessionId || "" },
      });
      
      if (res.ok) {
        const data = await res.json();
        setScanResult(data);
        showToast(`Fant ${data.applicationCount} søknader`, "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Kunne ikke skanne data", "error");
      }
    } catch (err) {
      showToast("Feil ved skanning av data", "error");
    } finally {
      setScanning(false);
    }
  };
  
  const handleImport = async () => {
    if (!selectedOrg || !selectedClient) {
      showToast("Velg organisasjon og klient først", "error");
      return;
    }
    
    setImporting(true);
    setImportResult(null);
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/migrate/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify({
          organizationId: selectedOrg,
          clientId: selectedClient,
        }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setImportResult(data);
        showToast(`Importerte ${data.applicationsCreated} søknader`, "success");
      } else {
        const error = await res.json();
        showToast(error.error || "Kunne ikke importere data", "error");
      }
    } catch (err) {
      showToast("Feil ved import av data", "error");
    } finally {
      setImporting(false);
    }
  };
  
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader size="xlarge" />
      </div>
    );
  }
  
  if (!user || user.role !== "admin") {
    return null;
  }
  
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <Heading level="1" size="large" className="mb-2">
        Migrer Data fra Lokal Mappe
      </Heading>
      <BodyShort className="text-slate-600 mb-8">
        Importer eksisterende jobbsøknader fra Jobb_Søknad_Pakke til Supabase
      </BodyShort>
      
      <div className="space-y-6">
        {/* Step 1: Scan */}
        <Panel border>
          <Heading level="2" size="small" className="mb-4">
            Steg 1: Skann Lokal Data
          </Heading>
          <BodyShort size="small" className="text-slate-600 mb-4">
            Skann Jobb_Søknad_Pakke-mappen for å se hvilke søknader som kan importeres.
          </BodyShort>
          
          <Button 
            variant="secondary" 
            onClick={handleScan} 
            loading={scanning}
            disabled={scanning}
          >
            {scanning ? "Skanner..." : "Skann Lokal Mappe"}
          </Button>
          
          {scanResult && (
            <div className="mt-4 space-y-4">
              {scanResult.success ? (
                <Alert variant="success">
                  Fant {scanResult.applicationCount} søknader
                  {scanResult.hasCompetenceBank && " + Kompetansebank"}
                  {scanResult.hasCvMasterText && " + CV Master"}
                </Alert>
              ) : (
                <Alert variant="warning">
                  Ingen søknader funnet. Sjekk at Jobb_Søknad_Pakke-mappen eksisterer.
                </Alert>
              )}
              
              {scanResult.errors.length > 0 && (
                <Alert variant="error">
                  <div className="space-y-1">
                    {scanResult.errors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                </Alert>
              )}
              
              {scanResult.applications.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr>
                        <th className="text-left p-2 font-medium">Bedrift</th>
                        <th className="text-left p-2 font-medium">Stilling</th>
                        <th className="text-left p-2 font-medium">Status</th>
                        <th className="text-center p-2 font-medium">CV</th>
                        <th className="text-center p-2 font-medium">Søknad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scanResult.applications.map((app, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2 font-medium">{app.company}</td>
                          <td className="p-2 text-slate-600">{app.jobTitle}</td>
                          <td className="p-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              app.status === "sendt" ? "bg-blue-100 text-blue-800" :
                              app.status === "intervju" ? "bg-green-100 text-green-800" :
                              app.status === "avslått" ? "bg-red-100 text-red-800" :
                              "bg-slate-100 text-slate-800"
                            }`}>
                              {app.status}
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {app.hasCvText ? "📝" : app.hasCV ? "📄" : "-"}
                          </td>
                          <td className="p-2 text-center">
                            {app.hasCoverLetterText ? "📝" : app.hasCoverLetter ? "📄" : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </Panel>
        
        {/* Step 2: Select Target */}
        {scanResult?.success && (
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Steg 2: Velg Destinasjon
            </Heading>
            <BodyShort size="small" className="text-slate-600 mb-4">
              Velg hvilken organisasjon og klient dataene skal importeres til.
            </BodyShort>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Organisasjon"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
              >
                {organizations.map((org) => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </Select>
              
              <Select
                label="Klient"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </Select>
            </div>
          </Panel>
        )}
        
        {/* Step 3: Import */}
        {scanResult?.success && selectedOrg && selectedClient && (
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Steg 3: Importer Data
            </Heading>
            <BodyShort size="small" className="text-slate-600 mb-4">
              Importer søknadene til Supabase. Eksisterende søknader vil bli oppdatert.
            </BodyShort>
            
            <Button 
              variant="primary" 
              onClick={handleImport} 
              loading={importing}
              disabled={importing}
            >
              {importing ? "Importerer..." : `Importer ${scanResult.applicationCount} Søknader`}
            </Button>
            
            {importResult && (
              <div className="mt-4">
                {importResult.success ? (
                  <Alert variant="success">
                    <div className="space-y-1">
                      <div>✓ Importerte {importResult.applicationsCreated} søknader</div>
                      {importResult.competenceBankUpdated && <div>✓ Oppdaterte kompetansebank</div>}
                    </div>
                  </Alert>
                ) : (
                  <Alert variant="error">Import feilet</Alert>
                )}
                
                {importResult.errors.length > 0 && (
                  <Alert variant="warning" className="mt-2">
                    <div className="space-y-1">
                      <div className="font-medium">Noen feil oppstod:</div>
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <div key={i} className="text-sm">{err}</div>
                      ))}
                      {importResult.errors.length > 5 && (
                        <div className="text-sm">...og {importResult.errors.length - 5} flere</div>
                      )}
                    </div>
                  </Alert>
                )}
              </div>
            )}
          </Panel>
        )}
        
        {/* Back button */}
        <div className="flex gap-4">
          <Button variant="tertiary" onClick={() => router.push("/admin")}>
            ← Tilbake til Admin
          </Button>
          {importResult?.success && (
            <Button variant="secondary" onClick={() => router.push("/")}>
              Gå til Oversikt →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
