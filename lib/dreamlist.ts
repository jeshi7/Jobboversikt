import fs from "node:fs";
import path from "node:path";

export interface DreamCompany {
  id: string;
  name: string;
  category: string;
  angle: string;
}

const ROOT = process.cwd();
const DREAMLIST_PATH = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "01_Ressurser",
  "Drømmeliste_og_Nettverk.md"
);

export function loadDreamlist(): DreamCompany[] {
  if (!fs.existsSync(DREAMLIST_PATH)) return [];

  const raw = fs.readFileSync(DREAMLIST_PATH, "utf8");
  const lines = raw.split(/\r?\n/);

  const companies: DreamCompany[] = [];
  let currentCategory = "";

  for (const line of lines) {
    // Category headers like "### 🌲 Outdoor / Lifestyle (Som Viking)"
    const categoryMatch = line.match(/^### .+? (.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Company lines like "1.  **Norrøna**"
    const companyMatch = line.match(/^\d+\.\s+\*\*(.+?)\*\*/);
    if (companyMatch) {
      const name = companyMatch[1].trim();
      companies.push({
        id: name.toLowerCase().replace(/[^a-z0-9æøå]/g, "-"),
        name,
        category: currentCategory,
        angle: ""
      });
      continue;
    }

    // Angle lines like "    *   *Vinkel:* ..."
    const angleMatch = line.match(/\*Vinkel:\*\s*(.+)/);
    if (angleMatch && companies.length > 0) {
      companies[companies.length - 1].angle = angleMatch[1].trim();
    }
  }

  return companies;
}

export function groupByCategory(
  companies: DreamCompany[]
): Record<string, DreamCompany[]> {
  return companies.reduce(
    (acc, company) => {
      if (!acc[company.category]) {
        acc[company.category] = [];
      }
      acc[company.category].push(company);
      return acc;
    },
    {} as Record<string, DreamCompany[]>
  );
}






