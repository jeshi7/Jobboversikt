import fs from "node:fs";
import path from "node:path";

export interface OverviewRow {
  company: string;
  status: string;
  contact1: string;
  contact2: string;
  sentDate?: string;
}

const ROOT = process.cwd();
const OVERVIEW_PATH = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "00_Oversikt",
  "Søknadsoversikt.md"
);

export function loadOverviewRows(): OverviewRow[] {
  if (!fs.existsSync(OVERVIEW_PATH)) return [];

  const raw = fs.readFileSync(OVERVIEW_PATH, "utf8");
  const lines = raw.split(/\r?\n/);

  const startIdx = lines.findIndex((line) =>
    line.startsWith("## 🟢 Aktive Prosesser")
  );
  if (startIdx === -1) return [];

  const rows: OverviewRow[] = [];

  // Skip header line + separator line
  for (let i = startIdx + 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (!line.trim().startsWith("|")) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 16) continue;

    const rawCompany = parts[1] || "";
    const company = rawCompany.replace(/\*\*/g, "").trim();

    const sentDate = parts[7] || "";
    const status = parts[8] || "";
    const contact1 = parts[11] || "";
    const contact2 = parts[12] || "";

    if (!company) continue;

    rows.push({
      company,
      status,
      contact1,
      contact2,
      sentDate
    });
  }

  return rows;
}



