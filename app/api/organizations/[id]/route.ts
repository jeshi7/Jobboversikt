import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  getOrganization,
  deleteOrganization,
  listUsers,
  listClients,
} from "../../../../lib/supabase-db";

/**
 * GET /api/organizations/[id] - Get organization details
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

    // Only admin can see any organization, others can only see their own
    if (user.role !== "admin" && user.organization_id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const org = await getOrganization(params.id);
    if (!org) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Get users and clients for this organization
    const users = await listUsers(params.id);
    const clients = await listClients(params.id);

    return NextResponse.json({
      ...org,
      users: users.map(({ password_hash, ...rest }) => rest),
      clients,
    });
  } catch (error) {
    console.error("Get organization error:", error);
    return NextResponse.json(
      { error: "Failed to get organization" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/organizations/[id] - Delete organization (admin only)
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't delete your own organization
    if (params.id === user.organization_id) {
      return NextResponse.json(
        { error: "Du kan ikke slette din egen organisasjon" },
        { status: 400 }
      );
    }

    const success = await deleteOrganization(params.id);
    if (!success) {
      return NextResponse.json(
        { error: "Kunne ikke slette organisasjon" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete organization error:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette organisasjon" },
      { status: 500 }
    );
  }
}
