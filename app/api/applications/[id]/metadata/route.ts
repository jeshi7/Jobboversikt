import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../../../lib/auth";
import { setApplicationMetadata, getApplicationMetadata } from "../../../../../lib/applications-metadata";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const applicationId = params.id;
    const body = await request.json() as {
      clientId?: string;
      organizationId?: string;
    };

    // Validate access
    // Only admin, consultant, or the owning client can update metadata
    const metadata = getApplicationMetadata(applicationId);
    
    if (user.role === "client") {
      // Client can only set metadata for their own applications
      if (metadata?.userId && metadata.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "consultant") {
      // Consultant can only set metadata for clients in their organization
      if (body.organizationId && body.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Set metadata
    setApplicationMetadata(applicationId, {
      clientId: body.clientId,
      organizationId: body.organizationId || user.organizationId,
      userId: user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating application metadata:", error);
    return NextResponse.json(
      { error: "Failed to update metadata" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const applicationId = params.id;
    const metadata = getApplicationMetadata(applicationId);

    if (!metadata) {
      return NextResponse.json({ metadata: null });
    }

    // Check access
    if (user.role === "client") {
      if (metadata.userId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (user.role === "consultant") {
      if (metadata.organizationId !== user.organizationId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    // Admin can see all

    return NextResponse.json({ metadata });
  } catch (error) {
    console.error("Error getting application metadata:", error);
    return NextResponse.json(
      { error: "Failed to get metadata" },
      { status: 500 }
    );
  }
}







