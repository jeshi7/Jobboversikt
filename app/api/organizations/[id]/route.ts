import { NextRequest, NextResponse } from "next/server";
import { getSession, getAuthUser } from "../../../../lib/auth";
import { deleteOrganization, getOrganization, getUsersByOrganization, getClientsByOrganization } from "../../../../lib/db";

/**
 * DELETE /api/organizations/[id] - Delete an organization (admin only)
 */
export async function DELETE(
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
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const organizationId = params.id;
    
    // Get organization to verify it exists
    const org = getOrganization(organizationId);
    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if organization has users or clients
    const users = getUsersByOrganization(organizationId);
    const clients = getClientsByOrganization(organizationId);

    // For now, we'll allow deletion even if there are users/clients
    // In production, you might want to prevent this or cascade delete
    // We'll just log a warning
    if (users.length > 0 || clients.length > 0) {
      console.warn(`Deleting organization ${organizationId} with ${users.length} users and ${clients.length} clients`);
      // Optionally, you could return an error and require manual cleanup:
      // return NextResponse.json(
      //   { error: "Cannot delete organization with existing users or clients" },
      //   { status: 400 }
      // );
    }

    deleteOrganization(organizationId);

    return NextResponse.json({ 
      success: true, 
      message: "Organization deleted successfully",
      deleted: {
        users: users.length,
        clients: clients.length
      }
    });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "Failed to delete organization" },
      { status: 500 }
    );
  }
}







