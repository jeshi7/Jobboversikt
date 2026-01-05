import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../../lib/auth";
import { getUser, saveUser } from "../../../../lib/db";
import { hashPassword, verifyPassword } from "../../../../lib/password";

/**
 * POST /api/users/change-password - Change password (users can change their own)
 */
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || 
                     request.cookies.get("sessionId")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getAuthUser(session.userId);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as {
      currentPassword?: string; // Required if user has password, optional if first time setting password
      newPassword: string;
    };

    if (!body.newPassword || body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Get full user data (including password hash)
    const fullUser = getUser(user.id);
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If user has a password, verify current password
    if (fullUser.passwordHash) {
      if (!body.currentPassword) {
        return NextResponse.json(
          { error: "Current password is required" },
          { status: 400 }
        );
      }

      if (!verifyPassword(body.currentPassword, fullUser.passwordHash)) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }
    }
    // If user doesn't have password (first time setup), allow setting without current password

    // Hash new password
    const { hash } = hashPassword(body.newPassword);

    // Update user
    const updatedUser = {
      ...fullUser,
      passwordHash: hash,
      mustChangePassword: false // Clear the flag when password is changed
    };

    saveUser(updatedUser);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json(
      { error: "Failed to change password" },
      { status: 500 }
    );
  }
}







