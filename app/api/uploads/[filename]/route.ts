import { NextRequest, NextResponse } from "next/server";
import { getSignedFileUrl } from "../../../../lib/supabase-db";

/**
 * GET /api/uploads/[filename] - Get signed URL for file
 * The filename here is actually the storage path
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // The filename might be URL encoded, so decode it
    const storagePath = decodeURIComponent(params.filename);
    
    // If it doesn't include the uploads/ prefix, add it
    const fullPath = storagePath.startsWith("uploads/") 
      ? storagePath 
      : `uploads/${storagePath}`;

    const signedUrl = await getSignedFileUrl(fullPath);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Get file error:", error);
    return NextResponse.json(
      { error: "File not found" },
      { status: 404 }
    );
  }
}
