import { loadApplications, summariseApplications } from "../lib/applications";
import { loadOverviewRows } from "../lib/overview";
import { loadDreamlist, groupByCategory } from "../lib/dreamlist";
import { DashboardContent } from "./components/DashboardContent";
import { getCurrentUserServer } from "../lib/get-current-user-server";
import { getClientsByOrganization } from "../lib/db";
import fs from "node:fs";
import path from "node:path";

// Force dynamic rendering to always get fresh data
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const user = await getCurrentUserServer();
  
  // Get selected client ID from cookies/localStorage (we'll handle this on client side)
  // For now, if user is a client, find their clientId
  let clientId: string | undefined;
  if (user?.role === "client" && user?.email) {
    const clients = getClientsByOrganization(user.organizationId);
    const client = clients.find(c => c.email === user.email);
    clientId = client?.id;
  }
  
  const apps = loadApplications({
    userRole: user?.role,
    userOrganizationId: user?.organizationId,
    userId: user?.id,
    selectedClientId: clientId || undefined
  });
  const summary = summariseApplications(apps);
  const dreamCompanies = loadDreamlist();
  const groupedDreams = groupByCategory(dreamCompanies);

  const sentApps = apps.filter((a) => a.status === "sendt" || a.status === "forberedes");
  const interviewApps = apps.filter((a) => a.status === "intervju");
  const plannedApps = apps.filter((a) => a.type === "planlagt");
  const avslåttApps = apps.filter((a) => a.status === "avslått");
  const contactReminders = buildContactReminders(apps);
  const intervjuReminders = buildIntervjuReminders(apps);

  return (
    <DashboardContent
      apps={apps}
      summary={summary}
      sentApps={sentApps}
      interviewApps={interviewApps}
      plannedApps={plannedApps}
      avslåttApps={avslåttApps}
      contactReminders={contactReminders}
      intervjuReminders={intervjuReminders}
      dreamCompanies={dreamCompanies}
      groupedDreams={groupedDreams}
    />
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
      // Check if application is rejected (in Avslag folder or has avslått status)
      const app = apps.find((a) => a.company === row.company);
      const isRejected = app?.status === "avslått" || app?.folder?.includes("Avslag");
      return (isSent || inDialog) && !isRejected;
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
      // Check if application is rejected (in Avslag folder or has avslått status)
      const app = apps.find((a) => a.company === row.company);
      const isRejected = app?.status === "avslått" || app?.folder?.includes("Avslag");
      return (isSent || inDialog || hasIntervju) && !isRejected;
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
