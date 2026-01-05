import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../lib/auth";
import {
  listApplicationsForUser,
  createApplication,
  getApplicationsSummary,
  type ApplicationStatus,
} from "../../../lib/app-applications";

/**
 * GET /api/app-applications - List applications
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || 
                     request.cookies.get("sessionId")?.value ||
                     new URL(request.url).searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getAuthUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client ID if user is a client
    let clientId: string | undefined;
    if (user.role === "client") {
      const { getClientsByOrganization } = await import("../../../lib/db");
      const clients = getClientsByOrganization(user.organizationId);
      const client = clients.find(c => c.email === user.email);
      clientId = client?.id;
    }

    const apps = listApplicationsForUser(
      user.id,
      clientId,
      user.organizationId,
      user.role
    );

    const summary = getApplicationsSummary(apps);

    return NextResponse.json({ applications: apps, summary });
  } catch (error) {
    console.error("Error listing applications:", error);
    return NextResponse.json(
      { error: "Failed to list applications" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/app-applications - Create new application
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || 
                     request.cookies.get("sessionId")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getAuthUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      company: string;
      jobTitle: string;
      status?: ApplicationStatus;
      deadline?: string;
      location?: string;
      employmentType?: string;
      salary?: string;
      listingUrl?: string;
      angle?: string;
      notes?: string;
      contactName?: string;
      contactEmail?: string;
      contactPhone?: string;
    };

    if (!body.company || !body.jobTitle) {
      return NextResponse.json(
        { error: "Company and job title are required" },
        { status: 400 }
      );
    }

    // Get client ID if user is a client
    let clientId: string | undefined;
    if (user.role === "client") {
      const { getClientsByOrganization } = await import("../../../lib/db");
      const clients = getClientsByOrganization(user.organizationId);
      const client = clients.find(c => c.email === user.email);
      clientId = client?.id;
    }

    const app = createApplication({
      company: body.company,
      jobTitle: body.jobTitle,
      status: body.status || "planlagt",
      deadline: body.deadline,
      location: body.location,
      employmentType: body.employmentType,
      salary: body.salary,
      listingUrl: body.listingUrl,
      angle: body.angle,
      notes: body.notes,
      contactName: body.contactName,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      userId: user.id,
      clientId: clientId,
      organizationId: user.organizationId,
    });

    return NextResponse.json({ application: app });
  } catch (error) {
    console.error("Error creating application:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}

