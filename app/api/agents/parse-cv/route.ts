import { NextResponse } from "next/server";
import { parseCVFromFile, parseCVFromText } from "../../../../lib/agents/cv-parser";
import { 
  saveCompetenceBank, 
  getCompetenceBank,
  getCompetenceBankByClient,
  getClient,
  saveClient,
  type CompetenceBank 
} from "../../../../lib/db";
import fs from "node:fs";
import path from "node:path";

export async function POST(request: Request) {
  const body = await request.json() as {
    clientId: string;
    cvPath?: string;
    cvText?: string;
  };
  
  if (!body.clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }
  
  const client = getClient(body.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  
  // Parse CV
  let parsedData: Partial<CompetenceBank>;
  
  if (body.cvPath) {
    const fullPath = path.join(process.cwd(), body.cvPath);
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ error: "CV file not found" }, { status: 404 });
    }
    parsedData = await parseCVFromFile(fullPath);
  } else if (body.cvText) {
    parsedData = parseCVFromText(body.cvText);
  } else {
    return NextResponse.json({ error: "cvPath or cvText required" }, { status: 400 });
  }
  
  // Get or create competence bank
  let competenceBank = client.competenceBankId 
    ? getCompetenceBank(client.competenceBankId)
    : null;
  
  if (!competenceBank) {
    competenceBank = {
      id: `bank-${Date.now()}`,
      clientId: body.clientId,
      organizationId: client.organizationId,
      skills: parsedData.skills || [],
      experiences: parsedData.experiences || [],
      education: parsedData.education || [],
      languages: parsedData.languages || [],
      extractedFrom: {
        cvPath: body.cvPath,
        extractedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  } else {
    // Merge with existing data
    competenceBank = {
      ...competenceBank,
      skills: [...new Set([...competenceBank.skills, ...(parsedData.skills || [])])],
      experiences: [...competenceBank.experiences, ...(parsedData.experiences || [])],
      education: [...competenceBank.education, ...(parsedData.education || [])],
      languages: [...competenceBank.languages, ...(parsedData.languages || [])],
      updatedAt: new Date().toISOString()
    };
  }
  
  saveCompetenceBank(competenceBank);
  
  // Update client reference
  saveClient({
    ...client,
    competenceBankId: competenceBank.id
  });
  
  return NextResponse.json(competenceBank);
}

