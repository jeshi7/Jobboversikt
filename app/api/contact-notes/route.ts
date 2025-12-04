import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { 
  isGitHubConfigured, 
  readFileFromGitHub, 
  writeFileToGitHub 
} from "../../../lib/github";

export const runtime = "nodejs";

const ROOT = process.cwd();
const BASE_DIR = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "02_Søknader",
  "Alle selskaper"
);
const OVERVIEW_PATH = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "00_Oversikt",
  "Søknadsoversikt.md"
);

// Relative paths for GitHub API
const GITHUB_BASE_PATH = "Jobb_Søknad_Pakke/02_Søknader/Alle selskaper";
const GITHUB_OVERVIEW_PATH = "Jobb_Søknad_Pakke/00_Oversikt/Søknadsoversikt.md";

type ContactType = "kontakt1" | "kontakt2" | "kontakt3" | "kontakt4" | "kontakt5";
type IntervjuType = "intervju1" | "intervju2" | "intervju3" | "intervju4";
type NoteType = ContactType | IntervjuType;

const isVercel = process.env.VERCEL === "1";

function getNotePath(company: string, type: NoteType) {
  const safeCompany = company.trim();
  let fileName: string;
  if (type.startsWith("kontakt")) {
    fileName = `Kontakt${type.replace("kontakt", "")}-Notat.md`;
  } else {
    fileName = `Intervju${type.replace("intervju", "")}-Notat.md`;
  }
  return { 
    local: path.join(BASE_DIR, safeCompany, fileName),
    github: `${GITHUB_BASE_PATH}/${safeCompany}/${fileName}`
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");
  const type = searchParams.get("type") as NoteType | null;

  const validTypes = [
    "kontakt1", "kontakt2", "kontakt3", "kontakt4", "kontakt5",
    "intervju1", "intervju2", "intervju3", "intervju4"
  ];

  if (!company || !type || !validTypes.includes(type)) {
    return NextResponse.json({ text: "" }, { status: 400 });
  }

  const paths = getNotePath(company, type);

  try {
    // On Vercel with GitHub configured, use GitHub API
    if (isVercel && isGitHubConfigured()) {
      const file = await readFileFromGitHub(paths.github);
      return NextResponse.json({ text: file?.content ?? "" });
    }

    // Local development: use file system
    if (!paths.local.startsWith(BASE_DIR)) {
      return NextResponse.json({ text: "" }, { status: 403 });
    }

    if (!fs.existsSync(paths.local)) {
      return NextResponse.json({ text: "" });
    }

    const text = fs.readFileSync(paths.local, "utf8");
    return NextResponse.json({ text });
  } catch (error) {
    console.error("Error reading note:", error);
    return NextResponse.json({ text: "" });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    company?: string;
    type?: NoteType;
    text?: string;
  };

  const validTypes = [
    "kontakt1", "kontakt2", "kontakt3", "kontakt4", "kontakt5",
    "intervju1", "intervju2", "intervju3", "intervju4"
  ];

  if (!body.company || !body.type || !validTypes.includes(body.type)) {
    return NextResponse.json({ ok: false, message: "Ugyldig forespørsel" }, { status: 400 });
  }

  const paths = getNotePath(body.company, body.type);
  const textToWrite = (body.text ?? "").trim();

  try {
    // On Vercel with GitHub configured, use GitHub API
    if (isVercel && isGitHubConfigured()) {
      const noteTypeLabel = body.type.startsWith("kontakt") 
        ? `Kontakt ${body.type.replace("kontakt", "")}` 
        : `Intervju ${body.type.replace("intervju", "")}`;
      
      await writeFileToGitHub(
        paths.github,
        textToWrite,
        `Oppdater ${noteTypeLabel} notat for ${body.company}`
      );

      // Also update the overview on GitHub
      if (textToWrite.length > 0) {
        await updateOverviewOnGitHub(body.company, body.type);
      }

      return NextResponse.json({ ok: true });
    }

    // Local development: use file system
    if (!paths.local.startsWith(BASE_DIR)) {
      return NextResponse.json({ ok: false, message: "Ugyldig filsti" }, { status: 403 });
    }

    const dir = path.dirname(paths.local);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(paths.local, textToWrite, "utf8");

    // Update Søknadsoversikt.md when any note is saved
    if (textToWrite.length > 0 && body.type && body.company) {
      updateOverviewLocal(body.company, body.type);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    console.error("Error saving note:", message);
    
    // Check if it's a GitHub config issue
    if (isVercel && !isGitHubConfigured()) {
      return NextResponse.json({ 
        ok: false, 
        message: "GitHub token er ikke konfigurert. Legg til GITHUB_TOKEN i Vercel miljøvariabler." 
      }, { status: 500 });
    }
    
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

async function updateOverviewOnGitHub(company: string, noteType: NoteType) {
  try {
    const file = await readFileFromGitHub(GITHUB_OVERVIEW_PATH);
    if (!file) return;

    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear().toString().slice(2)}`;

    const lines = file.content.split(/\r?\n/);
    const startIdx = lines.findIndex((line) =>
      line.startsWith("## 🟢 Aktive Prosesser")
    );
    if (startIdx === -1) return;

    const contactIndexMap: Record<ContactType, number> = {
      kontakt1: 11, kontakt2: 12, kontakt3: 13, kontakt4: 14, kontakt5: 15
    };
    const intervjuIndexMap: Record<IntervjuType, number> = {
      intervju1: 16, intervju2: 17, intervju3: 18, intervju4: 19
    };
    
    const columnIndex = noteType.startsWith("kontakt")
      ? contactIndexMap[noteType as ContactType]
      : intervjuIndexMap[noteType as IntervjuType];

    for (let i = startIdx + 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("## ")) break;
      if (!line.trim().startsWith("|")) continue;

      const parts = line.split("|").map((p) => p.trim());
      if (parts.length < 21) continue;

      const rawCompany = parts[1] || "";
      const companyName = rawCompany.replace(/\*\*/g, "").trim();

      if (companyName.toLowerCase() === company.toLowerCase()) {
        parts[columnIndex] = dateStr;
        lines[i] = "|" + parts.slice(1).join(" | ") + "|";
        break;
      }
    }

    const noteTypeLabel = noteType.startsWith("kontakt") 
      ? `Kontakt ${noteType.replace("kontakt", "")}` 
      : `Intervju ${noteType.replace("intervju", "")}`;

    await writeFileToGitHub(
      GITHUB_OVERVIEW_PATH,
      lines.join("\n"),
      `Oppdater ${noteTypeLabel} dato for ${company}`,
      file.sha
    );
  } catch (error) {
    console.error("Error updating overview on GitHub:", error);
  }
}

function updateOverviewLocal(company: string, noteType: NoteType) {
  if (!fs.existsSync(OVERVIEW_PATH)) return;

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear().toString().slice(2)}`;

  const content = fs.readFileSync(OVERVIEW_PATH, "utf8");
  const lines = content.split(/\r?\n/);

  const startIdx = lines.findIndex((line) =>
    line.startsWith("## 🟢 Aktive Prosesser")
  );
  if (startIdx === -1) return;

  const contactIndexMap: Record<ContactType, number> = {
    kontakt1: 11, kontakt2: 12, kontakt3: 13, kontakt4: 14, kontakt5: 15
  };
  const intervjuIndexMap: Record<IntervjuType, number> = {
    intervju1: 16, intervju2: 17, intervju3: 18, intervju4: 19
  };
  
  const columnIndex = noteType.startsWith("kontakt")
    ? contactIndexMap[noteType as ContactType]
    : intervjuIndexMap[noteType as IntervjuType];

  for (let i = startIdx + 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (!line.trim().startsWith("|")) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 21) continue;

    const rawCompany = parts[1] || "";
    const companyName = rawCompany.replace(/\*\*/g, "").trim();

    if (companyName.toLowerCase() === company.toLowerCase()) {
      parts[columnIndex] = dateStr;
      lines[i] = "|" + parts.slice(1).join(" | ") + "|";
      break;
    }
  }

  fs.writeFileSync(OVERVIEW_PATH, lines.join("\n"), "utf8");
}
