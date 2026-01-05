import { NextRequest, NextResponse } from "next/server";
import {
  getSession,
  getUser,
  deleteUser,
} from "../../../../lib/supabase-db";

/**
 * DELETE /api/users/[id] - Delete user (admin only)
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

    const currentUser = await getUser(session.user_id);
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Can't delete yourself
    if (params.id === currentUser.id) {
      return NextResponse.json(
        { error: "Du kan ikke slette din egen bruker" },
        { status: 400 }
      );
    }

    const success = await deleteUser(params.id);
    if (!success) {
      return NextResponse.json(
        { error: "Kunne ikke slette bruker" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json(
      { error: "Kunne ikke slette bruker" },
      { status: 500 }
    );
  }
}
