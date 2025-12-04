import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getNote, saveNote, isKVAvailable } from "../../../lib/db";

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

type ContactType = "kontakt1" | "kontakt2" | "kontakt3" | "kontakt4" | "kontakt5";
type IntervjuType = "intervju1" | "intervju2" | "intervju3" | "intervju4";
type NoteType = ContactType | IntervjuType;

function getNotePath(company: string, type: NoteType) {
  const safeCompany = company.trim();
  const dir = path.join(BASE_DIR, safeCompany);
  let fileName: string;
  if (type.startsWith("kontakt")) {
    fileName = `Kontakt${type.replace("kontakt", "")}-Notat.md`;
  } else {
    fileName = `Intervju${type.replace("intervju", "")}-Notat.md`;
  }
  return path.join(dir, fileName);
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

  // Try KV first (for Vercel), then fall back to file system (for local)
  if (isKVAvailable()) {
    try {
      const text = await getNote(company, type);
      return NextResponse.json({ text });
    } catch (error) {
      console.error("KV read error:", error);
      return NextResponse.json({ text: "" });
    }
  }

  // Local file system fallback
  const fullPath = getNotePath(company, type);

  if (!fullPath.startsWith(BASE_DIR)) {
    return NextResponse.json({ text: "" }, { status: 403 });
  }

  if (!fs.existsSync(fullPath)) {
    return NextResponse.json({ text: "" });
  }

  const text = fs.readFileSync(fullPath, "utf8");
  return NextResponse.json({ text });
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
    return NextResponse.json({ ok: false, error: "Invalid parameters" }, { status: 400 });
  }

  const textToWrite = (body.text ?? "").trim();

  // Try KV first (for Vercel), then fall back to file system (for local)
  if (isKVAvailable()) {
    try {
      const success = await saveNote(body.company, body.type, textToWrite);
      if (success) {
        return NextResponse.json({ ok: true, storage: "kv" });
      } else {
        return NextResponse.json({ ok: false, error: "KV save failed" }, { status: 500 });
      }
    } catch (error) {
      console.error("KV write error:", error);
      return NextResponse.json({ ok: false, error: "KV error" }, { status: 500 });
    }
  }

  // Local file system fallback
  const fullPath = getNotePath(body.company, body.type);

  if (!fullPath.startsWith(BASE_DIR)) {
    return NextResponse.json({ ok: false, error: "Invalid path" }, { status: 403 });
  }

  try {
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(fullPath, textToWrite, "utf8");

    // Update Søknadsoversikt.md when any note is saved (local only)
    if (textToWrite.length > 0 && body.type && body.company) {
      updateOverviewNote(body.company, body.type);
    }

    return NextResponse.json({ ok: true, storage: "filesystem" });
  } catch (error) {
    console.error("Filesystem write error:", error);
    return NextResponse.json({ ok: false, error: "Filesystem error" }, { status: 500 });
  }
}

function updateOverviewNote(company: string, noteType: NoteType) {
  if (!fs.existsSync(OVERVIEW_PATH)) return;

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear().toString().slice(2)}`;

  const content = fs.readFileSync(OVERVIEW_PATH, "utf8");
  const lines = content.split(/\r?\n/);

  const startIdx = lines.findIndex((line) =>
    line.startsWith("## 🟢 Aktive Prosesser")
  );
  if (startIdx === -1) return;

  // Map note type to column index
  const contactIndexMap: Record<ContactType, number> = {
    kontakt1: 11,
    kontakt2: 12,
    kontakt3: 13,
    kontakt4: 14,
    kontakt5: 15
  };
  const intervjuIndexMap: Record<IntervjuType, number> = {
    intervju1: 16,
    intervju2: 17,
    intervju3: 18,
    intervju4: 19
  };
  
  const columnIndex = noteType.startsWith("kontakt")
    ? contactIndexMap[noteType as ContactType]
    : intervjuIndexMap[noteType as IntervjuType];

  // Find the row for this company and update the appropriate column
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
