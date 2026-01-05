import { NextResponse } from "next/server";
import { createSession, getAuthUser } from "../../../../lib/auth";
import { getUsersByOrganization, getUser } from "../../../../lib/db";
import { verifyPassword } from "../../../../lib/password";

export async function POST(request: Request) {
  const body = await request.json() as {
    email: string;
    password?: string; // For now, simple auth. In production, use proper password hashing
    organizationId?: string;
  };
  
  if (!body.email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }
  
  // Simple authentication (in production, use proper password hashing and validation)
  // For demo purposes, find user by email (no password required)
  
  // Auto-seed demo users if no users exist
  const allOrgs = await import("../../../../lib/db").then(m => {
    const orgs = m.listOrganizations();
    return orgs;
  });
  
  // Check if we have any users, if not, seed demo data
  let hasUsers = false;
  for (const org of allOrgs) {
    const users = getUsersByOrganization(org.id);
    if (users.length > 0) {
      hasUsers = true;
      break;
    }
  }
  
  if (!hasUsers && allOrgs.length === 0) {
    // Seed demo data
    const { saveOrganization, saveUser, saveClient } = await import("../../../../lib/db");
    
    const demoOrg = {
      id: "org-demo-1",
      name: "NAV Sarpsborg",
      slug: "nav-sarpsborg",
      createdAt: new Date().toISOString(),
      settings: {
        autoGenerateCV: true,
        autoGenerateCoverLetter: true,
        autoCreateFolders: true
      }
    };
    
    saveOrganization(demoOrg);
    
    const demoUsers = [
      {
        id: "user-admin-1",
        organizationId: demoOrg.id,
        email: "admin@demo.no",
        name: "Admin Bruker",
        role: "admin" as const,
        createdAt: new Date().toISOString()
      },
      {
        id: "user-admin-jessie",
        organizationId: demoOrg.id,
        email: "jm.tizwell@gmail.com",
        name: "Jessie Macharia",
        role: "admin" as const,
        createdAt: new Date().toISOString()
      },
      {
        id: "user-consultant-1",
        organizationId: demoOrg.id,
        email: "konsulent@demo.no",
        name: "Konsulent Bruker",
        role: "consultant" as const,
        createdAt: new Date().toISOString()
      },
      {
        id: "user-client-1",
        organizationId: demoOrg.id,
        email: "jessie.macharia@demo.no",
        name: "Jessie Macharia",
        role: "client" as const,
        createdAt: new Date().toISOString()
      }
    ];
    
    demoUsers.forEach(u => saveUser(u));
    
    saveClient({
      id: "client-jessie-1",
      organizationId: demoOrg.id,
      name: "Jessie Macharia",
      email: "jessie.macharia@demo.no",
      createdAt: new Date().toISOString()
    });
  }
  
  // Find user by email
  let user = null;
  const updatedOrgs = await import("../../../../lib/db").then(m => m.listOrganizations());
  
  for (const org of updatedOrgs) {
    const users = getUsersByOrganization(org.id);
    const found = users.find(u => u.email === body.email);
    if (found) {
      user = found;
      break;
    }
  }
  
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  
  // Get full user data (including password hash)
  const fullUser = getUser(user.id);
  if (!fullUser) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  
  // Verify password if user has one set
  if (fullUser.passwordHash) {
    if (!body.password) {
      return NextResponse.json({ error: "Password required" }, { status: 401 });
    }
    
    if (!verifyPassword(body.password, fullUser.passwordHash)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
  }
  // If no password hash, allow login (for backwards compatibility during migration)
  
  // Create session
  const sessionId = createSession(user.id);
  
  return NextResponse.json({
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      mustChangePassword: fullUser.mustChangePassword || false
    }
  });
}

export async function GET(request: Request) {
  // Check if user is authenticated (for client-side auth check)
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");
  
  if (!sessionId) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  const { getSession, getAuthUser } = await import("../../../../lib/auth");
  const session = getSession(sessionId);
  
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  const user = getAuthUser(session.userId);
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  
  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId
    }
  });
}

