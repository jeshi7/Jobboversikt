import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ROOT = process.cwd();
const BASE_DIR = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "02_Søknader",
  "Alle selskaper"
);

function getNotePath(company: string, type: "kontakt1" | "kontakt2") {
  const safeCompany = company.trim();
  const dir = path.join(BASE_DIR, safeCompany);
  const fileName = type === "kontakt1" ? "Kontakt1-Notat.md" : "Kontakt2-Notat.md";
  return path.join(dir, fileName);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");
  const type = searchParams.get("type") as "kontakt1" | "kontakt2" | null;

  if (!company || (type !== "kontakt1" && type !== "kontakt2")) {
    return NextResponse.json({ text: "" }, { status: 400 });
  }

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
    type?: "kontakt1" | "kontakt2";
    text?: string;
  };

  if (!body.company || (body.type !== "kontakt1" && body.type !== "kontakt2")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const fullPath = getNotePath(body.company, body.type);

  if (!fullPath.startsWith(BASE_DIR)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const textToWrite = (body.text ?? "").trim();
  fs.writeFileSync(fullPath, textToWrite, "utf8");

  return NextResponse.json({ ok: true });
}


