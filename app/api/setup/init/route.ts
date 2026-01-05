import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "../../../../lib/supabase";
import {
  isDatabaseEmpty,
  createOrganization,
  createUser,
  createSession,
  createClient,
} from "../../../../lib/supabase-db";

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase er ikke konfigurert" },
        { status: 500 }
      );
    }

    // Check if already set up
    const isEmpty = await isDatabaseEmpty();
    if (!isEmpty) {
      return NextResponse.json(
        { error: "Appen er allerede satt opp" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { organizationName, adminName, adminEmail, adminPassword } = body;

    // Validate input
    if (!organizationName || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: "Alle felt er påkrevd" },
        { status: 400 }
      );
    }

    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: "Passordet må være minst 8 tegn" },
        { status: 400 }
      );
    }

    // Create organization
    const org = await createOrganization(organizationName);

    // Create admin user
    const { user } = await createUser({
      organization_id: org.id,
      email: adminEmail,
      name: adminName,
      role: "admin",
      password: adminPassword,
    });

    // Create a client record for the admin (for self-tracking if needed)
    await createClient({
      organization_id: org.id,
      user_id: user.id,
      name: adminName,
      email: adminEmail,
    });

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
      },
    });
  } catch (error) {
    console.error("Setup init error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Kunne ikke fullføre oppsett" },
      { status: 500 }
    );
  }
}

