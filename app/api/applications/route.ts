import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../lib/auth";
import { getClient } from "../../../lib/db";
import { loadApplications } from "../../../lib/applications";

export async function GET(request: NextRequest) {
  try {
    // Get session from request
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get selected client ID if consultant/admin is viewing specific client
    const selectedClientId = request.nextUrl.searchParams.get("clientId");

    // Get clientId if user is a client
    let clientId: string | undefined;
    if (user.role === "client") {
      // Find the client record for this user
      // In a real system, you'd have a userId -> clientId mapping
      // For now, we'll check if there's a client with matching email
      const clients = await import("../../../lib/db").then(m => {
        return m.getClientsByOrganization(user.organizationId);
      });
      const client = clients.find(c => c.email === user.email);
      clientId = client?.id;
    }

    // Load applications with filtering
    const applications = loadApplications({
      userRole: user.role,
      userOrganizationId: user.organizationId,
      userId: user.id,
      selectedClientId: selectedClientId || undefined
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Error loading applications:", error);
    return NextResponse.json(
      { error: "Failed to load applications" },
      { status: 500 }
    );
  }
}







