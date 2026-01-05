import { NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/auth";

export async function POST(request: Request) {
  const body = await request.json() as { sessionId?: string };
  
  if (body.sessionId) {
    deleteSession(body.sessionId);
  }
  
  return NextResponse.json({ success: true });
}







