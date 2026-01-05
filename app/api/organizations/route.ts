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

    // All users only see their own organization
    // (Each organization is independent and isolated)
    const { getOrganization } = await import("../../../lib/supabase-db");
    const org = await getOrganization(user.organization_id);
    return NextResponse.json(org ? [org] : []);
  } catch (error) {
    console.error("List organizations error:", error);
    return NextResponse.json(
      { error: "Failed to list organizations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations - Create organization
 * 
 * For independent organizations (Option C), new organizations are created
 * via the /setup page when the database is empty. This endpoint is disabled
 * to maintain data isolation between organizations.
 * 
 * To add a new organization, you need to:
 * 1. Create it directly in the database (Supabase dashboard)
 * 2. Or use the setup flow if starting fresh
 */
export async function POST(request: NextRequest) {
  // Disabled for data isolation - new organizations must be created
  // directly in the database or via initial setup
  return NextResponse.json(
    { error: "Nye organisasjoner må opprettes via oppsett eller direkte i databasen" },
    { status: 403 }
  );
}
