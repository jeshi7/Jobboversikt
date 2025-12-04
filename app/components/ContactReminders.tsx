"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BodyShort, Tag, Button, Heading, Textarea } from "@navikt/ds-react";

type ContactType = "kontakt1" | "kontakt2" | "kontakt3" | "kontakt4" | "kontakt5";
type IntervjuType = "intervju1" | "intervju2" | "intervju3" | "intervju4";
type ReminderType = ContactType | IntervjuType;

interface Reminder {
  id: string;
  company: string;
  type: ReminderType;
  label: string;
  daysLeft?: number; // For sorting and color coding
}

interface HistoryItem {
  type: ReminderType;
  date: string | null;
  hasNote: boolean;
}

interface Props {
  reminders: Reminder[];
  intervjuReminders?: Reminder[];
}

// Helper to get urgency color
function getUrgencyColor(daysLeft: number | undefined): {
  bg: string;
  border: string;
  tag: "error" | "warning" | "success" | "neutral";
} {
  if (daysLeft === undefined) return { bg: "bg-slate-50", border: "border-borderSoft/70", tag: "neutral" };
  if (daysLeft < 0) return { bg: "bg-red-50", border: "border-red-200", tag: "error" }; // Overdue
  if (daysLeft === 0) return { bg: "bg-amber-50", border: "border-amber-200", tag: "warning" }; // Today
  if (daysLeft <= 3) return { bg: "bg-green-50", border: "border-green-200", tag: "success" }; // Soon
  return { bg: "bg-slate-50", border: "border-borderSoft/70", tag: "neutral" }; // Later
}

// Helper to get urgency label
function getUrgencyLabel(daysLeft: number | undefined): string {
  if (daysLeft === undefined) return "";
  if (daysLeft < 0) return `${Math.abs(daysLeft)} dager siden`;
  if (daysLeft === 0) return "i dag";
  return `om ${daysLeft} dager`;
}

