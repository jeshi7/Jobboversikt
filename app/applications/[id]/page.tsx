"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Heading, BodyShort, Panel, Button, Tag, Textarea } from "@navikt/ds-react";
import { useToast } from "../../components/Toast";
import type { AppApplication, ApplicationStatus } from "../../../lib/app-applications";

const STATUS_OPTIONS: { value: ApplicationStatus; label: string; color: string }[] = [
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
  const [app, setApp] = useState<AppApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<AppApplication>>({});

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

  const handleStatusChange = async (status: ApplicationStatus) => {
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

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);

    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch(`/api/app-applications/${app.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": sessionId || "",
        },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        const data = await res.json();
        setApp(data.application);
        setEditing(false);
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

  const currentStatus = STATUS_OPTIONS.find(s => s.value === app.status);

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
            {app.jobTitle}
          </BodyShort>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="small" onClick={() => setEditing(!editing)}>
            {editing ? "Avbryt redigering" : "Rediger"}
          </Button>
          <Button variant="danger" size="small" onClick={handleDelete}>
            Slett
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Stillingsdetaljer
            </Heading>
            
            {editing ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bedrift</label>
                    <input
                      type="text"
                      value={editForm.company || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Stilling</label>
                    <input
                      type="text"
                      value={editForm.jobTitle || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, jobTitle: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Frist</label>
                    <input
                      type="date"
                      value={editForm.deadline || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, deadline: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sted</label>
                    <input
                      type="text"
                      value={editForm.location || ""}
                      onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Link til utlysning</label>
                  <input
                    type="url"
                    value={editForm.listingUrl || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, listingUrl: e.target.value }))}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Din vinkel</label>
                  <Textarea
                    value={editForm.angle || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, angle: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notater</label>
                  <Textarea
                    value={editForm.notes || ""}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="primary" size="small" onClick={handleSave} disabled={saving}>
                    {saving ? "Lagrer..." : "Lagre endringer"}
                  </Button>
                  <Button variant="secondary" size="small" onClick={() => setEditing(false)}>
                    Avbryt
                  </Button>
                </div>
              </div>
            ) : (
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
                    <BodyShort>{app.employmentType || "Ikke spesifisert"}</BodyShort>
                  </div>
                  <div>
                    <BodyShort size="small" className="text-slate-500">Lønn</BodyShort>
                    <BodyShort>{app.salary || "Ikke spesifisert"}</BodyShort>
                  </div>
                </div>
                {app.listingUrl && (
                  <div>
                    <BodyShort size="small" className="text-slate-500">Utlysning</BodyShort>
                    <a 
                      href={app.listingUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:underline text-sm"
                    >
                      {app.listingUrl}
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
            )}
          </Panel>

          {/* Documents */}
          <Panel border>
            <div className="flex items-center justify-between mb-4">
              <Heading level="2" size="small">
                Dokumenter
              </Heading>
            </div>

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
            {app.documents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
                <BodyShort>Ingen dokumenter ennå</BodyShort>
                <BodyShort size="small" className="mt-1">
                  Last opp CV, søknadsbrev eller andre dokumenter
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
                        {doc.mimeType.includes("pdf") ? "📄" : "🖼️"}
                      </span>
                      <div>
                        <a
                          href={`/api/uploads/${doc.filename}`}
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <Panel border>
            <Heading level="2" size="small" className="mb-4">
              Kontaktperson
            </Heading>
            {app.contactName || app.contactEmail || app.contactPhone ? (
              <div className="space-y-2">
                {app.contactName && <BodyShort>{app.contactName}</BodyShort>}
                {app.contactEmail && (
                  <a href={`mailto:${app.contactEmail}`} className="block text-accent hover:underline text-sm">
                    {app.contactEmail}
                  </a>
                )}
                {app.contactPhone && (
                  <a href={`tel:${app.contactPhone}`} className="block text-accent hover:underline text-sm">
                    {app.contactPhone}
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
                <span>{new Date(app.createdAt).toLocaleDateString("nb-NO")}</span>
              </div>
              {app.sentAt && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Sendt</span>
                  <span>{new Date(app.sentAt).toLocaleDateString("nb-NO")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Sist oppdatert</span>
                <span>{new Date(app.updatedAt).toLocaleDateString("nb-NO")}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

