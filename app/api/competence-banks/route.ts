import { NextResponse } from "next/server";
import { 
  saveCompetenceBank, 
  getCompetenceBank, 
  getCompetenceBankByClient,
  type CompetenceBank 
} from "../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const clientId = searchParams.get("clientId");
  
  if (id) {
    const bank = getCompetenceBank(id);
    if (!bank) {
      return NextResponse.json({ error: "Competence bank not found" }, { status: 404 });
    }
    return NextResponse.json(bank);
  }
  
  if (clientId) {
    const bank = getCompetenceBankByClient(clientId);
    if (!bank) {
      return NextResponse.json({ error: "Competence bank not found" }, { status: 404 });
    }
    return NextResponse.json(bank);
  }
  
  return NextResponse.json({ error: "id or clientId required" }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<CompetenceBank>;
  
  if (!body.clientId || !body.organizationId) {
    return NextResponse.json({ 
      error: "clientId and organizationId required" 
    }, { status: 400 });
  }
  
  const bank: CompetenceBank = {
    id: body.id || `bank-${Date.now()}`,
    clientId: body.clientId,
    organizationId: body.organizationId,
    skills: body.skills || [],
    experiences: body.experiences || [],
    education: body.education || [],
    languages: body.languages || [],
    extractedFrom: body.extractedFrom,
    createdAt: body.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  saveCompetenceBank(bank);
  return NextResponse.json(bank);
}

export async function PATCH(request: Request) {
  const body = await request.json() as Partial<CompetenceBank> & { id: string };
  
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  
  const existing = getCompetenceBank(body.id);
  if (!existing) {
    return NextResponse.json({ error: "Competence bank not found" }, { status: 404 });
  }
  
  const updated: CompetenceBank = {
    ...existing,
    ...body,
    updatedAt: new Date().toISOString()
  };
  
  saveCompetenceBank(updated);
  return NextResponse.json(updated);
}







