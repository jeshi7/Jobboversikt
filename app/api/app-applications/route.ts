import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  listApplications,
  createApplication,
  getApplicationsSummary,
  listClients,
} from "../../../lib/supabase-db";

/**
 * GET /api/app-applications - List applications
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("sessionId")?.value ||
      new URL(request.url).searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(session.user_id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Build filter options based on user role
    let options: {
      userId?: string;
      clientId?: string;
      organizationId?: string;
    } = {};

    if (user.role === "admin") {
      // Admin sees all
    } else if (user.role === "consultant") {
      // Consultant sees all in their organization
      options.organizationId = user.organization_id;
    } else {
      // Client sees only their own
      options.userId = user.id;
    }

    const applications = await listApplications(options);
    const summary = await getApplicationsSummary(
      user.role === "admin" ? undefined : user.organization_id
    );

    return NextResponse.json({ applications, summary });
  } catch (error) {
    console.error("List applications error:", error);
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
    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("sessionId")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await getUser(session.user_id);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.company || !body.jobTitle) {
      return NextResponse.json(
        { error: "Company and job title are required" },
        { status: 400 }
      );
    }

    // Get client ID if user is a client
    let clientId: string | undefined;
    if (user.role === "client") {
      const clients = await listClients(user.organization_id);
      const client = clients.find((c) => c.email === user.email || c.user_id === user.id);
      clientId = client?.id;
    }

    const application = await createApplication({
      user_id: user.id,
      client_id: clientId,
      organization_id: user.organization_id,
      company: body.company,
      job_title: body.jobTitle,
      status: body.status || "planlagt",
      deadline: body.deadline,
      location: body.location,
      employment_type: body.employmentType,
      salary: body.salary,
      listing_url: body.listingUrl,
      angle: body.angle,
      notes: body.notes,
      contact_name: body.contactName,
      contact_email: body.contactEmail,
      contact_phone: body.contactPhone,
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Create application error:", error);
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}