export function ContactReminders({ reminders, intervjuReminders = [] }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kontakt" | "intervju">("kontakt");
  const [open, setOpen] = useState<Reminder | null>(null);
  const [note, setNote] = useState("");
  const [originalNote, setOriginalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewingNote, setViewingNote] = useState<{
    company: string;
    noteType: ReminderType;
    note: string;
  } | null>(null);
  const [historyPopup, setHistoryPopup] = useState<{
    company: string;
    history: HistoryItem[];
  } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const skipFetchRef = useRef(false);
  const hasUnsavedChanges = note !== originalNote;

  // Sort reminders: overdue first (negative daysLeft), then by daysLeft ascending
  const sortedReminders = [...(viewMode === "kontakt" ? reminders : intervjuReminders)].sort((a, b) => {
    const aDays = a.daysLeft ?? 999;
    const bDays = b.daysLeft ?? 999;
    return aDays - bDays;
  });

  useEffect(() => {
    if (!open) {
      setNote("");
      setOriginalNote("");
      setEditing(false);
      return;
    }

    if (skipFetchRef.current) {
      skipFetchRef.current = false;
      setOriginalNote(note);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      company: open.company,
      type: open.type
    });
    fetch(`/api/contact-notes?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { text?: string }) => {
        const existingNote = data.text ?? "";
        setNote(existingNote);
        setOriginalNote(existingNote);
        setEditing(false);
      })
      .catch(() => {
        setNote("");
        setOriginalNote("");
        setEditing(false);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!open) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/contact-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: open.company,
          type: open.type,
          text: note
        })
      });
      if (res.ok) {
        setOpen(null);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(`Kunne ikke lagre: ${res.status} ${data.message || ""}`);
      }
    } catch (err) {
      setError(`Nettverksfeil: ${err instanceof Error ? err.message : "Ukjent feil"}`);
    } finally {
      setSaving(false);
    }
  };

  // Fetch full history for a company
  const fetchHistory = async (company: string) => {
    setHistoryLoading(true);
    const history: HistoryItem[] = [];
    
    // Fetch all contact notes
    for (let i = 1; i <= 5; i++) {
      const type = `kontakt${i}` as ContactType;
      try {
        const params = new URLSearchParams({ company, type });
        const res = await fetch(`/api/contact-notes?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          history.push({
            type,
            date: null, // We could get this from the overview if needed
            hasNote: !!(data.text && data.text.trim())
          });
        }
      } catch {
        history.push({ type, date: null, hasNote: false });
      }
    }
    
    // Fetch all interview notes
    for (let i = 1; i <= 4; i++) {
      const type = `intervju${i}` as IntervjuType;
      try {
        const params = new URLSearchParams({ company, type });
        const res = await fetch(`/api/contact-notes?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          history.push({
            type,
            date: null,
            hasNote: !!(data.text && data.text.trim())
          });
        }
      } catch {
        history.push({ type, date: null, hasNote: false });
      }
    }
    
    setHistoryPopup({ company, history });
    setHistoryLoading(false);
  };

  const getAdvice = (company: string, type: ReminderType): string => {
    if (type.startsWith("intervju")) {
      return `Forbered deg på intervjuet med ${company}. Tenk gjennom spørsmål de kan stille, og hva du vil spørre dem om. Husk å være deg selv og vise entusiasme for stillingen.`;
    }
    
    const contactNum = parseInt(type.replace("kontakt", ""), 10);
    if (contactNum === 1) {
      return `Ta kontakt med ${company} for å følge opp søknaden din. Vær høflig, kortfattet og vis interesse. Spør om de har mottatt søknaden og om det er noe mer de trenger.`;
    } else {
      return `Følg opp med ${company} igjen. Vær tålmodig, men også proaktiv. Husk å referere til tidligere kontakt og vise at du fortsatt er interessert.`;
    }
  };

  if (sortedReminders.length === 0) {
    return (
      <>
        <div className="mb-4 flex gap-2">
          <Button
            size="xsmall"
            variant={viewMode === "kontakt" ? "primary" : "secondary"}
            onClick={() => setViewMode("kontakt")}
          >
            Kontakt
          </Button>
          <Button
            size="xsmall"
            variant={viewMode === "intervju" ? "primary" : "secondary"}
            onClick={() => setViewMode("intervju")}
          >
            Intervju
          </Button>
        </div>
        <BodyShort size="small" className="text-slate-500 text-[11px]">
          Ingen {viewMode === "kontakt" ? "kontakter" : "intervjuer"} å følge opp akkurat nå.
        </BodyShort>
      </>
    );
  }

  return (
    <>
      <div className="mb-4 flex gap-2">
        <Button
          size="xsmall"
          variant={viewMode === "kontakt" ? "primary" : "secondary"}
          onClick={() => setViewMode("kontakt")}
        >
          Kontakt
        </Button>
        <Button
          size="xsmall"
          variant={viewMode === "intervju" ? "primary" : "secondary"}
          onClick={() => setViewMode("intervju")}
        >
          Intervju
        </Button>
      </div>

      <ul className="space-y-2 text-sm">
        {sortedReminders.map((reminder) => {
          const isIntervju = reminder.type.startsWith("intervju");
          const num = parseInt(reminder.type.replace(/^(kontakt|intervju)/, ""), 10);
          const urgency = getUrgencyColor(reminder.daysLeft);
          
          return (
            <li
              key={reminder.id}
              className={`flex items-center justify-between rounded-xl border ${urgency.border} ${urgency.bg} px-3 py-2 transition-colors`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="font-medium text-slate-900 navds-body-short navds-body-short--small hover:underline text-left"
                    onClick={() => fetchHistory(reminder.company)}
                  >
                    {reminder.company}
                  </button>
                  {reminder.daysLeft !== undefined && reminder.daysLeft < 0 && (
                    <span className="text-[10px] text-red-600 font-medium">⚠️ Forfalt</span>
                  )}
                </div>
                <p className="text-slate-500 text-[11px] navds-body-short navds-body-short--small">
                  {isIntervju ? `Intervju ${num}` : `Kontakt ${num}`} · {getUrgencyLabel(reminder.daysLeft)}
                </p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {/* Show links to previous notes */}
                  {!isIntervju && num > 1 && [1, 2, 3, 4, 5].slice(0, num - 1).map((prevNum) => (
                    <button
                      key={prevNum}
                      type="button"
                      className="text-[11px] text-accent underline underline-offset-2"
                      onClick={async () => {
                        const prevType = `kontakt${prevNum}` as ContactType;
                        try {
                          const params = new URLSearchParams({ company: reminder.company, type: prevType });
                          const res = await fetch(`/api/contact-notes?${params.toString()}`);
                          if (res.ok) {
                            const data = await res.json();
                            setViewingNote({ company: reminder.company, noteType: prevType, note: data.text ?? "" });
                          }
                        } catch { /* Silent */ }
                      }}
                    >
                      K{prevNum}
                    </button>
                  ))}
                  {isIntervju && num > 1 && [1, 2, 3, 4].slice(0, num - 1).map((prevNum) => (
                    <button
                      key={prevNum}
                      type="button"
                      className="text-[11px] text-accent underline underline-offset-2"
                      onClick={async () => {
                        const prevType = `intervju${prevNum}` as IntervjuType;
                        try {
                          const params = new URLSearchParams({ company: reminder.company, type: prevType });
                          const res = await fetch(`/api/contact-notes?${params.toString()}`);
                          if (res.ok) {
                            const data = await res.json();
                            setViewingNote({ company: reminder.company, noteType: prevType, note: data.text ?? "" });
                          }
                        } catch { /* Silent */ }
                      }}
                    >
                      I{prevNum}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="text-[11px] text-accent underline underline-offset-2"
                    onClick={() => setOpen(reminder)}
                  >
                    + Notat
                  </button>
                </div>
              </div>
              <Tag size="small" variant={urgency.tag}>
                {isIntervju ? `I${num}` : `K${num}`}
              </Tag>
            </li>
          );
        })}
      </ul>

      {/* History Timeline Popup */}
      {historyPopup && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-subtle max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  Tidslinje: {historyPopup.company}
                </Heading>
                <BodyShort size="small" className="mt-1 text-slate-600 text-[11px]">
                  All kontakt og intervjuhistorikk
                </BodyShort>
              </div>
              <Button size="xsmall" variant="tertiary" onClick={() => setHistoryPopup(null)}>
                Lukk
              </Button>
            </div>
            
            <div className="mt-4 space-y-2">
              <BodyShort size="small" className="font-medium text-slate-700">Kontakter</BodyShort>
              <div className="space-y-1">
                {historyPopup.history.filter(h => h.type.startsWith("kontakt")).map((item) => {
                  const num = parseInt(item.type.replace("kontakt", ""), 10);
                  return (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        item.hasNote ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span className="text-sm">Kontakt {num}</span>
                      <div className="flex items-center gap-2">
                        {item.hasNote ? (
                          <>
                            <span className="text-[11px] text-green-600">✓ Notat</span>
                            <button
                              type="button"
                              className="text-[11px] text-accent underline"
                              onClick={async () => {
                                const params = new URLSearchParams({ company: historyPopup.company, type: item.type });
                                const res = await fetch(`/api/contact-notes?${params.toString()}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setViewingNote({ company: historyPopup.company, noteType: item.type, note: data.text ?? "" });
                                }
                              }}
                            >
                              Se
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] text-accent underline"
                            onClick={() => {
                              setHistoryPopup(null);
                              setOpen({
                                id: `${historyPopup.company}-${item.type}`,
                                company: historyPopup.company,
                                type: item.type,
                                label: `Kontakt ${num}`
                              });
                            }}
                          >
                            + Legg til
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <BodyShort size="small" className="font-medium text-slate-700 mt-4">Intervjuer</BodyShort>
              <div className="space-y-1">
                {historyPopup.history.filter(h => h.type.startsWith("intervju")).map((item) => {
                  const num = parseInt(item.type.replace("intervju", ""), 10);
                  return (
                    <div
                      key={item.type}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        item.hasNote ? "bg-green-50 border border-green-200" : "bg-slate-50 border border-slate-200"
                      }`}
                    >
                      <span className="text-sm">Intervju {num}</span>
                      <div className="flex items-center gap-2">
                        {item.hasNote ? (
                          <>
                            <span className="text-[11px] text-green-600">✓ Notat</span>
                            <button
                              type="button"
                              className="text-[11px] text-accent underline"
                              onClick={async () => {
                                const params = new URLSearchParams({ company: historyPopup.company, type: item.type });
                                const res = await fetch(`/api/contact-notes?${params.toString()}`);
                                if (res.ok) {
                                  const data = await res.json();
                                  setViewingNote({ company: historyPopup.company, noteType: item.type, note: data.text ?? "" });
                                }
                              }}
                            >
                              Se
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="text-[11px] text-accent underline"
                            onClick={() => {
                              setHistoryPopup(null);
                              setOpen({
                                id: `${historyPopup.company}-${item.type}`,
                                company: historyPopup.company,
                                type: item.type,
                                label: `Intervju ${num}`
                              });
                            }}
                          >
                            + Legg til
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup for adding/editing note */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  Notat for {open.type.startsWith("intervju") ? `Intervju ${open.type.replace("intervju", "")}` : `Kontakt ${open.type.replace("kontakt", "")}`}
                </Heading>
                <BodyShort size="small" className="mt-1 text-slate-600 text-[11px]">
                  {open.company}
                </BodyShort>
              </div>
              <Button size="xsmall" variant="tertiary" onClick={() => setOpen(null)}>
                Lukk
              </Button>
            </div>
            <div className="mt-4 space-y-4">
              <div className="rounded-lg border border-borderSoft bg-white p-3">
                <BodyShort size="small" className="mb-2 text-slate-700 text-[11px]">
                  {getAdvice(open.company, open.type)}
                </BodyShort>
              </div>
              <div>
                {editing || !note ? (
                  <>
                    <Textarea
                      label="Notat"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={8}
                      disabled={loading || saving}
                    />
                    {hasUnsavedChanges && !saving && (
                      <BodyShort size="small" className="mt-2 text-amber-600 text-[11px]">
                        ⚠️ Ikke lagret ennå - klikk &quot;Lagre&quot; for å lagre
                      </BodyShort>
                    )}
                    {saving && (
                      <BodyShort size="small" className="mt-2 text-blue-600 text-[11px]">
                        💾 Lagrer...
                      </BodyShort>
                    )}
                  </>
                ) : (
                  <div>
                    <BodyShort size="small" className="mb-2 text-slate-600">Notat</BodyShort>
                    <div className="rounded-lg border border-borderSoft bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap min-h-[120px]">
                      {note || "Ingen notat lagret ennå."}
                    </div>
                  </div>
                )}
              </div>
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              <div className="flex gap-2">
                {editing || !note ? (
                  <>
                    <Button size="small" variant="primary" onClick={handleSave} disabled={saving || loading}>
                      {saving ? "Lagrer..." : "Lagre"}
                    </Button>
                    {note && (
                      <Button size="small" variant="secondary" onClick={() => setEditing(false)} disabled={saving || loading}>
                        Avbryt
                      </Button>
                    )}
                  </>
                ) : (
                  <Button size="small" variant="primary" onClick={() => setEditing(true)}>
                    Rediger
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popup for viewing previous notes */}
      {viewingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  {viewingNote.noteType.startsWith("intervju") 
                    ? `Intervju ${viewingNote.noteType.replace("intervju", "")} notat`
                    : `Kontakt ${viewingNote.noteType.replace("kontakt", "")} notat`}
                </Heading>
                <BodyShort size="small" className="mt-1 text-slate-600 text-[11px]">
                  {viewingNote.company}
                </BodyShort>
              </div>
              <Button size="xsmall" variant="tertiary" onClick={() => setViewingNote(null)}>
                Lukk
              </Button>
            </div>
            <div className="mt-4">
              <div className="rounded-lg border border-borderSoft bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap min-h-[100px]">
                {viewingNote.note || "Ingen notat lagret ennå."}
              </div>
              <Button
                size="small"
                variant="secondary"
                className="mt-3"
                onClick={() => {
                  setNote(viewingNote.note);
                  setEditing(true);
                  skipFetchRef.current = true;
                  setOpen({
                    id: `${viewingNote.company}-${viewingNote.noteType}`,
                    company: viewingNote.company,
                    type: viewingNote.noteType,
                    label: viewingNote.noteType.startsWith("intervju")
                      ? `Intervju ${viewingNote.noteType.replace("intervju", "")}`
                      : `Kontakt ${viewingNote.noteType.replace("kontakt", "")}`
                  });
                  setViewingNote(null);
                }}
              >
                Rediger
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
