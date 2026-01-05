"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Textarea } from "@navikt/ds-react";
import { useToast } from "./Toast";

interface NewApplicationFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

type TabType = "info" | "cv" | "coverLetter";

export function NewApplicationForm({ onClose, onSuccess }: NewApplicationFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  
  const [formData, setFormData] = useState({
    company: "",
    jobTitle: "",
    deadline: "",
    location: "",
    employmentType: "",
    salary: "",
    listingUrl: "",
    angle: "",
    notes: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    cvText: "",
    coverLetterText: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company.trim() || !formData.jobTitle.trim()) {
      showToast("Bedriftsnavn og stillingstittel er påkrevd", "error");
      setActiveTab("info");
      return;
    }

    setSaving(true);

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/app-applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Søknad opprettet for ${formData.company}`, "success");
        onSuccess?.();
        onClose();
        router.push(`/applications/${data.application.id}`);
      } else {
        const data = await res.json();
        showToast(data.error || "Kunne ikke opprette søknad", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil. Prøv igjen.", "error");
    } finally {
      setSaving(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: "info", label: "Grunninfo", icon: "📋" },
    { id: "cv", label: "CV", icon: "📄" },
    { id: "coverLetter", label: "Søknadsbrev", icon: "✉️" },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <Panel 
        border 
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="2" size="medium">
                Ny søknad
              </Heading>
              <BodyShort size="small" className="text-slate-500 mt-1">
                Legg til en ny jobbsøknad med CV og søknadsbrev
              </BodyShort>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-2xl text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-accent text-accent"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
                {tab.id === "cv" && formData.cvText && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
                {tab.id === "coverLetter" && formData.coverLetterText && (
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === "info" && (
            <div className="space-y-4">
              {/* Required fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bedriftsnavn <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => handleChange("company", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="F.eks. Google"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stillingstittel <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleChange("jobTitle", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="F.eks. Frontend-utvikler"
                    required
                  />
                </div>
              </div>

              {/* Job details */}
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Frist</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleChange("deadline", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sted</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="F.eks. Oslo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ansettelsesform</label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => handleChange("employmentType", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="">Velg...</option>
                    <option value="Fast">Fast</option>
                    <option value="Vikariat">Vikariat</option>
                    <option value="Deltid">Deltid</option>
                    <option value="Kontrakt">Kontrakt</option>
                    <option value="Frilanser">Frilanser</option>
                  </select>
                </div>
              </div>

              {/* URL and salary */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Link til utlysning</label>
                  <input
                    type="url"
                    value={formData.listingUrl}
                    onChange={(e) => handleChange("listingUrl", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lønn</label>
                  <input
                    type="text"
                    value={formData.salary}
                    onChange={(e) => handleChange("salary", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="F.eks. 600 000 - 750 000"
                  />
                </div>
              </div>

              {/* Angle */}
              <div>
                <label className="block text-sm font-medium mb-1">Din vinkel</label>
                <BodyShort size="small" className="text-slate-500 mb-2 text-xs">
                  Hvorfor passer du til denne stillingen? Hva er din unike vinkel?
                </BodyShort>
                <Textarea
                  value={formData.angle}
                  onChange={(e) => handleChange("angle", e.target.value)}
                  className="w-full"
                  rows={2}
                  placeholder="F.eks. Min erfaring med React og brukeropplevelse gjør at jeg..."
                />
              </div>

              {/* Contact info */}
              <div>
                <label className="block text-sm font-medium mb-2">Kontaktperson</label>
                <div className="grid gap-4 md:grid-cols-3">
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => handleChange("contactName", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Navn"
                  />
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleChange("contactEmail", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="E-post"
                  />
                  <input
                    type="tel"
                    value={formData.contactPhone}
                    onChange={(e) => handleChange("contactPhone", e.target.value)}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                    placeholder="Telefon"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-1">Notater</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  className="w-full"
                  rows={2}
                  placeholder="Andre notater..."
                />
              </div>
            </div>
          )}

          {activeTab === "cv" && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <BodyShort size="small" className="text-blue-800">
                  <strong>Tips:</strong> Lim inn CV-teksten din her. Du kan også laste opp en PDF-fil etter at søknaden er opprettet.
                </BodyShort>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  CV-tekst
                </label>
                <BodyShort size="small" className="text-slate-500 mb-2 text-xs">
                  Kopier og lim inn CV-en din her, eller skriv den direkte.
                </BodyShort>
                <Textarea
                  value={formData.cvText}
                  onChange={(e) => handleChange("cvText", e.target.value)}
                  className="w-full font-mono text-sm"
                  rows={15}
                  placeholder={`NAVN
Din Navn

KONTAKTINFO
Telefon: xxx xx xxx
E-post: din@epost.no
LinkedIn: linkedin.com/in/ditt-navn

SAMMENDRAG
Kort beskrivelse av deg selv og din bakgrunn...

ERFARING
Stilling - Bedrift (År - År)
• Ansvar og oppgaver
• Resultater og prestasjoner

UTDANNING
Grad - Institusjon (År)

FERDIGHETER
• Ferdighet 1
• Ferdighet 2`}
                />
              </div>

              {formData.cvText && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>CV-tekst lagt til ({formData.cvText.length} tegn)</span>
                </div>
              )}
            </div>
          )}

          {activeTab === "coverLetter" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <BodyShort size="small" className="text-amber-800">
                  <strong>Tips:</strong> Tilpass søknadsbrevet til stillingen. Bruk informasjonen fra utlysningen og vis hvordan du matcher kravene.
                </BodyShort>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Søknadsbrev
                </label>
                <BodyShort size="small" className="text-slate-500 mb-2 text-xs">
                  Skriv eller lim inn søknadsbrevet ditt her.
                </BodyShort>
                <Textarea
                  value={formData.coverLetterText}
                  onChange={(e) => handleChange("coverLetterText", e.target.value)}
                  className="w-full"
                  rows={15}
                  placeholder={`Søknad på stilling som ${formData.jobTitle || "[stillingstittel]"} hos ${formData.company || "[bedrift]"}

Kjære [kontaktperson/rekrutterer],

Jeg skriver for å søke på stillingen som ${formData.jobTitle || "[stillingstittel]"} som ble utlyst på [hvor du så annonsen].

[Første avsnitt: Hvorfor du er interessert i stillingen og bedriften]

[Andre avsnitt: Din relevante erfaring og kompetanse]

[Tredje avsnitt: Hva du kan bidra med]

Jeg ser frem til å høre fra dere.

Med vennlig hilsen,
[Ditt navn]
[Telefon]
[E-post]`}
                />
              </div>

              {formData.coverLetterText && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span>
                  <span>Søknadsbrev lagt til ({formData.coverLetterText.length} tegn)</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              {formData.cvText && <span className="flex items-center gap-1">📄 CV</span>}
              {formData.coverLetterText && <span className="flex items-center gap-1">✉️ Søknadsbrev</span>}
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
                Avbryt
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? "Oppretter..." : "Opprett søknad"}
              </Button>
            </div>
          </div>
        </form>
      </Panel>
    </div>
  );
}
