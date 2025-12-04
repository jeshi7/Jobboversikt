import fs from "node:fs";
import path from "node:path";

export interface OverviewRow {
  company: string;
  status: string;
  contact1: string;
  contact2: string;
  contact3: string;
  contact4: string;
  contact5: string;
  intervju1: string;
  intervju2: string;
  intervju3: string;
  intervju4: string;
  sentDate?: string;
  tilbud?: string;
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
    if (parts.length < 20) continue; // Updated to check for 20 columns (5 contacts + 4 interviews)

    const rawCompany = parts[1] || "";
    const company = rawCompany.replace(/\*\*/g, "").trim();

    const sentDate = parts[7] || "";
    const status = parts[8] || "";
    const contact1 = parts[11] || "";
    const contact2 = parts[12] || "";
    const contact3 = parts[13] || "";
    const contact4 = parts[14] || "";
    const contact5 = parts[15] || "";
    const intervju1 = parts[16] || "";
    const intervju2 = parts[17] || "";
    const intervju3 = parts[18] || "";
    const intervju4 = parts[19] || "";
    const tilbud = parts[20] || ""; // Tilbud is now the 21st column (index 20)

    if (!company) continue;

    rows.push({
      company,
      status,
      contact1,
      contact2,
      contact3,
      contact4,
      contact5,
      intervju1,
      intervju2,
      intervju3,
      intervju4,
      sentDate,
      tilbud
    });
  }

  return rows;
}



