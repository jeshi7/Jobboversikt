import { NextResponse } from "next/server";
import { loadTags, saveTags, addTagToCompany, removeTagFromCompany } from "../../../lib/tags";

export async function GET() {
  const tags = loadTags();
  return NextResponse.json(tags);
}

export async function POST(request: Request) {
  const body = await request.json() as {
    action: "add" | "remove";
    company: string;
    tag: string;
  };

  if (body.action === "add") {
    addTagToCompany(body.company, body.tag);
  } else if (body.action === "remove") {
    removeTagFromCompany(body.company, body.tag);
  }

  return NextResponse.json({ ok: true });
}







