import { loadApplications, summariseApplications } from "../lib/applications";
import { loadOverviewRows } from "../lib/overview";
import { loadDreamlist, groupByCategory } from "../lib/dreamlist";
import { PipelineBoard } from "./components/PipelineBoard";
import { ContactReminders } from "./components/ContactReminders";
import { DreamList } from "./components/DreamList";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";
import fs from "node:fs";
import path from "node:path";

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function DashboardPage() {
  const apps = loadApplications();
  const summary = summariseApplications(apps);
  const dreamCompanies = loadDreamlist();
  const groupedDreams = groupByCategory(dreamCompanies);

  const sentApps = apps.filter((a) => a.status === "sendt" || a.status === "forberedes");
  const interviewApps = apps.filter((a) => a.status === "intervju");
  const plannedApps = apps.filter((a) => a.type === "planlagt");
  const contactReminders = buildContactReminders(apps);
  const intervjuReminders = buildIntervjuReminders(apps);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <BodyShort
            size="small"
            className="text-xs uppercase tracking-[0.25em] text-slate-500"
          >
            Din jobbreise
          </BodyShort>
          <Heading level="1" size="large" className="mt-2">
            En rolig oversikt over alle søknadene dine
          </Heading>
          <BodyShort size="small" className="mt-2 max-w-xl text-slate-600">
            Se hvor du er i prosessen, hva som er sendt, og hvilke muligheter
            som ligger foran deg.
          </BodyShort>
        </div>
        <div className="flex gap-2">
          <Button
            as="a"
            href="/applications"
            size="small"
            variant="secondary"
          >
            Åpne søknader
          </Button>
          <Button as="a" href="/resources" size="small">
            Se ressurser
          </Button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Totalt
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.total}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            registrerte selskaper i systemet
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Sendte søknader
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.sent}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            med tilpasset CV og søknadsbrev
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Intervjuer
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.interview}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            selskaper du har kommet videre hos
          </BodyShort>
        </Panel>
        <Panel border>
          <BodyShort size="small" className="text-slate-500">
            Planlagte søknader
          </BodyShort>
          <Heading level="2" size="large" className="mt-1">
            {summary.planned}
          </Heading>
          <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
            ideer du vurderer å sende
          </BodyShort>
        </Panel>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Panel border className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <Heading level="2" size="small">
                Flyt gjennom søknadsprosessen
              </Heading>
              <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
                En enkel pipeline fra idé til intervju.
              </BodyShort>
            </div>
          </div>
          <PipelineBoard
            planned={plannedApps}
            sent={sentApps}
            interview={interviewApps}
          />
        </Panel>

        <Panel border className="space-y-4">
          <div>
            <Heading level="2" size="small">
              Hva du kan gjøre nå
            </Heading>
            <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
              Et forslag til hvilke selskaper som kan være fint å jobbe videre
              med nå.
            </BodyShort>
          </div>
          <ContactReminders reminders={contactReminders} intervjuReminders={intervjuReminders} />
        </Panel>
      </section>

      {/* Dream list section */}
      <section>
        <Panel border>
          <div className="mb-4">
            <Heading level="2" size="small">
              Drømmelista
            </Heading>
            <BodyShort size="small" className="mt-1 text-slate-500 text-[11px]">
              Selskaper du drømmer om å jobbe hos. Klikk på et selskap for å se
              din vinkel og tips.
            </BodyShort>
          </div>
          <DreamList companies={dreamCompanies} grouped={groupedDreams} />
        </Panel>
      </section>
    </div>
  );
}

type ContactType = "kontakt1" | "kontakt2" | "kontakt3" | "kontakt4" | "kontakt5";
type IntervjuType = "intervju1" | "intervju2" | "intervju3" | "intervju4";
type ReminderType = ContactType | IntervjuType;

