import { NextResponse } from "next/server";
import { 
  getCompetenceBank, 
  getClient 
} from "../../../../lib/db";
import { 
  generateCVProfile, 
  generateCoverLetter,
  extractJobListingFromText 
} from "../../../../lib/agents/content-generator";

export async function POST(request: Request) {
  const body = await request.json() as {
    clientId: string;
    companyName: string;
    jobListingText: string;
    type: "cv-profile" | "cover-letter" | "both";
  };
  
  if (!body.clientId || !body.companyName || !body.jobListingText) {
    return NextResponse.json({ 
      error: "clientId, companyName, and jobListingText required" 
    }, { status: 400 });
  }
  
  const client = getClient(body.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  
  if (!client.competenceBankId) {
    return NextResponse.json({ 
      error: "Client has no competence bank. Please parse CV first." 
    }, { status: 400 });
  }
  
  const competenceBank = getCompetenceBank(client.competenceBankId);
  if (!competenceBank) {
    return NextResponse.json({ error: "Competence bank not found" }, { status: 404 });
  }
  
  // Extract job listing
  const jobListing = extractJobListingFromText(body.jobListingText);
  const fullJobListing = {
    title: jobListing.title || body.companyName,
    company: body.companyName,
    description: jobListing.description || body.jobListingText,
    requirements: jobListing.requirements || [],
    location: jobListing.location
  };
  
  const result: {
    cvProfile?: string;
    coverLetter?: string;
  } = {};
  
  if (body.type === "cv-profile" || body.type === "both") {
    result.cvProfile = generateCVProfile(competenceBank, fullJobListing);
  }
  
  if (body.type === "cover-letter" || body.type === "both") {
    result.coverLetter = generateCoverLetter(competenceBank, fullJobListing, client.name);
  }
  
  return NextResponse.json(result);
}







