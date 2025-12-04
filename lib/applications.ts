import fs from "node:fs";
import path from "node:path";

export type ApplicationStatus =
  | "planlagt"
  | "forberedes"
  | "sendt"
  | "intervju"
  | "avslått";

export interface ApplicationResource {
  name: string;
  relativePath: string;
}

export interface Application {
  id: string;
  company: string;
  folder: string;
  status: ApplicationStatus;
  type: "planlagt" | "søknad";
  resources: ApplicationResource[];
  sentAt?: Date;
  jobSnippet?: string;
  jobTitle?: string;
  deadline?: string;
  employmentType?: string;
  location?: string;
  contact?: string;
  applyTo?: string;
  listingUrl?: string;
  angle?: string;
}

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "Jobb_Søknad_Pakke", "02_Søknader");

function safeReadDir(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).map((d) => d.name);
  } catch {
    return [];
  }
}

export function loadApplications(): Application[] {
  const all: Application[] = [];

  const alleSelskaperDir = path.join(BASE_DIR, "Alle selskaper");
  const planlagteDir = path.join(BASE_DIR, "Planlagte_Søknader");

  // Actual applications
  for (const companyFolder of safeReadDir(alleSelskaperDir)) {
    if (companyFolder.startsWith(".")) continue;

    const full = path.join(alleSelskaperDir, companyFolder);
    const stat = fs.existsSync(full) ? fs.statSync(full) : null;
    if (!stat || !stat.isDirectory()) continue;

    const files = safeReadDir(full);
    const resources: ApplicationResource[] = files.map((file) => ({
      name: file,
      relativePath: path
        .join("Jobb_Søknad_Pakke", "02_Søknader", "Alle selskaper", companyFolder, file)
        .replace(/\\/g, "/")
    }));

    let jobSnippet: string | undefined;
    let jobTitle: string | undefined;
    let deadline: string | undefined;
    let employmentType: string | undefined;
    let location: string | undefined;
    let contact: string | undefined;
    let applyTo: string | undefined;
    let listingUrl: string | undefined;
    let angle: string | undefined;
    const postingPath = path.join(full, "Utlysning.md");
    if (fs.existsSync(postingPath)) {
      try {
        const raw = fs.readFileSync(postingPath, "utf8");
      const lines = raw.split(/\r?\n/);

      // Enkle parser-regler for metadata i toppen av utlysningen
      const titleLine = lines.find((l) => l.startsWith("# "));
      if (titleLine) {
        jobTitle = titleLine.replace(/^#\s*/, "").trim();
      }

      for (const line of lines) {
        const clean = line.replace(/[*`]/g, "").trim();
        const lower = clean.toLowerCase();

        const getValueAfterColon = () => {
          const idx = clean.indexOf(":");
          return idx >= 0 ? clean.slice(idx + 1).trim() : "";
        };

        if (lower.startsWith("frist:")) {
          deadline = getValueAfterColon();
        } else if (lower.startsWith("ansettelsesform:")) {
          employmentType = getValueAfterColon();
        } else if (lower.startsWith("sted:")) {
          location = getValueAfterColon();
        } else if (lower.startsWith("kontakt:")) {
          contact = getValueAfterColon();
        } else if (lower.startsWith("søknad sendes:")) {
          applyTo = getValueAfterColon();
        } else if (lower.startsWith("link:")) {
          listingUrl = getValueAfterColon();
        }
      }

      // Finn "Om stillingen"-seksjonen og bruk den som kort oppsummering
      const lowerLines = lines.map((l) => l.trim().toLowerCase());
      const omIdx = lowerLines.findIndex((l) =>
        l.startsWith("## om stillingen")
      );

      const snippetParts: string[] = [];

      if (omIdx !== -1) {
        for (let i = omIdx + 1; i < lines.length; i++) {
          const rawLine = lines[i];
          const trimmed = rawLine.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("## ")) break; // neste seksjon
          if (trimmed.startsWith("**") && trimmed.endsWith("**")) break; // ny tydelig del

          // Hopp over rene punkt-lister i utdraget, de blir ofte rotete
          if (trimmed.startsWith("*")) continue;

          snippetParts.push(
            trimmed
              .replace(/[*`]/g, "")
              .replace(/\s+/g, " ")
              .trim()
          );

          if (snippetParts.join(" ").length > 400) break;
        }
      }

      if (snippetParts.length > 0) {
        jobSnippet = snippetParts.join("\n\n");
      } else {
        // Fallback: første ikke-tomme avsnitt under tittelen
        const firstParagraph = lines
          .slice(1)
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith("*") && !l.startsWith("## "))[0];
        jobSnippet = firstParagraph
          ? firstParagraph.replace(/[*`]/g, "").trim()
          : undefined;
      }

      // Finn "Din vinkel"-seksjonen
      const angleIdx = lowerLines.findIndex((l) =>
        l.includes("din vinkel")
      );
      if (angleIdx !== -1) {
        const angleParts: string[] = [];
        // Start fra linjen etter "Din vinkel"-overskriften
        const startIdx = lowerLines[angleIdx].includes("**") ? angleIdx + 1 : angleIdx + 1;
        for (let i = startIdx; i < lines.length; i++) {
          const rawLine = lines[i];
          const trimmed = rawLine.trim();
          if (!trimmed) continue;
          if (trimmed.startsWith("## ")) break; // neste seksjon
          if (trimmed.startsWith("Link:")) break; // slutt på innhold
          angleParts.push(trimmed);
        }
        if (angleParts.length > 0) {
          angle = angleParts.join("\n").trim();
        }
      }
      } catch {
        jobSnippet = undefined;
        angle = undefined;
      }
    }

    // Determine status based on folder contents
    const hasInterview = files.some((f) =>
      f.toLowerCase().includes("intervju")
    );
    const hasCvPdf = files.some((f) =>
      f.toLowerCase().includes("cv") && f.toLowerCase().endsWith(".pdf")
    );
    const hasCoverLetterPdf = files.some((f) =>
      (f.toLowerCase().includes("søknad") ||
        f.toLowerCase().includes("cover letter") ||
        f.toLowerCase().includes("søknadsbrev")) &&
      f.toLowerCase().endsWith(".pdf")
    );
    const hasOnlyUtlysning =
      files.length === 1 && files[0].toLowerCase() === "utlysning.md";
    const hasWorkStarted = files.length > 1 && !hasOnlyUtlysning;

    let status: ApplicationStatus;
    let appType: "planlagt" | "søknad";

    if (hasInterview) {
      status = "intervju";
      appType = "søknad";
    } else if (hasCvPdf && hasCoverLetterPdf) {
      status = "sendt";
      appType = "søknad";
    } else if (hasOnlyUtlysning) {
      // Folder with only Utlysning.md = still planned, not active
      status = "planlagt";
      appType = "planlagt";
    } else if (hasWorkStarted) {
      // Has files beyond Utlysning.md but not both PDFs = under arbeid
      status = "forberedes";
      appType = "søknad";
    } else {
      status = "planlagt";
      appType = "planlagt";
    }

    all.push({
      id: `soknad-${companyFolder}`,
      company: companyFolder,
      folder: path.relative(ROOT, full).replace(/\\/g, "/"),
      status,
      type: appType,
      resources,
      sentAt: hasCvPdf && hasCoverLetterPdf ? stat.mtime : undefined,
      jobSnippet,
      jobTitle,
      deadline,
      employmentType,
      location,
      contact,
      applyTo,
      listingUrl,
      angle
    });
  }

  // Planned applications (only if NOT already in Alle selskaper)
  const existingCompanies = new Set(all.map((a) => a.company));

  for (const file of safeReadDir(planlagteDir)) {
    if (file.startsWith(".")) continue;

    const full = path.join(planlagteDir, file);
    const stat = fs.existsSync(full) ? fs.statSync(full) : null;
    if (!stat) continue;

    const companyName = file.replace(/\.[^/.]+$/, "").trim();
    if (!companyName) continue;

    // Skip if already added from Alle selskaper
    if (existingCompanies.has(companyName)) continue;

     let jobSnippet: string | undefined;
     let jobTitle: string | undefined;
     let deadline: string | undefined;
     let employmentType: string | undefined;
     let location: string | undefined;
     let contact: string | undefined;
     let applyTo: string | undefined;
     let listingUrl: string | undefined;
     let angle: string | undefined;

     try {
       const raw = fs.readFileSync(full, "utf8");
       const lines = raw.split(/\r?\n/);

       const titleLine = lines.find((l) => l.startsWith("# "));
       if (titleLine) {
         jobTitle = titleLine.replace(/^#\s*/, "").trim();
       }

       for (const line of lines) {
         const clean = line.replace(/[*`]/g, "").trim();
         const lower = clean.toLowerCase();

         const getValueAfterColon = () => {
           const idx = clean.indexOf(":");
           return idx >= 0 ? clean.slice(idx + 1).trim() : "";
         };

         if (lower.startsWith("frist:")) {
           deadline = getValueAfterColon();
         } else if (lower.startsWith("ansettelsesform:")) {
           employmentType = getValueAfterColon();
         } else if (lower.startsWith("sted:")) {
           location = getValueAfterColon();
         } else if (lower.startsWith("kontakt:")) {
           contact = getValueAfterColon();
         } else if (lower.startsWith("søknad sendes:")) {
           applyTo = getValueAfterColon();
         } else if (lower.startsWith("link:")) {
           listingUrl = getValueAfterColon();
         }
       }

       const lowerLines = lines.map((l) => l.trim().toLowerCase());
       const omIdx = lowerLines.findIndex((l) =>
         l.startsWith("## om stillingen")
       );

       const snippetParts: string[] = [];

       if (omIdx !== -1) {
         for (let i = omIdx + 1; i < lines.length; i++) {
           const rawLine = lines[i];
           const trimmed = rawLine.trim();
           if (!trimmed) continue;
           if (trimmed.startsWith("## ")) break;
           if (trimmed.startsWith("**") && trimmed.endsWith("**")) break;
           if (trimmed.startsWith("*")) continue;

           snippetParts.push(
             trimmed
               .replace(/[*`]/g, "")
               .replace(/\s+/g, " ")
               .trim()
           );

           if (snippetParts.join(" ").length > 400) break;
         }
       }

       if (snippetParts.length > 0) {
         jobSnippet = snippetParts.join("\n\n");
       } else {
         const firstParagraph = lines
           .slice(1)
           .map((l) => l.trim())
           .filter((l) => l && !l.startsWith("*") && !l.startsWith("## "))[0];
         jobSnippet = firstParagraph
           ? firstParagraph.replace(/[*`]/g, "").trim()
           : undefined;
       }

       // Finn "Din vinkel"-seksjonen
       const angleIdx = lowerLines.findIndex((l) =>
         l.includes("din vinkel")
       );
       if (angleIdx !== -1) {
         const angleParts: string[] = [];
         // Start fra linjen etter "Din vinkel"-overskriften
         const startIdx = lowerLines[angleIdx].includes("**") ? angleIdx + 1 : angleIdx + 1;
         for (let i = startIdx; i < lines.length; i++) {
           const rawLine = lines[i];
           const trimmed = rawLine.trim();
           if (!trimmed) continue;
           if (trimmed.startsWith("## ")) break; // neste seksjon
           if (trimmed.startsWith("Link:")) break; // slutt på innhold
           angleParts.push(trimmed);
         }
         if (angleParts.length > 0) {
           angle = angleParts.join("\n").trim();
         }
       }
     } catch {
       jobSnippet = undefined;
       angle = undefined;
     }

    all.push({
      id: `plan-${companyName}`,
      company: companyName,
      folder: path.relative(ROOT, full).replace(/\\/g, "/"),
      status: "planlagt",
      type: "planlagt",
      resources: [
        {
          name: file,
          relativePath: path
            .join("Jobb_Søknad_Pakke", "02_Søknader", "Planlagte_Søknader", file)
            .replace(/\\/g, "/")
        }
      ],
      jobSnippet,
      jobTitle,
      deadline,
      employmentType,
      location,
      contact,
      applyTo,
      listingUrl,
      angle
    });
  }

  return all.sort((a, b) => a.company.localeCompare(b.company, "nb"));
}

export function summariseApplications(apps: Application[]) {
  const total = apps.length;
  const sent = apps.filter((a) => a.status === "sendt").length;
  const interview = apps.filter((a) => a.status === "intervju").length;
  const planned = apps.filter((a) => a.type === "planlagt").length;

  return { total, sent, interview, planned };
}


