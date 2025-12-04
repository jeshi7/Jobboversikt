import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const COMPETENCE_PATH = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "01_Ressurser",
  "Kompetansebank.md"
);

export function loadCompetenceBank(): string {
  if (!fs.existsSync(COMPETENCE_PATH)) return "";
  return fs.readFileSync(COMPETENCE_PATH, "utf8");
}

export interface CompetenceSection {
  id: string;
  title: string;
  emoji: string;
  variants: Array<{
    label: string;
    content: string;
  }>;
}

export function parseCompetenceBank(content: string): CompetenceSection[] {
  const sections: CompetenceSection[] = [];
  const lines = content.split(/\r?\n/);

  let currentSection: CompetenceSection | null = null;
  let currentVariant: { label: string; content: string } | null = null;
  let variantContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Section header: ## 🧠 1. UX, Brukerinnsikt & Tilgjengelighet (UU)
    const sectionMatch = line.match(/^##\s+([^\d]+)\s+\d+\.\s+(.+)$/);
    if (sectionMatch) {
      // Save previous section if exists
      if (currentSection && currentVariant) {
        currentSection.variants.push({
          ...currentVariant,
          content: variantContent.join("\n").trim()
        });
      }
      if (currentSection) {
        sections.push(currentSection);
      }

      const emoji = sectionMatch[1].trim();
      const title = sectionMatch[2].trim();
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9æøå]/g, "-"),
        title,
        emoji,
        variants: []
      };
      currentVariant = null;
      variantContent = [];
      continue;
    }

    // Variant header: **Variant A (Empati & Innsikt - "Service Heart"):**
    const variantMatch = line.match(/^\*\*Variant\s+([A-Z])\s*\(([^)]+)\):\*\*/);
    if (variantMatch) {
      // Save previous variant if exists
      if (currentVariant && currentSection) {
        currentSection.variants.push({
          ...currentVariant,
          content: variantContent.join("\n").trim()
        });
      }

      const label = `Variant ${variantMatch[1]} (${variantMatch[2]})`;
      currentVariant = { label, content: "" };
      variantContent = [];
      continue;
    }

    // Content line - skip empty lines at start of variant, but keep them in content
    if (currentVariant) {
      if (line.trim() || variantContent.length > 0) {
        // Skip separator lines
        if (!line.startsWith("---")) {
          variantContent.push(line);
        }
      }
    }
  }

  // Save last variant and section
  if (currentVariant && currentSection) {
    currentSection.variants.push({
      ...currentVariant,
      content: variantContent.join("\n").trim()
    });
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

