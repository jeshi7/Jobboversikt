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
  const [progressPopup, setProgressPopup] = useState<{
    company: string;
    currentType: ReminderType;
  } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [companyIntervjuCounts, setCompanyIntervjuCounts] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  
  const skipFetchRef = useRef(false);
  const hasUnsavedChanges = note !== originalNote;

  // Fetch intervju counts for companies when component mounts or reminders change
  useEffect(() => {
    const fetchIntervjuCounts = async () => {
      const counts: Record<string, number> = {};
      const allReminders = [...reminders, ...intervjuReminders];
      const companies = [...new Set(allReminders.map(r => r.company))];
      
      for (const company of companies) {
        let highestIntervju = 0;
        for (let i = 1; i <= 4; i++) {
          const type = `intervju${i}` as IntervjuType;
          try {
            const params = new URLSearchParams({ company, type });
            const res = await fetch(`/api/contact-notes?${params.toString()}`);
            if (res.ok) {
              const data = await res.json();
              if (data.text && data.text.trim()) {
                highestIntervju = i;
              }
            }
          } catch {
            // Ignore errors
          }
        }
        counts[company] = highestIntervju;
      }
      
      setCompanyIntervjuCounts(counts);
    };
    
    if (reminders.length > 0 || intervjuReminders.length > 0) {
      fetchIntervjuCounts();
    }
  }, [reminders, intervjuReminders]);

  // Sort reminders: overdue first (negative daysLeft), then by daysLeft ascending
  const allReminders = viewMode === "kontakt" ? reminders : intervjuReminders;
  let sortedReminders = [...allReminders].sort((a, b) => {
    const aDays = a.daysLeft ?? 999;
    const bDays = b.daysLeft ?? 999;
    return aDays - bDays;
  });

  // Filter by search query
  const filteredReminders = searchQuery.trim() 
    ? sortedReminders.filter((r) => {
        const query = searchQuery.toLowerCase();
        return r.company.toLowerCase().includes(query) || 
               r.label.toLowerCase().includes(query);
      })
    : sortedReminders;

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

  const handleProgress = async (company: string, action: "mark-intervju" | "mark-ansatt" | "mark-avslått", intervjuNum?: number) => {
    setUpdatingStatus(true);
    setError(null);
    
    try {
      const sessionId = localStorage.getItem("sessionId");
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          action,
          intervjuNum,
          sessionId
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data.ok !== false) {
        if (progressPopup) {
          setProgressPopup(null);
        }
        // Refresh the page to show updated state
        router.refresh();
      } else {
        const errorMsg = data.message || `Status: ${res.status}`;
        setError(`Kunne ikke oppdatere status: ${errorMsg}`);
        console.error("Status update failed:", { company, action, intervjuNum, error: errorMsg });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Ukjent feil";
      setError(`Nettverksfeil: ${errorMsg}`);
      console.error("Error in handleProgress:", err);
    } finally {
      setUpdatingStatus(false);
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
      <div className="mb-4 space-y-3">
        <div className="flex gap-2">
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
        {(allReminders.length > 3 || searchQuery.trim()) && (
          <input
            type="text"
            placeholder="Søk etter selskap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        )}
      </div>

      <ul className="space-y-3">
        {filteredReminders.map((reminder) => {
          const isIntervju = reminder.type.startsWith("intervju");
          const num = parseInt(reminder.type.replace(/^(kontakt|intervju)/, ""), 10);
          const urgency = getUrgencyColor(reminder.daysLeft);
          const isOverdue = reminder.daysLeft !== undefined && reminder.daysLeft < 0;
          
          return (
            <li
              key={reminder.id}
              className={`rounded-lg border-2 ${urgency.border} ${urgency.bg} p-4 transition-all hover:shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button
                      type="button"
                      className="text-base font-semibold text-slate-900 hover:text-blue-600 hover:underline truncate"
                      onClick={() => fetchHistory(reminder.company)}
                    >
                      {reminder.company}
                    </button>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 text-red-700 border border-red-200">
                        ⚠️ Forfalt
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Tag size="small" variant={urgency.tag} className="shrink-0">
                      {isIntervju ? `Intervju ${num}` : `Kontakt ${num}`}
                    </Tag>
                    {reminder.daysLeft !== undefined && (
                      <span className="text-xs text-slate-500">
                        {getUrgencyLabel(reminder.daysLeft)}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Previous notes */}
                    {!isIntervju && num > 1 && [1, 2, 3, 4, 5].slice(0, num - 1).map((prevNum) => (
                      <button
                        key={prevNum}
                        type="button"
                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
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
                        className="px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 hover:border-slate-300 transition-colors"
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
                    
                    {/* Action buttons */}
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                      onClick={() => setOpen(reminder)}
                    >
                      + Notat
                    </button>
                    
                    {!isIntervju && (
                      <>
                        {/* Intervju button - shows next intervju number */}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                          onClick={() => {
                            const nextIntervju = (companyIntervjuCounts[reminder.company] || 0) + 1;
                            handleProgress(reminder.company, "mark-intervju", nextIntervju);
                          }}
                          disabled={updatingStatus}
                        >
                          Intervju {companyIntervjuCounts[reminder.company] ? companyIntervjuCounts[reminder.company] + 1 : 1}
                        </button>
                        
                        {/* Ansatt button */}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                          onClick={() => handleProgress(reminder.company, "mark-ansatt")}
                          disabled={updatingStatus}
                        >
                          Ansatt
                        </button>
                        
                        {/* Avslag button */}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                          onClick={() => handleProgress(reminder.company, "mark-avslått")}
                          disabled={updatingStatus}
                        >
                          Avslag
                        </button>
                      </>
                    )}
                    {isIntervju && (
                      <>
                        {/* Ansatt button for intervju reminders */}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-purple-600 rounded hover:bg-purple-700 transition-colors flex items-center gap-1"
                          onClick={() => handleProgress(reminder.company, "mark-ansatt")}
                          disabled={updatingStatus}
                        >
                          Ansatt
                        </button>
                        
                        {/* Avslag button for intervju reminders */}
                        <button
                          type="button"
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                          onClick={() => handleProgress(reminder.company, "mark-avslått")}
                          disabled={updatingStatus}
                        >
                          Avslag
                        </button>
                        
                        {/* Next intervju button (if not last) */}
                        {num < 4 && (
                          <button
                            type="button"
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                            onClick={() => handleProgress(reminder.company, "mark-intervju", num + 1)}
                            disabled={updatingStatus}
                          >
                            Intervju {num + 1}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Progress Popup */}
      {progressPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  Fremdrift: {progressPopup.company}
                </Heading>
                <BodyShort size="small" className="mt-1 text-slate-600 text-[11px]">
                  {progressPopup.currentType.startsWith("intervju") 
                    ? "Hva er resultatet av intervjuet?"
                    : "Har du fått intervju?"}
                </BodyShort>
              </div>
              <Button size="xsmall" variant="tertiary" onClick={() => setProgressPopup(null)}>
                Lukk
              </Button>
            </div>
            
            <div className="mt-4 space-y-3">
              {progressPopup.currentType.startsWith("kontakt") ? (
                <>
                  <Button
                    size="small"
                    variant="primary"
                    className="w-full"
                    onClick={() => {
                      const nextIntervju = (companyIntervjuCounts[progressPopup.company] || 0) + 1;
                      handleProgress(progressPopup.company, "mark-intervju", nextIntervju);
                    }}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Oppdaterer..." : "Ja, jeg har fått intervju"}
                  </Button>
                  <BodyShort size="small" className="text-slate-500 text-[11px] text-center">
                    Dette oppdaterer status til "Intervju" og legger til Intervju 1-dato
                  </BodyShort>
                </>
              ) : (
                <>
                  <Button
                    size="small"
                    variant="primary"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleProgress(progressPopup.company, "mark-ansatt")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Oppdaterer..." : "✅ Jeg fikk jobben!"}
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => handleProgress(progressPopup.company, "mark-avslått")}
                    disabled={updatingStatus}
                  >
                    {updatingStatus ? "Oppdaterer..." : "❌ Jeg fikk avslag"}
                  </Button>
                  <BodyShort size="small" className="text-slate-500 text-[11px] text-center">
                    Dette oppdaterer status og flytter søknaden til riktig kategori
                  </BodyShort>
                </>
              )}
              
              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
