"use client";

import { useState, useEffect } from "react";
import { BodyShort, Tag, Button, Heading } from "@navikt/ds-react";

interface Reminder {
  id: string;
  company: string;
  type: "kontakt1" | "kontakt2";
  label: string;
}

interface Props {
  reminders: Reminder[];
}

export function ContactReminders({ reminders }: Props) {
  const [open, setOpen] = useState<Reminder | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const fetchNote = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          company: open.company,
          type: open.type
        });
        const res = await fetch(`/api/contact-notes?${params.toString()}`);
        if (!res.ok) {
          setNote("");
          return;
        }
        const data = (await res.json()) as { text?: string };
        if (!cancelled) {
          setNote(data.text ?? "");
        }
      } catch {
        if (!cancelled) {
          setNote("");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchNote();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSave = async () => {
    if (!open) return;
    setSaving(true);
    try {
      await fetch("/api/contact-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company: open.company,
          type: open.type,
          text: note
        })
      });
      setOpen(null);
    } catch {
      // stille feil - du kan evt. vise en liten feilmelding her senere
    } finally {
      setSaving(false);
    };
  };

  return (
    <>
      <ul className="space-y-2 text-sm">
        {reminders.map((reminder) => (
          <li
            key={reminder.id}
            className="flex items-center justify-between rounded-xl border border-borderSoft/70 bg-slate-50 px-3 py-2"
          >
            <div>
              <BodyShort size="small" className="font-medium text-slate-900">
                {reminder.company}
              </BodyShort>
              <BodyShort size="small" className="text-slate-500 text-[11px]">
                {reminder.label}
              </BodyShort>
              <button
                type="button"
                className="mt-1 text-[11px] text-accent underline underline-offset-2"
                onClick={() => setOpen(reminder)}
              >
                Legg til notat
              </button>
            </div>
            <Tag size="small" variant="neutral">
              {reminder.type === "kontakt1" ? "Kontakt 1" : "Kontakt 2"}
            </Tag>
          </li>
        ))}
        {reminders.length === 0 && (
          <li className="rounded-xl border border-dashed border-borderSoft bg-slate-50 px-3 py-4 text-xs text-slate-500">
            Ingen påminnelser nå. Når du sender søknader og oppdaterer
            oversikten, dukker neste kontakt opp her.
          </li>
        )}
      </ul>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-subtle">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Heading level="2" size="small">
                  Notat for {open.type === "kontakt1" ? "Kontakt 1" : "Kontakt 2"}
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
            <div className="mt-4 space-y-3">
              <div className="space-y-1">
                <BodyShort size="small" className="text-slate-600 text-[11px]">
                  Skriv kort hvordan kontakten gikk, hva dere snakket om, og om du skal
                  følge opp igjen.
                </BodyShort>
                <BodyShort size="small" className="text-slate-500 text-[11px]">
                  {getAdvice(open)}
                </BodyShort>
              </div>
              <textarea
                className="mt-1 h-32 w-full rounded-lg border border-borderSoft bg-white p-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-accent/40"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={loading || saving}
                placeholder="F.eks. sendte e-post, fikk automatisk svar, bør ringe neste uke ..."
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() => setOpen(null)}
                disabled={saving}
              >
                Avbryt
              </Button>
              <Button
                size="small"
                onClick={handleSave}
                loading={saving}
                disabled={loading}
              >
                Lagre notat
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getAdvice(reminder: Reminder | null): string {
  if (!reminder) return "";
  const name = reminder.company.toLowerCase();
  const isFirst = reminder.type === "kontakt1";

  if (name.includes("norwegian")) {
    return isFirst
      ? "For Norwegian kan du minne kort om søknaden, trekke frem én konkret grunn til at du passer til innholdsrollen deres, og spørre forsiktig om de har hatt tid til å se på søknaden."
      : "For andre kontakt med Norwegian kan du vise til forrige kontakt, si at du fortsatt er veldig interessert, og spørre om de har landet prosessen eller vet mer om veien videre.";
  }

  if (name.includes("tankesmien")) {
    return isFirst
      ? "For Tankesmien Agenda kan du si at du liker hvordan de jobber med politisk formidling, nevne ett konkret innholdseksempel fra dem, og knytte det til hvordan du lager video/podkast."
      : "På kontakt 2 kan du vise til forrige melding, kort oppsummere hvorfor du tror du passer inn i fagmiljøet deres, og høre om de trenger mer fra deg nå.";
  }

  if (name.includes("nrc")) {
    return isFirst
      ? "For NRC kan du koble innholdet ditt til infrastrukturprosjekter: si at du liker å gjøre komplekse temaer forståelige, og spørre om de har sett søknaden din."
      : "På andre kontakt kan du vise til at du fortsatt er gira på å hjelpe dem å fortelle historiene fra prosjektene sine, og høre høflig om tidslinjen deres.";
  }

  if (name.includes("oda")) {
    return isFirst
      ? "For Oda kan du korte inn på UX-vinkelen: si at du liker hvordan de jobber med kundeopplevelse i hele verdikjeden, og at du gjerne forteller mer om hvordan du jobber med innsikt og design."
      : "Som oppfølgingskontakt kan du vise til forrige prat, og spørre om det passer å ta en kort prat om hvordan UX-teamet jobber og hvor de ser behov fremover.";
  }

  if (name.includes("js norge")) {
    return isFirst
      ? "For Js Norge kan du slå an en kreativ tone: nevne at du liker kombinasjonen av design, video og web, og tilby å sende ett konkret eksempel på et prosjekt som ligner på det de gjør."
      : "På kontakt 2 kan du følge opp med et lite eksempel på idé til kampanje eller format, og spørre om de vil ta en kort prat om hvordan du kan bidra i teamet.";
  }

  if (name.includes("ikea")) {
    return isFirst
      ? "For IKEA kan du vise til service- og kundeopplevelse, si at du liker hvordan de møter folk både i butikk og digitalt, og spørre rolig om neste steg i prosessen."
      : "På andre kontakt kan du vise til forrige melding og si at du fortsatt er interessert i å bidra til et godt kundemøte, og høre om de har en oppdatert status.";
  }

  if (name.includes("viking")) {
    return isFirst
      ? "For Viking kan du trekke fram kombinasjonen av digitalt håndverk og merkevare, og koble det til erfaringen din med visuelle historier."
      : "Som kontakt 2 kan du vise til at du fortsatt er interessert i å løfte merkevaren deres digitalt, og spørre høflig om de har tatt en avgjørelse.";
  }

  // Standard-råd for andre selskaper
  return isFirst
    ? "Til første kontakt kan du minne kort om hvem du er, hva du har søkt på, trekke frem én konkret grunn til at du passer, og spørre forsiktig om de har rukket å se på søknaden."
    : "Til andre kontakt kan du vise til forrige kontakt, si at du fortsatt er interessert, og høre rolig om de vet mer om prosessen eller tidslinjen nå.";
}


