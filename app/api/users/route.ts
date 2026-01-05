import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../lib/auth";
import { saveUser, getUsersByOrganization } from "../../../lib/db";
import { hashPassword, generateTemporaryPassword } from "../../../lib/password";

/**
 * GET /api/users - List users (admin only, filtered by organization)
 */
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get("x-session-id") || 
                     request.cookies.get("sessionId")?.value ||
                     new URL(request.url).searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = getAuthUser(session.userId);
    if (!user || (user.role !== "admin" && user.role !== "consultant")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const organizationId = new URL(request.url).searchParams.get("organizationId");
    
    if (organizationId) {
      // Get users for specific organization
      const users = getUsersByOrganization(organizationId);
      // Remove password hashes before sending
      const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
      return NextResponse.json(safeUsers);
    }

    // Admin can see all users (or we could limit to their org)
    // For now, return users from all organizations
    const { listOrganizations } = await import("../../../lib/db");
    const orgs = listOrganizations();
    const allUsers: any[] = [];
    
    for (const org of orgs) {
      const users = getUsersByOrganization(org.id);
      const safeUsers = users.map(({ passwordHash, ...rest }) => rest);
      allUsers.push(...safeUsers);
    }
    
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users - Create new user (admin only)
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json() as {
      email: string;
      name: string;
      role: "admin" | "consultant" | "client";
      organizationId: string;
      generatePassword?: boolean; // If true, generate temp password
    };

    if (!body.email || !body.name || !body.role || !body.organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUsers = getUsersByOrganization(body.organizationId);
    if (existingUsers.some(u => u.email === body.email)) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Generate temporary password or use provided one
    let passwordHash: string | undefined;
    let temporaryPassword: string | undefined;
    let mustChangePassword = false;

    if (body.generatePassword !== false) {
      // Generate temporary password by default
      temporaryPassword = generateTemporaryPassword();
      const { hash } = hashPassword(temporaryPassword);
      passwordHash = hash;
      mustChangePassword = true;
    }

    // Create new user
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      organizationId: body.organizationId,
      email: body.email,
      name: body.name,
      role: body.role,
      passwordHash,
      mustChangePassword,
      createdAt: new Date().toISOString()
    };

    saveUser(newUser);

    // Return user info (without password hash) and temporary password if generated
    const { passwordHash: _, ...safeUser } = newUser;
    return NextResponse.json({
      user: safeUser,
      temporaryPassword: temporaryPassword ? temporaryPassword : undefined,
      message: temporaryPassword 
        ? "User created. Temporary password has been generated."
        : "User created."
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

