import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/supabase-db";

export async function POST(request: NextRequest) {
  try {
    const sessionId =
      request.headers.get("x-session-id") ||
      request.cookies.get("sessionId")?.value;

    if (sessionId) {
      await deleteSession(sessionId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ success: true }); // Still return success
  }
}
