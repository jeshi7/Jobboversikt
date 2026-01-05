import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../../lib/auth";
import {
  getApplication,
  saveApplication,
  deleteApplication,
  updateApplicationStatus,
  type ApplicationStatus,
  type AppApplication,
} from "../../../../lib/app-applications";

/**
 * GET /api/app-applications/[id] - Get single application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client") {
      if (app.userId !== user.id && app.clientId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "consultant") {
      if (app.organizationId && app.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ application: app });
  } catch (error) {
    console.error("Error getting application:", error);
    return NextResponse.json(
      { error: "Failed to get application" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/app-applications/[id] - Update application
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client") {
      if (app.userId !== user.id && app.clientId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "consultant") {
      if (app.organizationId && app.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json() as Partial<AppApplication>;

    // Update allowed fields
    const updatedApp: AppApplication = {
      ...app,
      company: body.company ?? app.company,
      jobTitle: body.jobTitle ?? app.jobTitle,
      status: body.status ?? app.status,
      deadline: body.deadline ?? app.deadline,
      location: body.location ?? app.location,
      employmentType: body.employmentType ?? app.employmentType,
      salary: body.salary ?? app.salary,
      listingUrl: body.listingUrl ?? app.listingUrl,
      angle: body.angle ?? app.angle,
      notes: body.notes ?? app.notes,
      contactName: body.contactName ?? app.contactName,
      contactEmail: body.contactEmail ?? app.contactEmail,
      contactPhone: body.contactPhone ?? app.contactPhone,
      interviewDates: body.interviewDates ?? app.interviewDates,
    };

    // Set sentAt if moving to "sendt" status
    if (body.status === "sendt" && !app.sentAt) {
      updatedApp.sentAt = new Date().toISOString();
    }

    saveApplication(updatedApp);

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("Error updating application:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/app-applications/[id] - Delete application
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access - only owner or admin can delete
    if (user.role === "client") {
      if (app.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "consultant") {
      if (app.organizationId && app.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    deleteApplication(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting application:", error);
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/app-applications/[id] - Quick status update
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client") {
      if (app.userId !== user.id && app.clientId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await request.json() as { status: ApplicationStatus };

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updatedApp = updateApplicationStatus(params.id, body.status);

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("Error updating application status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}

