"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Tag, Textarea } from "@navikt/ds-react";
import type { Client } from "../../../lib/supabase-db";

interface CompetenceBank {
  id: string;
  client_id: string;
  skills: string[];
  experiences: Array<{ role: string; company: string; period: string; description: string }>;
  education: Array<{ degree: string; institution: string; period: string; description?: string }>;
  languages: Array<{ language: string; level: string }>;
  certifications: string[];
}

export default function ClientPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [competenceBank, setCompetenceBank] = useState<CompetenceBank | null>(null);
  const [jobListingText, setJobListingText] = useState("");
  const [generatedContent, setGeneratedContent] = useState<{
    cvProfile?: string;
    coverLetter?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const fetchClient = async () => {
    try {
      const res = await fetch(`/api/clients?id=${clientId}`);
      const clientData = await res.json();
      setClient(clientData);

      if (clientData.competenceBankId) {
        const bankRes = await fetch(`/api/competence-banks?id=${clientData.competenceBankId}`);
        if (bankRes.ok) {
          const bankData = await bankRes.json();
          setCompetenceBank(bankData);
        }
      }
    } catch (error) {
      console.error("Error fetching client:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !clientId) return;

    setProcessing(true);
    try {
      // Read file as text (simplified - in production, use proper PDF parsing)
      const text = await file.text();
      
      const res = await fetch("/api/agents/parse-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          cvText: text
        })
      });

      if (res.ok) {
        const bank = await res.json();
        setCompetenceBank(bank);
      }
    } catch (error) {
      console.error("Error parsing CV:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateContent = async () => {
    if (!jobListingText || !clientId || !competenceBank) return;

    setProcessing(true);
    try {
      // Extract company name from text (simplified)
      const companyMatch = jobListingText.match(/(?:bedrift|selskap|virksomhet)[:\s]+(.+)/i);
      const companyName = companyMatch ? companyMatch[1].trim() : "Selskap";

      const res = await fetch("/api/agents/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          companyName,
          jobListingText,
          type: "both"
        })
      });

      if (res.ok) {
        const content = await res.json();
        setGeneratedContent(content);
      }
    } catch (error) {
      console.error("Error generating content:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetupFolder = async () => {
    if (!jobListingText || !clientId || !client) return;

    setProcessing(true);
    try {
      const companyMatch = jobListingText.match(/(?:bedrift|selskap|virksomhet)[:\s]+(.+)/i);
      const companyName = companyMatch ? companyMatch[1].trim() : "Selskap";

      const res = await fetch("/api/agents/setup-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: client.organizationId,
          clientId,
          companyName,
          jobListingText
        })
      });

      if (res.ok) {
        const result = await res.json();
        alert(`Mappe opprettet! Filer: ${result.filesCreated.join(", ")}`);
      }
    } catch (error) {
      console.error("Error setting up folder:", error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div>Laster...</div>;
  }

  if (!client) {
    return <div>Klient ikke funnet</div>;
  }

  return (
    <div className="space-y-6">
      <header>
        <Heading level="1" size="medium">
          {client.name}
        </Heading>
        <BodyShort size="small" className="mt-1 text-slate-600">
          Klientoversikt og kompetansebank
        </BodyShort>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <Panel border>
          <Heading level="2" size="small" className="mb-4">
            Kompetansebank
          </Heading>
          
          {!competenceBank ? (
            <div className="space-y-4">
              <BodyShort size="small" className="text-slate-500">
                Last opp CV for å bygge kompetansebank automatisk
              </BodyShort>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleUploadCV}
                disabled={processing}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <BodyShort size="small" className="font-medium mb-2">Ferdigheter:</BodyShort>
                <div className="flex flex-wrap gap-2">
                  {competenceBank.skills.slice(0, 10).map((skill, i) => (
                    <Tag key={i} size="small" variant="neutral">
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
              
              {competenceBank.experiences.length > 0 && (
                <div>
                  <BodyShort size="small" className="font-medium mb-2">Erfaring:</BodyShort>
                  <div className="space-y-2">
                    {competenceBank.experiences.slice(0, 3).map((exp, i) => (
                      <div key={i} className="text-sm">
                        <strong>{exp.role}</strong> hos {exp.company}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Panel>

        <Panel border>
          <Heading level="2" size="small" className="mb-4">
            Ny utlysning
          </Heading>
          
          <div className="space-y-4">
            <Textarea
              label="Lim inn utlysningstekst"
              value={jobListingText}
              onChange={(e) => setJobListingText(e.target.value)}
              rows={8}
              disabled={processing || !competenceBank}
            />
            
            {!competenceBank && (
              <BodyShort size="small" className="text-amber-600">
                ⚠️ Du må først opprette kompetansebank ved å laste opp CV
              </BodyShort>
            )}
            
            <div className="flex gap-2">
              <Button
                size="small"
                variant="primary"
                onClick={handleGenerateContent}
                disabled={!jobListingText || !competenceBank || processing}
              >
                {processing ? "Genererer..." : "Generer CV-profil & Søknadsbrev"}
              </Button>
              
              <Button
                size="small"
                variant="secondary"
                onClick={handleSetupFolder}
                disabled={!jobListingText || processing}
              >
                {processing ? "Oppretter..." : "Opprett mappe & filer"}
              </Button>
            </div>
          </div>
        </Panel>
      </section>

      {generatedContent && (
        <section className="grid gap-6 md:grid-cols-2">
          {generatedContent.cvProfile && (
            <Panel border>
              <Heading level="2" size="small" className="mb-4">
                Generert CV-profil
              </Heading>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700">
                  {generatedContent.cvProfile}
                </pre>
              </div>
            </Panel>
          )}
          
          {generatedContent.coverLetter && (
            <Panel border>
              <Heading level="2" size="small" className="mb-4">
                Generert søknadsbrev
              </Heading>
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm text-slate-700">
                  {generatedContent.coverLetter}
                </pre>
              </div>
            </Panel>
          )}
        </section>
      )}
    </div>
  );
}







