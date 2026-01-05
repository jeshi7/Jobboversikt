import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  listUsers,
  createUser,
} from "../../../lib/supabase-db";

/**
 * GET /api/users - List users
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

    // Only admin and consultant can list users
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = new URL(request.url).searchParams.get("organizationId");
    
    // Consultants can only see users in their own organization
    const orgId = user.role === "consultant" ? user.organization_id : (organizationId || undefined);
    
    const users = await listUsers(orgId);

    // Remove password hashes from response
    const safeUsers = users.map(({ password_hash, ...rest }) => rest);

    return NextResponse.json(safeUsers);
  } catch (error) {
    console.error("List users error:", error);
    return NextResponse.json(
      { error: "Failed to list users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create user (admin only)
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

    const currentUser = await getUser(session.user_id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, name, role, organizationId } = body;

    if (!email || !name || !role) {
      return NextResponse.json(
        { error: "Email, name, and role are required" },
        { status: 400 }
      );
    }

    const { user, temporaryPassword } = await createUser({
      organization_id: organizationId || currentUser.organization_id,
      email,
      name,
      role,
    });

    // Remove password hash from response
    const { password_hash, ...safeUser } = user;

    return NextResponse.json({
      user: safeUser,
      temporaryPassword,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create user" },
      { status: 500 }
    );
  }
}
