import { cookies, headers } from "next/headers";
import { getSession, getAuthUser } from "./auth";

export async function getCurrentUserServer() {
  try {
    const cookieStore = await cookies();
    const headersList = await headers();
    
    const sessionId = 
      headersList.get("x-session-id") ||
      cookieStore.get("sessionId")?.value ||
      null;

    if (!sessionId) {
      return null;
    }

    const session = getSession(sessionId);
    if (!session) {
      return null;
    }

    const user = getAuthUser(session.userId);
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}