function buildContactReminders(
  apps: ReturnType<typeof loadApplications>
): {
  id: string;
  company: string;
  type: ReminderType;
  label: string;
}[] {
  const rows = loadOverviewRows();

  return rows
    .filter((row) => {
      const status = row.status.toLowerCase();
      const isSent = status.includes("✉️") || status.includes("sendt");
      const inDialog = status.includes("dialog");
      // Bare saker som faktisk er sendt eller i dialog
      return isSent || inDialog;
    })
    .flatMap((row) => {
      const contacts = [
        row.contact1.trim(),
        row.contact2.trim(),
        row.contact3.trim(),
        row.contact4.trim(),
        row.contact5.trim()
      ];
      const app = apps.find(
        (a) => a.company === row.company && a.type === "søknad"
      );

      const items: {
        id: string;
        company: string;
        type: ContactType;
        label: string;
      }[] = [];

      // Check which contact notes exist
      const basePath = path.join(
        process.cwd(),
        "Jobb_Søknad_Pakke",
        "02_Søknader",
        "Alle selskaper",
        row.company
      );
      
      const hasNotes = [1, 2, 3, 4, 5].map((num) =>
        fs.existsSync(path.join(basePath, `Kontakt${num}-Notat.md`))
      );

      // Find the first contact that needs to be done
      for (let i = 0; i < 5; i++) {
        const contactNum = i + 1;
        const contactValue = contacts[i];
        const hasNote = hasNotes[i];
        const hasPreviousNote = i > 0 ? hasNotes[i - 1] : false;
        
        // For Kontakt 1: show if no note exists and field is empty
        // For Kontakt 2-5: show if previous note exists, current note doesn't exist, and field is empty
        const needsContact = 
          (contactNum === 1 && !hasNote && (contactValue === "" || contactValue === "-" || contactValue === "–")) ||
          (contactNum > 1 && hasPreviousNote && !hasNote && (contactValue === "" || contactValue === "-" || contactValue === "–"));

        if (!needsContact) continue;

        const contactType = `kontakt${contactNum}` as ContactType;
        let label = `Kontakt ${contactNum}`;

        if (contactNum === 1) {
          // Kontakt 1: based on sent date
          const sentDate = parseNorwegianDate(row.sentDate ?? "");
          const computeLabel = (baseDate: Date) => {
            const { daysLeft } = daysUntil(baseDate, 3);
            if (daysLeft === 0) return "Kontakt 1 · i dag";
            if (daysLeft > 0) return `Kontakt 1 · om ${daysLeft} dager`;
            return `Kontakt 1 · ${daysLeft} dager`;
          };

          if (sentDate) {
            label = computeLabel(sentDate);
          } else if (app?.sentAt) {
            label = computeLabel(app.sentAt);
          } else {
            label = "Kontakt 1 · ca. 3 dager etter sendt";
          }
        } else {
          // Kontakt 2-5: based on previous contact date
          const previousContactValue = contacts[i - 1];
          let previousDate = parseNorwegianDate(previousContactValue);
          
          // If previous contact field is empty but note exists, try to get date from file
          if (!previousDate && hasPreviousNote) {
            const previousNotePath = path.join(basePath, `Kontakt${i}-Notat.md`);
            if (fs.existsSync(previousNotePath)) {
              const stat = fs.statSync(previousNotePath);
              previousDate = stat.mtime;
            }
          }

          const computeLabel = (baseDate: Date, offsetDays: number) => {
            const { daysLeft } = daysUntil(baseDate, offsetDays);
            if (daysLeft === 0) return `Kontakt ${contactNum} · i dag`;
            if (daysLeft > 0) return `Kontakt ${contactNum} · om ${daysLeft} dager`;
            return `Kontakt ${contactNum} · ${daysLeft} dager`;
          };

          if (previousDate) {
            // Kontakt 2: 7 days after Kontakt 1, Kontakt 3-5: 7 days after previous
            const offsetDays = contactNum === 2 ? 7 : 7;
            label = computeLabel(previousDate, offsetDays);
          } else {
            label = `Kontakt ${contactNum} · ca. 7 dager etter kontakt ${contactNum - 1}`;
          }
        }

        items.push({
          id: `${row.company}-${contactType}`,
          company: row.company,
          type: contactType,
          label
        });
        
        // Only show the first contact that needs to be done
        break;
      }

      return items;
    });
}

