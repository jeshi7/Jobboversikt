"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Textarea } from "@navikt/ds-react";
import { useToast } from "../../components/Toast";

interface ApplicationDocument {
  id: string;
  name: string;
  type: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size: number;
}

interface Application {
  id: string;
  company: string;
  job_title: string;
  status: string;
  deadline: string | null;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  listing_url: string | null;
  angle: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cv_text: string | null;
  cover_letter_text: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  documents?: ApplicationDocument[];
}

type TabType = "info" | "cv" | "coverLetter" | "documents";

const STATUS_OPTIONS = [
  { value: "planlagt", label: "Planlagt", color: "bg-slate-100 text-slate-700" },
  { value: "forberedes", label: "Forberedes", color: "bg-blue-100 text-blue-700" },
  { value: "sendt", label: "Sendt", color: "bg-amber-100 text-amber-700" },
  { value: "intervju", label: "Intervju", color: "bg-purple-100 text-purple-700" },
  { value: "tilbud", label: "Tilbud", color: "bg-green-100 text-green-700" },
  { value: "ansatt", label: "Ansatt", color: "bg-green-200 text-green-800" },
  { value: "avslått", label: "Avslått", color: "bg-red-100 text-red-700" },
];

const DOC_TYPES = [
  { value: "cv", label: "CV" },
  { value: "cover_letter", label: "Søknadsbrev" },
  { value: "job_listing", label: "Utlysning" },
  { value: "other", label: "Annet" },
];

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { showToast } = useToast();
  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("info");
  const [editForm, setEditForm] = useState<Partial<Application>>({});
  const [editingCv, setEditingCv] = useState(false);
  const [editingCoverLetter, setEditingCoverLetter] = useState(false);

  const fetchApplication = useCallback(async () => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${params.id}?sessionId=${sessionId}`);
      
      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        setEditForm(data.application);
      } else if (res.status === 404) {
        showToast("Søknad ikke funnet", "error");
        router.push("/applications");
      } else {
        showToast("Kunne ikke laste søknad", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    } finally {
      setLoading(false);
    }
  }, [params.id, router, showToast]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleStatusChange = async (status: string) => {
    if (!app) return;
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${app.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        showToast(`Status endret til ${STATUS_OPTIONS.find(s => s.value === status)?.label}`, "success");
      } else {
        showToast("Kunne ikke endre status", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    }
  };

  const handleSave = async (fieldsToSave?: Partial<Application>) => {
    if (!app) return;
    setSaving(true);

    try {
      const sessionId = localStorage.getItem("sessionId");
      const dataToSave = fieldsToSave || editForm;
      
      const res = await fetch(`/api/app-applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify({
          company: dataToSave.company,
          jobTitle: dataToSave.job_title,
          deadline: dataToSave.deadline,
          location: dataToSave.location,
          employmentType: dataToSave.employment_type,
          salary: dataToSave.salary,
          listingUrl: dataToSave.listing_url,
          angle: dataToSave.angle,
          notes: dataToSave.notes,
          contactName: dataToSave.contact_name,
          contactEmail: dataToSave.contact_email,
          contactPhone: dataToSave.contact_phone,
          cvText: dataToSave.cv_text,
          coverLetterText: dataToSave.cover_letter_text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        setEditForm(data.application);
        setEditingCv(false);
        setEditingCoverLetter(false);
        showToast("Endringer lagret", "success");
      } else {
        showToast("Kunne ikke lagre", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: string) => {
    if (!app || !e.target.files?.[0]) return;
    
    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", docType);
      formData.append("name", file.name.replace(/\.[^/.]+$/, ""));

      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${app.id}/documents`, {
        method: "POST",
        headers: {
          "x-session-id": sessionId || "",
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        showToast(`${file.name} lastet opp`, "success");
      } else {
        const data = await res.json();
        showToast(data.error || "Kunne ikke laste opp fil", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!app) return;
    if (!confirm(`Slett ${docName}?`)) return;

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${app.id}/documents?docId=${docId}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || "",
        },
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        showToast("Dokument slettet", "success");
      } else {
        showToast("Kunne ikke slette", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    }
  };

  const handleDelete = async () => {
    if (!app) return;
    if (!confirm(`Er du sikker på at du vil slette søknaden til ${app.company}? Dette kan ikke angres.`)) return;

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${app.id}`, {
        method: "DELETE",
        headers: {
          "x-session-id": sessionId || "",
        },
      });

      if (res.ok) {
        showToast("Søknad slettet", "success");
        router.push("/applications");
      } else {
        showToast("Kunne ikke slette", "error");
      }
    } catch (error) {
      showToast("Nettverksfeil", "error");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Laster søknad...</div>;
  }

  if (!app) {
    return <div className="p-8 text-center text-slate-500">Søknad ikke funnet</div>;
  }

  const hasCvContent = app.cv_text || app.documents?.some(d => d.type === "cv");
  const hasCoverLetterContent = app.cover_letter_text || app.documents?.some(d => d.type === "cover_letter");
  const hasOtherDocuments = app.documents?.filter(d => d.type !== "cv" && d.type !== "cover_letter").length || 0;

  const tabs: { id: TabType; label: string; icon: string; badge?: boolean }[] = [
    { id: "info", label: "Info", icon: "📋" },
    { id: "cv", label: "CV", icon: "📄", badge: !!hasCvContent },
    { id: "coverLetter", label: "Søknadsbrev", icon: "✉️", badge: !!hasCoverLetterContent },
    { id: "documents", label: "Dokumenter", icon: "📎", badge: hasOtherDocuments > 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Button variant="tertiary" size="small" onClick={() => router.push("/applications")} className="mb-2">
            ← Tilbake til søknader
          </Button>
          <Heading level="1" size="large">
            {app.company}
          </Heading>
          <BodyShort size="small" className="text-slate-600 mt-1">
            {app.job_title}
          </BodyShort>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" size="small" onClick={handleDelete}>
            Slett søknad
          </Button>
        </div>
      </div>

      {/* Status bar */}
      <Panel border className="!p-4">
        <div className="flex flex-wrap items-center gap-3">
          <BodyShort size="small" className="font-medium">Status:</BodyShort>
          {STATUS_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusChange(status.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                app.status === status.value
                  ? `${status.color} ring-2 ring-offset-2 ring-accent`
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </Panel>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-accent text-accent"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.badge && (
              <span className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {activeTab === "info" && (
            <Panel border>
              <Heading level="2" size="small" className="mb-4">
                Stillingsdetaljer
              </Heading>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <BodyShort size="small" className="text-slate-500">Frist</BodyShort>
                    <BodyShort>{app.deadline || "Ikke satt"}</BodyShort>
                  </div>
                  <div>
                    <BodyShort size="small" className="text-slate-500">Sted</BodyShort>
                    <BodyShort>{app.location || "Ikke spesifisert"}</BodyShort>
                  </div>
                  <div>
                    <BodyShort size="small" className="text-slate-500">Ansettelsesform</BodyShort>
                    <BodyShort>{app.employment_type || "Ikke spesifisert"}</BodyShort>
                  </div>
                  <div>
                    <BodyShort size="small" className="text-slate-500">Lønn</BodyShort>
                    <BodyShort>{app.salary || "Ikke spesifisert"}</BodyShort>
                  </div>
                </div>
                {app.listing_url && (
                  <div>
                    <BodyShort size="small" className="text-slate-500">Utlysning</BodyShort>
                    <a 
                      href={app.listing_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm"
                    >
                      {app.listing_url}
                    </a>
                  </div>
                )}
                {app.angle && (
                  <div>
                    <BodyShort size="small" className="text-slate-500">Din vinkel</BodyShort>
                    <BodyShort className="whitespace-pre-wrap">{app.angle}</BodyShort>
                  </div>
                )}
                {app.notes && (
                  <div>
                    <BodyShort size="small" className="text-slate-500">Notater</BodyShort>
                    <BodyShort className="whitespace-pre-wrap">{app.notes}</BodyShort>
                  </div>
                )}
              </div>
            </Panel>
          )}

          {activeTab === "cv" && (
            <Panel border>
              <div className="flex items-center justify-between mb-4">
                <Heading level="2" size="small">
                  CV
                </Heading>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "cv")}
                      disabled={uploading}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                      📎 Last opp fil
                    </span>
                  </label>
                  {!editingCv && (
                    <Button variant="secondary" size="small" onClick={() => setEditingCv(true)}>
                      ✏️ Rediger tekst
                    </Button>
                  )}
                </div>
              </div>

              {/* Show uploaded CV files */}
              {app.documents && app.documents.filter(d => d.type === "cv").length > 0 && (
                <div className="mb-4 space-y-2">
                  <BodyShort size="small" className="font-medium text-slate-700">Opplastede CV-filer:</BodyShort>
                  {app.documents.filter(d => d.type === "cv").map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">📄</span>
                        <div>
                          <a
                            href={`/api/uploads/${encodeURIComponent(doc.storage_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent hover:underline"
                          >
                            {doc.name}
                          </a>
                          <BodyShort size="small" className="text-slate-500">
                            {(doc.size / 1024).toFixed(1)} KB
                          </BodyShort>
                        </div>
                      </div>
                      <Button
                        variant="tertiary"
                        size="xsmall"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        Slett
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {editingCv ? (
                <div className="space-y-4">
                  <Textarea
                    label="CV-tekst (kopier/lim inn eller skriv direkte)"
                    value={editForm.cv_text || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cv_text: e.target.value }))}
                    className="font-mono text-sm"
                    rows={20}
                    placeholder="Lim inn eller skriv CV-teksten din her..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="primary" 
                      size="small" 
                      onClick={() => handleSave(editForm)}
                      disabled={saving}
                    >
                      {saving ? "Lagrer..." : "Lagre CV-tekst"}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => {
                        setEditingCv(false);
                        setEditForm(prev => ({ ...prev, cv_text: app.cv_text }));
                      }}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : app.cv_text ? (
                <div>
                  <BodyShort size="small" className="text-slate-500 mb-2">CV-tekst:</BodyShort>
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-slate-50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                    {app.cv_text}
                  </pre>
                </div>
              ) : !app.documents?.some(d => d.type === "cv") ? (
                <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg">
                  <div className="text-4xl mb-2">📄</div>
                  <BodyShort>Ingen CV lagt til</BodyShort>
                  <BodyShort size="small" className="mt-1">
                    Last opp en fil eller skriv tekst
                  </BodyShort>
                </div>
              ) : null}
            </Panel>
          )}

          {activeTab === "coverLetter" && (
            <Panel border>
              <div className="flex items-center justify-between mb-4">
                <Heading level="2" size="small">
                  Søknadsbrev
                </Heading>
                <div className="flex gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e, "cover_letter")}
                      disabled={uploading}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors">
                      📎 Last opp fil
                    </span>
                  </label>
                  {!editingCoverLetter && (
                    <Button variant="secondary" size="small" onClick={() => setEditingCoverLetter(true)}>
                      ✏️ Rediger tekst
                    </Button>
                  )}
                </div>
              </div>

              {/* Show uploaded cover letter files */}
              {app.documents && app.documents.filter(d => d.type === "cover_letter").length > 0 && (
                <div className="mb-4 space-y-2">
                  <BodyShort size="small" className="font-medium text-slate-700">Opplastede søknadsbrev:</BodyShort>
                  {app.documents.filter(d => d.type === "cover_letter").map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">✉️</span>
                        <div>
                          <a
                            href={`/api/uploads/${encodeURIComponent(doc.storage_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent hover:underline"
                          >
                            {doc.name}
                          </a>
                          <BodyShort size="small" className="text-slate-500">
                            {(doc.size / 1024).toFixed(1)} KB
                          </BodyShort>
                        </div>
                      </div>
                      <Button
                        variant="tertiary"
                        size="xsmall"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        Slett
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {editingCoverLetter ? (
                <div className="space-y-4">
                  <Textarea
                    label="Søknadsbrev-tekst (kopier/lim inn eller skriv direkte)"
                    value={editForm.cover_letter_text || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, cover_letter_text: e.target.value }))}
                    rows={20}
                    placeholder="Skriv eller lim inn søknadsbrevet ditt her..."
                  />
                  <div className="flex gap-2">
                    <Button 
                      variant="primary" 
                      size="small" 
                      onClick={() => handleSave(editForm)}
                      disabled={saving}
                    >
                      {saving ? "Lagrer..." : "Lagre søknadsbrev-tekst"}
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="small" 
                      onClick={() => {
                        setEditingCoverLetter(false);
                        setEditForm(prev => ({ ...prev, cover_letter_text: app.cover_letter_text }));
                      }}
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              ) : app.cover_letter_text ? (
                <div>
                  <BodyShort size="small" className="text-slate-500 mb-2">Søknadsbrev-tekst:</BodyShort>
                  <div className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                    {app.cover_letter_text}
                  </div>
                </div>
              ) : !app.documents?.some(d => d.type === "cover_letter") ? (
                <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg">
                  <div className="text-4xl mb-2">✉️</div>
                  <BodyShort>Ingen søknadsbrev lagt til</BodyShort>
                  <BodyShort size="small" className="mt-1">
                    Last opp en fil eller skriv tekst
                  </BodyShort>
                </div>
              ) : null}
            </Panel>
          )}

          {activeTab === "documents" && (
            <Panel border>
              <Heading level="2" size="small" className="mb-4">
                Opplastede dokumenter
              </Heading>

              {/* Document upload buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {DOC_TYPES.map((docType) => (
                  <label key={docType.value} className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileUpload(e, docType.value)}
                      disabled={uploading}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                      + {docType.label}
                    </span>
                  </label>
                ))}
              </div>

              {uploading && (
                <BodyShort size="small" className="text-slate-500 mb-4">
                  Laster opp...
                </BodyShort>
              )}

              {/* Document list */}
              {!app.documents || app.documents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed rounded-lg">
                  <div className="text-4xl mb-2">📎</div>
                  <BodyShort>Ingen dokumenter ennå</BodyShort>
                  <BodyShort size="small" className="mt-1">
                    Last opp PDF, Word eller bildefiler
                  </BodyShort>
                </div>
              ) : (
                <div className="space-y-2">
                  {app.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {doc.mime_type.includes("pdf") ? "📄" : "🖼️"}
                        </span>
                        <div>
                          <a
                            href={`/api/uploads/${encodeURIComponent(doc.storage_path)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-accent hover:underline"
                          >
                            {doc.name}
                          </a>
                          <BodyShort size="small" className="text-slate-500">
                            {DOC_TYPES.find(t => t.value === doc.type)?.label} · {(doc.size / 1024).toFixed(1)} KB
                          </BodyShort>
                        </div>
                      </div>
                      <Button
                        variant="tertiary"
                        size="xsmall"
                        onClick={() => handleDeleteDocument(doc.id, doc.name)}
                      >
                        Slett
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Kontaktperson
            </Heading>
            {app.contact_name || app.contact_email || app.contact_phone ? (
              <div className="space-y-2">
                {app.contact_name && <BodyShort>{app.contact_name}</BodyShort>}
                {app.contact_email && (
                  <a href={`mailto:${app.contact_email}`} className="block text-accent hover:underline text-sm">
                    {app.contact_email}
                  </a>
                )}
                {app.contact_phone && (
                  <a href={`tel:${app.contact_phone}`} className="block text-accent hover:underline text-sm">
                    {app.contact_phone}
                  </a>
                )}
              </div>
            ) : (
              <BodyShort size="small" className="text-slate-400">
                Ingen kontaktinfo lagt til
              </BodyShort>
            )}
          </Panel>

          {/* Timeline */}
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Tidslinje
            </Heading>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Opprettet</span>
                <span>{new Date(app.created_at).toLocaleDateString("nb-NO")}</span>
              </div>
              {app.sent_at && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sendt</span>
                  <span>{new Date(app.sent_at).toLocaleDateString("nb-NO")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Sist oppdatert</span>
                <span>{new Date(app.updated_at).toLocaleDateString("nb-NO")}</span>
              </div>
            </div>
          </Panel>

          {/* Quick stats */}
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Innhold
            </Heading>
            <div className="space-y-2 text-sm">
              {(() => {
                const hasCvFile = app.documents?.some(d => d.type === "cv");
                const hasCvText = !!app.cv_text;
                const hasCv = hasCvFile || hasCvText;
                return (
                  <div className="flex items-center gap-2">
                    <span className={hasCv ? "text-green-600" : "text-slate-400"}>
                      {hasCv ? "✓" : "○"}
                    </span>
                    <span className={hasCv ? "" : "text-slate-400"}>
                      CV {hasCvFile && hasCvText ? "(fil + tekst)" : hasCvFile ? "(fil)" : hasCvText ? "(tekst)" : ""}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                const hasCoverLetterFile = app.documents?.some(d => d.type === "cover_letter");
                const hasCoverLetterText = !!app.cover_letter_text;
                const hasCoverLetter = hasCoverLetterFile || hasCoverLetterText;
                return (
                  <div className="flex items-center gap-2">
                    <span className={hasCoverLetter ? "text-green-600" : "text-slate-400"}>
                      {hasCoverLetter ? "✓" : "○"}
                    </span>
                    <span className={hasCoverLetter ? "" : "text-slate-400"}>
                      Søknadsbrev {hasCoverLetterFile && hasCoverLetterText ? "(fil + tekst)" : hasCoverLetterFile ? "(fil)" : hasCoverLetterText ? "(tekst)" : ""}
                    </span>
                  </div>
                );
              })()}
              {(() => {
                const otherDocs = app.documents?.filter(d => d.type !== "cv" && d.type !== "cover_letter") || [];
                return (
                  <div className="flex items-center gap-2">
                    <span className={otherDocs.length > 0 ? "text-green-600" : "text-slate-400"}>
                      {otherDocs.length > 0 ? "✓" : "○"}
                    </span>
                    <span className={otherDocs.length > 0 ? "" : "text-slate-400"}>
                      Andre dokumenter ({otherDocs.length})
                    </span>
                  </div>
                );
              })()}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
