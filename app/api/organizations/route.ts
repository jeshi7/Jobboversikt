import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  listOrganizations,
  createOrganization,
} from "../../../lib/supabase-db";

/**
 * GET /api/organizations - List organizations
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

    // Only admin can see all organizations
    if (user.role !== "admin") {
      // Return only user's organization
      const { getOrganization } = await import("../../../lib/supabase-db");
      const org = await getOrganization(user.organization_id);
      return NextResponse.json(org ? [org] : []);
    }

    const organizations = await listOrganizations();
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("List organizations error:", error);
    return NextResponse.json(
      { error: "Failed to list organizations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations - Create organization (admin only)
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const org = await createOrganization(name);
    return NextResponse.json(org);
  } catch (error) {
    console.error("Create organization error:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
}
