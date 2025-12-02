import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const ROOT = process.cwd();
const BASE_DIR = path.join(ROOT, "Jobb_Søknad_Pakke");

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const relPath = searchParams.get("path");

  if (!relPath) {
    return new NextResponse("Missing path", { status: 400 });
  }

  const unsafeFull = path.join(ROOT, relPath);

  // Sørg for at vi bare kan hente filer under Jobb_Søknad_Pakke
  const fullPath = path.normalize(unsafeFull);
  if (!fullPath.startsWith(BASE_DIR)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const fileBuffer = fs.readFileSync(fullPath);
  const fileName = path.basename(fullPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(fileName)}"`
    }
  });
}


