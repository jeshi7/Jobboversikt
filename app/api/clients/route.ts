import { NextResponse } from "next/server";
import { 
  saveClient, 
  getClient, 
  getClientsByOrganization,
  type Client 
} from "../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const organizationId = searchParams.get("organizationId");
  
  if (id) {
    const client = getClient(id);
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }
    return NextResponse.json(client);
  }
  
  if (organizationId) {
    const clients = getClientsByOrganization(organizationId);
    return NextResponse.json(clients);
  }
  
  return NextResponse.json({ error: "id or organizationId required" }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<Client>;
  
  if (!body.name || !body.organizationId) {
    return NextResponse.json({ error: "Name and organizationId required" }, { status: 400 });
  }
  
  const client: Client = {
    id: body.id || `client-${Date.now()}`,
    organizationId: body.organizationId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    competenceBankId: body.competenceBankId,
    createdAt: body.createdAt || new Date().toISOString(),
  };
  
  saveClient(client);
  return NextResponse.json(client);
}







