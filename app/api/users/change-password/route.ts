import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  verifyPassword,
  updateUserPassword,
} from "../../../../lib/supabase-db";

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
    const { currentPassword, newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: "Nytt passord er påkrevd" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Passordet må være minst 8 tegn" },
        { status: 400 }
      );
    }

    // If user must change password, don't require current password
    if (!user.must_change_password) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Nåværende passord er påkrevd" },
          { status: 400 }
        );
      }

      if (!user.password_hash || !verifyPassword(currentPassword, user.password_hash)) {
        return NextResponse.json(
          { error: "Nåværende passord er feil" },
          { status: 401 }
        );
      }
    }

    const success = await updateUserPassword(user.id, newPassword);
    if (!success) {
      return NextResponse.json(
        { error: "Kunne ikke oppdatere passord" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return NextResponse.json(
      { error: "Kunne ikke endre passord" },
      { status: 500 }
    );
  }
}
