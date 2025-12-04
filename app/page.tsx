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
  daysLeft?: number;
}[] {
  const rows = loadOverviewRows();

  return rows
    .filter((row) => {
      const status = row.status.toLowerCase();
      const isSent = status.includes("✉️") || status.includes("sendt");
      const inDialog = status.includes("dialog");
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
        daysLeft?: number;
      }[] = [];

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

      for (let i = 0; i < 5; i++) {
        const contactNum = i + 1;
        const contactValue = contacts[i];
        const hasNote = hasNotes[i];
        const hasPreviousNote = i > 0 ? hasNotes[i - 1] : false;
        
        const needsContact = 
          (contactNum === 1 && !hasNote && (contactValue === "" || contactValue === "-" || contactValue === "–")) ||
          (contactNum > 1 && hasPreviousNote && !hasNote && (contactValue === "" || contactValue === "-" || contactValue === "–"));

        if (!needsContact) continue;

        const contactType = `kontakt${contactNum}` as ContactType;
        let label = `Kontakt ${contactNum}`;
        let calculatedDaysLeft: number | undefined = undefined;

        if (contactNum === 1) {
          const sentDate = parseNorwegianDate(row.sentDate ?? "");
          const computeLabel = (baseDate: Date) => {
            const { daysLeft } = daysUntil(baseDate, 3);
            calculatedDaysLeft = daysLeft;
            if (daysLeft === 0) return "Kontakt 1 · i dag";
            if (daysLeft > 0) return `Kontakt 1 · om ${daysLeft} dager`;
            return `Kontakt 1 · ${Math.abs(daysLeft)} dager siden`;
          };

          if (sentDate) {
            label = computeLabel(sentDate);
          } else if (app?.sentAt) {
            label = computeLabel(app.sentAt);
          } else {
            label = "Kontakt 1 · ca. 3 dager etter sendt";
          }
        } else {
          const previousContactValue = contacts[i - 1];
          let previousDate = parseNorwegianDate(previousContactValue);
          
          if (!previousDate && hasPreviousNote) {
            const previousNotePath = path.join(basePath, `Kontakt${i}-Notat.md`);
            if (fs.existsSync(previousNotePath)) {
              const stat = fs.statSync(previousNotePath);
              previousDate = stat.mtime;
            }
          }

          const computeLabel = (baseDate: Date, offsetDays: number) => {
            const { daysLeft } = daysUntil(baseDate, offsetDays);
            calculatedDaysLeft = daysLeft;
            if (daysLeft === 0) return `Kontakt ${contactNum} · i dag`;
            if (daysLeft > 0) return `Kontakt ${contactNum} · om ${daysLeft} dager`;
            return `Kontakt ${contactNum} · ${Math.abs(daysLeft)} dager siden`;
          };

          if (previousDate) {
            const offsetDays = 7;
            label = computeLabel(previousDate, offsetDays);
          } else {
            label = `Kontakt ${contactNum} · ca. 7 dager etter kontakt ${contactNum - 1}`;
          }
        }

        items.push({
          id: `${row.company}-${contactType}`,
          company: row.company,
          type: contactType,
          label,
          daysLeft: calculatedDaysLeft
        });
        
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
  daysLeft?: number;
}[] {
  const rows = loadOverviewRows();

  return rows
    .filter((row) => {
      const status = row.status.toLowerCase();
      const isSent = status.includes("✉️") || status.includes("sendt");
      const inDialog = status.includes("dialog");
      const hasIntervju = status.includes("intervju");
      return isSent || inDialog || hasIntervju;
    })
    .flatMap((row) => {
      const intervjuer = [
        row.intervju1.trim(),
        row.intervju2.trim(),
        row.intervju3.trim(),
        row.intervju4.trim()
      ];

      const items: {
        id: string;
        company: string;
        type: IntervjuType;
        label: string;
        daysLeft?: number;
      }[] = [];

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

      for (let i = 0; i < 4; i++) {
        const intervjuNum = i + 1;
        const intervjuValue = intervjuer[i];
        const hasNote = hasNotes[i];
        const hasPreviousNote = i > 0 ? hasNotes[i - 1] : false;
        
        const needsIntervju = 
          (intervjuNum === 1 && !hasNote && (intervjuValue === "" || intervjuValue === "-" || intervjuValue === "–")) ||
          (intervjuNum > 1 && hasPreviousNote && !hasNote && (intervjuValue === "" || intervjuValue === "-" || intervjuValue === "–"));

        if (!needsIntervju) continue;

        const intervjuType = `intervju${intervjuNum}` as IntervjuType;
        // For interviews, we don't have a specific due date, so daysLeft stays undefined
        // They'll be sorted after contacts
        const label = `Intervju ${intervjuNum} · planlagt`;

        items.push({
          id: `${row.company}-${intervjuType}`,
          company: row.company,
          type: intervjuType,
          label,
          daysLeft: undefined
        });
        
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
