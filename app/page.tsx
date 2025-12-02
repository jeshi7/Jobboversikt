import { loadApplications, summariseApplications } from "../lib/applications";
import { loadOverviewRows } from "../lib/overview";
import { PipelineBoard } from "./components/PipelineBoard";
import { ContactReminders } from "./components/ContactReminders";
import { Heading, BodyShort, Panel, Button } from "@navikt/ds-react";

export default function DashboardPage() {
  const apps = loadApplications();
  const summary = summariseApplications(apps);

  const sentApps = apps.filter((a) => a.status === "sendt");
  const interviewApps = apps.filter((a) => a.status === "intervju");
  const plannedApps = apps.filter((a) => a.type === "planlagt");
  const contactReminders = buildContactReminders(apps);

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
          <ContactReminders reminders={contactReminders} />
        </Panel>
      </section>
    </div>
  );
}

function buildContactReminders(
  apps: ReturnType<typeof loadApplications>
): {
  id: string;
  company: string;
  type: "kontakt1" | "kontakt2";
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
      const cleanContact1 = row.contact1.trim();
      const cleanContact2 = row.contact2.trim();
      const app = apps.find(
        (a) => a.company === row.company && a.type === "søknad"
      );

      const items: {
        id: string;
        company: string;
        type: "kontakt1" | "kontakt2";
        label: string;
      }[] = [];

      const needsContact1 =
        cleanContact1 === "" || cleanContact1 === "-" || cleanContact1 === "–";
      const needsContact2 =
        !needsContact1 &&
        (cleanContact2 === "" || cleanContact2 === "-" || cleanContact2 === "–");

      if (needsContact1) {
        const sentAt = app?.sentAt;
        let label = "Kontakt 1";

        if (sentAt) {
          const { daysLeft, overdue } = daysUntil(sentAt, 3);
          label =
            daysLeft === 0
              ? "Kontakt 1 · i dag"
              : daysLeft > 0
                ? `Kontakt 1 · om ${daysLeft} dager`
                : `Kontakt 1 · ${Math.abs(daysLeft)} dager på etterskudd`;
        } else {
          label = "Kontakt 1 · ca. 3 dager etter sendt";
        }

        items.push({
          id: `${row.company}-kontakt1`,
          company: row.company,
          type: "kontakt1",
          label
        });
      } else if (needsContact2) {
        const contact1Date = parseNorwegianDate(cleanContact1);
        let label = "Kontakt 2";

        if (contact1Date) {
          const { daysLeft } = daysUntil(contact1Date, 7);
          label =
            daysLeft === 0
              ? "Kontakt 2 · i dag"
              : daysLeft > 0
                ? `Kontakt 2 · om ${daysLeft} dager`
                : `Kontakt 2 · ${Math.abs(daysLeft)} dager på etterskudd`;
        } else {
          label = "Kontakt 2 · ca. 7 dager etter kontakt 1";
        }

        items.push({
          id: `${row.company}-kontakt2`,
          company: row.company,
          type: "kontakt2",
          label
        });
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