function buildIntervjuReminders(
  apps: ReturnType<typeof loadApplications>
): {
  id: string;
  company: string;
  type: IntervjuType;
  label: string;
}[] {
  const rows = loadOverviewRows();

  return rows
    .filter((row) => {
      const status = row.status.toLowerCase();
      const isSent = status.includes("✉️") || status.includes("sendt");
      const inDialog = status.includes("dialog");
      const hasIntervju = status.includes("intervju");
      // Bare saker som faktisk er sendt, i dialog, eller har intervju
      return isSent || inDialog || hasIntervju;
    })
    .flatMap((row) => {
      const intervjuer = [
        row.intervju1.trim(),
        row.intervju2.trim(),
        row.intervju3.trim(),
        row.intervju4.trim()
      ];
      const app = apps.find(
        (a) => a.company === row.company && a.type === "søknad"
      );

      const items: {
        id: string;
        company: string;
        type: IntervjuType;
        label: string;
      }[] = [];

      // Check which interview notes exist
      const basePath = path.join(
        process.cwd(),
        "Jobb_Søknad_Pakke",
        "02_Søknader",
        "Alle selskaper",
        row.company
      );
      
      const hasNotes = [1, 2, 3, 4].map((num) =>
        fs.existsSync(path.join(basePath, `Intervju${num}-Notat.md`))
      );

      // Find the first interview that needs to be done
      for (let i = 0; i < 4; i++) {
        const intervjuNum = i + 1;
        const intervjuValue = intervjuer[i];
        const hasNote = hasNotes[i];
        const hasPreviousNote = i > 0 ? hasNotes[i - 1] : false;
        
        // For Intervju 1: show if no note exists and field is empty
        // For Intervju 2-4: show if previous note exists, current note doesn't exist, and field is empty
        const needsIntervju = 
          (intervjuNum === 1 && !hasNote && (intervjuValue === "" || intervjuValue === "-" || intervjuValue === "–")) ||
          (intervjuNum > 1 && hasPreviousNote && !hasNote && (intervjuValue === "" || intervjuValue === "-" || intervjuValue === "–"));

        if (!needsIntervju) continue;

        const intervjuType = `intervju${intervjuNum}` as IntervjuType;
        let label = `Intervju ${intervjuNum}`;

        if (intervjuNum === 1) {
          // Intervju 1: based on when interview was scheduled (use first contact date or sent date as fallback)
          const firstContactDate = parseNorwegianDate(row.contact1.trim()) || 
                                   parseNorwegianDate(row.sentDate ?? "");
          
          if (firstContactDate) {
            label = `Intervju 1 · planlagt`;
          } else {
            label = "Intervju 1 · planlagt";
          }
        } else {
          // Intervju 2-4: based on previous interview date
          const previousIntervjuValue = intervjuer[i - 1];
          let previousDate = parseNorwegianDate(previousIntervjuValue);
          
          // If previous interview field is empty but note exists, try to get date from file
          if (!previousDate && hasPreviousNote) {
            const previousNotePath = path.join(basePath, `Intervju${i}-Notat.md`);
            if (fs.existsSync(previousNotePath)) {
              const stat = fs.statSync(previousNotePath);
              previousDate = stat.mtime;
            }
          }

          if (previousDate) {
            label = `Intervju ${intervjuNum} · planlagt`;
          } else {
            label = `Intervju ${intervjuNum} · planlagt`;
          }
        }

        items.push({
          id: `${row.company}-${intervjuType}`,
          company: row.company,
          type: intervjuType,
          label
        });
        
        // Only show the first interview that needs to be done
        break;
      }

      return items;
    });
}

function daysUntil(fromDate: Date, offsetDays: number): {
  daysLeft: number;
  overdue: boolean;
} {
  const start = new Date(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate()
  );
  const due = new Date(start);
  due.setDate(due.getDate() + offsetDays);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffMs = due.getTime() - today.getTime();
  const daysLeft = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return { daysLeft, overdue: daysLeft < 0 };
}

function parseNorwegianDate(input: string): Date | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const match = trimmed.match(
    /^(\d{1,2})[.\-/](\d{1,2})(?:[.\-/](\d{2,4}))?$/
  );
  if (!match) return null;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const now = new Date();
  let year = now.getFullYear();

  if (match[3]) {
    const y = parseInt(match[3], 10);
    year = y < 100 ? 2000 + y : y;
  }

  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return null;
  return d;
}
