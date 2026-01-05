import { NextResponse } from "next/server";
import { loadApplications } from "../../../lib/applications";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";

  const apps = loadApplications();

  if (format === "csv") {
    const csv = [
      ["Selskap", "Status", "Stilling", "Sted", "Frist", "Dato sendt"].join(","),
      ...apps.map((app) => [
        `"${app.company}"`,
        `"${app.status}"`,
        `"${app.jobTitle || ""}"`,
        `"${app.location || ""}"`,
        `"${app.deadline || ""}"`,
        `"${app.sentAt ? app.sentAt.toISOString().split("T")[0] : ""}"`
      ].join(","))
    ].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="soknader.csv"'
      }
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}







