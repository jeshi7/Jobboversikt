import { NextResponse } from "next/server";
import { setupCompanyFolder } from "../../../../lib/agents/folder-setup";
import { getOrganization, getClient } from "../../../../lib/db";

export async function POST(request: Request) {
  const body = await request.json() as {
    organizationId: string;
    clientId: string;
    companyName: string;
    jobListingText: string;
  };
  
  if (!body.organizationId || !body.clientId || !body.companyName || !body.jobListingText) {
    return NextResponse.json({ 
      error: "organizationId, clientId, companyName, and jobListingText required" 
    }, { status: 400 });
  }
  
  const organization = getOrganization(body.organizationId);
  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }
  
  const client = getClient(body.clientId);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }
  
  if (client.organizationId !== body.organizationId) {
    return NextResponse.json({ error: "Client does not belong to organization" }, { status: 403 });
  }
  
  const result = setupCompanyFolder({
    organizationId: body.organizationId,
    clientId: body.clientId,
    companyName: body.companyName,
    jobListingText: body.jobListingText,
    autoGenerateCV: organization.settings.autoGenerateCV,
    autoGenerateCoverLetter: organization.settings.autoGenerateCoverLetter
  });
  
  return NextResponse.json(result);
}







