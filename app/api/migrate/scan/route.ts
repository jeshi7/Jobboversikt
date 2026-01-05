import { NextRequest, NextResponse } from "next/server";
import { scanLocalData, getDefaultDataPath } from "../../../../lib/migration-utils";
import { getSession, getAuthUser } from "../../../../lib/auth";

export async function GET(req: NextRequest) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Migration only available in development mode" },
      { status: 403 }
    );
  }
  
  // Check authentication
  const sessionId = req.headers.get("x-session-id");
  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
  
  const user = await getAuthUser(session.userId);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }
  
  try {
    const dataPath = getDefaultDataPath();
    const result = scanLocalData(dataPath);
    
    return NextResponse.json({
      success: result.success,
      applicationCount: result.applications.length,
      applications: result.applications.map(app => ({
        company: app.company,
        jobTitle: app.jobTitle,
        status: app.status,
        location: app.location,
        hasCV: app.hasCV,
        hasCoverLetter: app.hasCoverLetter,
        hasCvText: !!app.cvText,
        hasCoverLetterText: !!app.coverLetterText,
      })),
      hasCompetenceBank: !!result.competenceBank,
      hasCvMasterText: !!result.cvMasterText,
      errors: result.errors,
    });
  } catch (error) {
    console.error("Migration scan error:", error);
    return NextResponse.json(
      { error: "Failed to scan local data" },
      { status: 500 }
    );
  }
}

