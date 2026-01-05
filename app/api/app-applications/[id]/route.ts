import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  getApplication,
  updateApplication,
  deleteApplication,
} from "../../../../lib/supabase-db";

/**
 * GET /api/app-applications/[id] - Get single application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const app = await getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client" && app.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "consultant" && app.organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ application: app });
  } catch (error) {
    console.error("Get application error:", error);
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

    const app = await getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client" && app.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (user.role === "consultant" && app.organization_id !== user.organization_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const updatedApp = await updateApplication(params.id, {
      company: body.company,
      job_title: body.jobTitle,
      status: body.status,
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
      cv_text: body.cvText,
      cover_letter_text: body.coverLetterText,
      interview_dates: body.interviewDates,
    });

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("Update application error:", error);
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

    const app = await getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Only owner or admin can delete
    if (user.role === "client" && app.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const success = await deleteApplication(params.id);
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete application" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete application error:", error);
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

    const app = await getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client" && app.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    if (!body.status) {
      return NextResponse.json({ error: "Status is required" }, { status: 400 });
    }

    const updatedApp = await updateApplication(params.id, { status: body.status });

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
