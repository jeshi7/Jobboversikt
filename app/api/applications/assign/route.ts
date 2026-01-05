import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../lib/auth";
import { setApplicationMetadata } from "../../../lib/applications-metadata";
import { getClient } from "../../../lib/db";

/**
 * Assign an application to a client
 * This endpoint is used when a new application is created or when updating ownership
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
      applicationId: string;
      clientId?: string;
    };

    // Determine clientId
    let clientId = body.clientId;
    
    if (!clientId && user.role === "client") {
      // If user is a client, find their clientId
      const clients = await import("../../../lib/db").then(m => {
        return m.getClientsByOrganization(user.organizationId);
      });
      const client = clients.find(c => c.email === user.email);
      clientId = client?.id;
    }

    if (!clientId) {
      // If still no clientId, and user is client, we need to create one or error
      if (user.role === "client") {
        return NextResponse.json(
          { error: "Client record not found. Please contact administrator." },
          { status: 404 }
        );
      }
      // For consultant/admin, clientId might be optional (applies to organization)
    }

    // Set metadata for the application
    setApplicationMetadata(body.applicationId, {
      clientId: clientId,
      organizationId: user.organizationId,
      userId: user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error assigning application:", error);
    return NextResponse.json(
      { error: "Failed to assign application" },
      { status: 500 }
    );
  }
}







