import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { getSession, getAuthUser } from "../../../../../lib/auth";
import {
  getApplication,
  addDocumentToApplication,
  removeDocumentFromApplication,
  getUploadPath,
} from "../../../../../lib/app-applications";

/**
 * POST /api/app-applications/[id]/documents - Upload document
 */
export async function POST(
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

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client") {
      if (app.userId !== user.id && app.clientId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const docType = formData.get("type") as "cv" | "cover_letter" | "job_listing" | "other" | null;
    const docName = formData.get("name") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: PDF, images, Word documents" },
        { status: 400 }
      );
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "pdf";
    const filename = `${params.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(getUploadPath(filename), buffer);

    // Add document to application
    const updatedApp = addDocumentToApplication(params.id, {
      name: docName || file.name.replace(/\.[^/.]+$/, ""),
      type: docType || "other",
      filename,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
    });

    return NextResponse.json({ 
      application: updatedApp,
      document: updatedApp?.documents.find(d => d.filename === filename)
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    return NextResponse.json(
      { error: "Failed to upload document" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/app-applications/[id]/documents?docId=xxx - Remove document
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
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const app = getApplication(params.id);
    if (!app) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Check access
    if (user.role === "client") {
      if (app.userId !== user.id && app.clientId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const docId = new URL(request.url).searchParams.get("docId");
    if (!docId) {
      return NextResponse.json({ error: "Document ID required" }, { status: 400 });
    }

    const updatedApp = removeDocumentFromApplication(params.id, docId);

    return NextResponse.json({ application: updatedApp });
  } catch (error) {
    console.error("Error removing document:", error);
    return NextResponse.json(
      { error: "Failed to remove document" },
      { status: 500 }
    );
  }
}

