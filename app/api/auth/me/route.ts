import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../../lib/supabase";
import { getSession, getUser } from "../../../../lib/supabase-db";

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database ikke konfigurert" },
        { status: 500 }
      );
    }

    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("sessionId")?.value ||
      new URL(request.url).searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Ikke innlogget" },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Ugyldig eller utløpt sesjon" },
        { status: 401 }
      );
    }

    const user = await getUser(session.user_id);
    if (!user) {
      return NextResponse.json(
        { error: "Bruker ikke funnet" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organization_id,
        mustChangePassword: user.must_change_password,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json(
      { error: "Kunne ikke hente brukerinfo" },
      { status: 500 }
    );
  }
}

