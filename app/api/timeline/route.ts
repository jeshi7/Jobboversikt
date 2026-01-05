import { NextResponse } from "next/server";
import { loadOverviewRows } from "../../../lib/overview";
import fs from "node:fs";
import path from "node:path";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  if (!company) {
    return NextResponse.json({ error: "Company required" }, { status: 400 });
  }

  const rows = loadOverviewRows();
  const row = rows.find((r) => r.company.toLowerCase() === company.toLowerCase());

  if (!row) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  interface TimelineEvent {
    type: "søknad" | "kontakt" | "intervju" | "resultat";
    date: string;
    label: string;
    note?: string;
  }

  const events: TimelineEvent[] = [];

  // Parse Norwegian date format
  function parseDate(dateStr: string): Date | null {
    if (!dateStr || dateStr.trim() === "" || dateStr === "-" || dateStr === "–") {
      return null;
    }
    const parts = dateStr.trim().split(/[.\-]/);
    if (parts.length >= 2) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
      const fullYear = year < 100 ? 2000 + year : year;
      const date = new Date(fullYear, month, day);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    return null;
  }

  // Add søknad date
  if (row.sentDate) {
    const date = parseDate(row.sentDate);
    if (date) {
      events.push({
        type: "søknad",
        date: date.toISOString(),
        label: "Søknad sendt"
      });
    }
  }

  // Add contact dates
  const contacts = [row.contact1, row.contact2, row.contact3, row.contact4, row.contact5];
  contacts.forEach((contact, index) => {
    const date = parseDate(contact);
    if (date) {
      events.push({
        type: "kontakt",
        date: date.toISOString(),
        label: `Kontakt ${index + 1}`
      });
    }
  });

  // Add interview dates
  const interviews = [row.intervju1, row.intervju2, row.intervju3, row.intervju4];
  interviews.forEach((interview, index) => {
    const date = parseDate(interview);
    if (date) {
      events.push({
        type: "intervju",
        date: date.toISOString(),
        label: `Intervju ${index + 1}`
      });
    }
  });

  // Check for result based on status
  if (row.status.includes("Avslått")) {
    events.push({
      type: "resultat",
      date: new Date().toISOString(), // Approximate
      label: "Avslag"
    });
  } else if (row.status.includes("Ansatt")) {
    events.push({
      type: "resultat",
      date: new Date().toISOString(), // Approximate
      label: "Ansatt"
    });
  }

  // Check for notes
  const basePath = path.join(
    process.cwd(),
    "Jobb_Søknad_Pakke",
    "02_Søknader",
    "Alle selskaper",
    company
  );

  // Try to get file modification dates for notes
  for (let i = 1; i <= 5; i++) {
    const notePath = path.join(basePath, `Kontakt${i}-Notat.md`);
    if (fs.existsSync(notePath)) {
      const stat = fs.statSync(notePath);
      const noteEvent = events.find((e) => e.label === `Kontakt ${i}`);
      if (noteEvent) {
        noteEvent.note = "Har notat";
      }
    }
  }

  for (let i = 1; i <= 4; i++) {
    const notePath = path.join(basePath, `Intervju${i}-Notat.md`);
    if (fs.existsSync(notePath)) {
      const stat = fs.statSync(notePath);
      const noteEvent = events.find((e) => e.label === `Intervju ${i}`);
      if (noteEvent) {
        noteEvent.note = "Har notat";
      }
    }
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return NextResponse.json({ events });
}







