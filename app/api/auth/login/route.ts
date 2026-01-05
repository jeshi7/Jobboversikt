import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../../lib/supabase";
import {
  getUserByEmail,
  verifyPassword,
  createSession,
  isDatabaseEmpty,
} from "../../../../lib/supabase-db";

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Database ikke konfigurert. Kontakt administrator." },
        { status: 500 }
      );
    }

    // Check if setup is needed
    const isEmpty = await isDatabaseEmpty();
    if (isEmpty) {
      return NextResponse.json(
        { error: "Appen må settes opp først. Gå til /setup" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-post og passord er påkrevd" },
        { status: 400 }
      );
    }

    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Ugyldig e-post eller passord" },
        { status: 401 }
      );
    }

    // Verify password
    if (!user.password_hash || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json(
        { error: "Ugyldig e-post eller passord" },
        { status: 401 }
      );
    }

    // Create session
    const session = await createSession(user.id);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Innlogging feilet. Prøv igjen." },
      { status: 500 }
    );
  }
}
