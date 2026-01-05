import { NextResponse } from "next/server";
import { 
  saveOrganization, 
  getOrganization, 
  getOrganizationBySlug,
  listOrganizations,
  type Organization 
} from "../../../lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const slug = searchParams.get("slug");
  
  if (id) {
    const org = getOrganization(id);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json(org);
  }
  
  if (slug) {
    const org = getOrganizationBySlug(slug);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }
    return NextResponse.json(org);
  }
  
  // List all organizations (for admin)
  const orgs = listOrganizations();
  return NextResponse.json(orgs);
}

export async function POST(request: Request) {
  const body = await request.json() as Partial<Organization>;
  
  if (!body.name || !body.slug) {
    return NextResponse.json({ error: "Name and slug required" }, { status: 400 });
  }
  
  // Check if slug exists
  const existing = getOrganizationBySlug(body.slug);
  if (existing) {
    return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
  }
  
  const org: Organization = {
    id: body.id || `org-${Date.now()}`,
    name: body.name,
    slug: body.slug,
    createdAt: body.createdAt || new Date().toISOString(),
    settings: {
      autoGenerateCV: body.settings?.autoGenerateCV ?? true,
      autoGenerateCoverLetter: body.settings?.autoGenerateCoverLetter ?? true,
      autoCreateFolders: body.settings?.autoCreateFolders ?? true,
    }
  };
  
  saveOrganization(org);
  return NextResponse.json(org);
}







