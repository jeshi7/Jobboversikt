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
}

interface Props {
  reminders: Reminder[];
  intervjuReminders?: Reminder[];
}

export function ContactReminders({ reminders, intervjuReminders = [] }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"kontakt" | "intervju">("kontakt");
  const [open, setOpen] = useState<Reminder | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [viewingNote, setViewingNote] = useState<{
    company: string;
    noteType: ReminderType;
    note: string;
  } | null>(null);
  
  const skipFetchRef = useRef(false);

  const currentReminders = viewMode === "kontakt" ? reminders : intervjuReminders;

  useEffect(() => {
    if (!open) {
      setNote("");
      setEditing(false);
      return;
    }

    // Skip fetch if we already have the note (e.g., from viewing popup)
    if (skipFetchRef.current) {
      skipFetchRef.current = false;
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
        setEditing(false); // Start in view mode if note exists
      })
      .catch(() => {
        setNote("");
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
        // Refresh server components to update reminders
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

  const getAdvice = (company: string, type: ReminderType): string => {
    if (type.startsWith("intervju")) {
      return `Forbered deg på intervjuet med ${company}. Tenk gjennom spørsmål de kan stille, og hva du vil spørre dem om. Husk å være deg selv og vise entusiasme for stillingen.`;
    }
    
    // Contact advice (existing logic)
    const contactNum = parseInt(type.replace("kontakt", ""), 10);
    if (contactNum === 1) {
      return `Ta kontakt med ${company} for å følge opp søknaden din. Vær høflig, kortfattet og vis interesse. Spør om de har mottatt søknaden og om det er noe mer de trenger.`;
    } else {
      return `Følg opp med ${company} igjen. Vær tålmodig, men også proaktiv. Husk å referere til tidligere kontakt og vise at du fortsatt er interessert.`;
    }
  };

  if (currentReminders.length === 0) {
    return (
      <BodyShort size="small" className="text-slate-500 text-[11px]">
        Ingen {viewMode === "kontakt" ? "kontakter" : "intervjuer"} å følge opp akkurat nå.
      </BodyShort>
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
        {currentReminders.map((reminder) => {
          const isIntervju = reminder.type.startsWith("intervju");
          const num = parseInt(reminder.type.replace(/^(kontakt|intervju)/, ""), 10);
          
          return (
            <li
              key={reminder.id}
              className="flex items-center justify-between rounded-xl border border-borderSoft/70 bg-slate-50 px-3 py-2"
            >
              <div>
                <p className="font-medium text-slate-900 navds-body-short navds-body-short--small">
                  {reminder.company}
                </p>
                <p className="text-slate-500 text-[11px] navds-body-short navds-body-short--small">
                  {reminder.label}
                </p>
                {!isIntervju && num > 1 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {/* Show links to all previous contact notes */}
                    {[1, 2, 3, 4, 5].slice(0, num - 1).map((prevNum) => {
                      const prevType = `kontakt${prevNum}` as ContactType;
                      return (
                        <button
                          key={prevNum}
                          type="button"
                          className="text-[11px] text-accent underline underline-offset-2"
                          onClick={async () => {
                            try {
                              const params = new URLSearchParams({
                                company: reminder.company,
                                type: prevType
                              });
                              const res = await fetch(`/api/contact-notes?${params.toString()}`);
                              if (res.ok) {
                                const data = (await res.json()) as { text?: string };
                                setViewingNote({
                                  company: reminder.company,
                                  noteType: prevType,
                                  note: data.text ?? ""
                                });
                              }
                            } catch {
                              // Silent fail
                            }
                          }}
                        >
                          Se Kontakt {prevNum} notat
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="text-[11px] text-accent underline underline-offset-2"
                      onClick={() => setOpen(reminder)}
                    >
                      Legg til notat
                    </button>
                  </div>
                ) : isIntervju && num > 1 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {/* Show links to all previous interview notes */}
                    {[1, 2, 3, 4].slice(0, num - 1).map((prevNum) => {
                      const prevType = `intervju${prevNum}` as IntervjuType;
                      return (
                        <button
                          key={prevNum}
                          type="button"
                          className="text-[11px] text-accent underline underline-offset-2"
                          onClick={async () => {
                            try {
                              const params = new URLSearchParams({
                                company: reminder.company,
                                type: prevType
                              });
                              const res = await fetch(`/api/contact-notes?${params.toString()}`);
                              if (res.ok) {
                                const data = (await res.json()) as { text?: string };
                                setViewingNote({
                                  company: reminder.company,
                                  noteType: prevType,
                                  note: data.text ?? ""
                                });
                              }
                            } catch {
                              // Silent fail
                            }
                          }}
                        >
                          Se Intervju {prevNum} notat
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="text-[11px] text-accent underline underline-offset-2"
                      onClick={() => setOpen(reminder)}
                    >
                      Legg til notat
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="mt-1 text-[11px] text-accent underline underline-offset-2"
                    onClick={() => setOpen(reminder)}
                  >
                    Legg til notat
                  </button>
                )}
              </div>
              <Tag size="small" variant="neutral">
                {isIntervju ? `Intervju ${num}` : `Kontakt ${num}`}
              </Tag>
            </li>
          );
        })}
      </ul>

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
              <Button
                size="xsmall"
                variant="tertiary"
                onClick={() => setOpen(null)}
              >
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
                  <Textarea
                    label="Notat"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={8}
                    disabled={loading || saving}
                  />
                ) : (
                  <div>
                    <BodyShort size="small" className="mb-2 text-slate-600">
                      Notat
                    </BodyShort>
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
                    <Button
                      size="small"
                      variant="primary"
                      onClick={handleSave}
                      disabled={saving || loading}
                    >
                      {saving ? "Lagrer..." : "Lagre"}
                    </Button>
                    {note && (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setEditing(false)}
                        disabled={saving || loading}
                      >
                        Avbryt
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    size="small"
                    variant="primary"
                    onClick={() => setEditing(true)}
                  >
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
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
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
              <Button
                size="xsmall"
                variant="tertiary"
                onClick={() => setViewingNote(null)}
              >
                Lukk
              </Button>
            </div>
            <div className="mt-4">
              <div className="rounded-lg border border-borderSoft bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
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
