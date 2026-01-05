import { NextResponse } from "next/server";
import { loadOverviewRows } from "../../../lib/overview";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  const rows = loadOverviewRows();
  const row = rows.find((r) => r.company.toLowerCase() === company?.toLowerCase());

  if (!row) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 });
  }

  // Find first interview date
  const interviewDates = [row.intervju1, row.intervju2, row.intervju3, row.intervju4]
    .filter((d) => d && d.trim() && d !== "-" && d !== "–")
    .map((d) => {
      // Parse Norwegian date format (DD.MM.YY or DD.MM.YYYY)
      const parts = d.trim().split(/[.\-]/);
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parts[2] ? parseInt(parts[2], 10) : new Date().getFullYear();
        const fullYear = year < 100 ? 2000 + year : year;
        return new Date(fullYear, month, day);
      }
      return null;
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()));

  if (interviewDates.length === 0) {
    return NextResponse.json({ error: "No interview dates found" }, { status: 404 });
  }

  const interviewDate = interviewDates[0];
  
  // Generate ICS file content
  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Jobbsøknad//EN",
    "BEGIN:VEVENT",
    `UID:interview-${company}-${interviewDate.getTime()}@jobbsoknad`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTSTART:${interviewDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `DTEND:${new Date(interviewDate.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `SUMMARY:Intervju - ${row.company}`,
    `DESCRIPTION:Intervju med ${row.company}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename="intervju-${company}-${interviewDate.toISOString().split("T")[0]}.ics"`
    }
  });
}







