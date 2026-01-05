import type { User } from "./db";
import { getUser, getUsersByOrganization } from "./db";

// Simple session management (in production, use proper session management with cookies/DB)
const sessions = new Map<string, { userId: string; expiresAt: number }>();

export interface AuthUser extends User {
  role: "admin" | "consultant" | "client";
}

export function createSession(userId: string): string {
  const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  sessions.set(sessionId, {
    userId,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  return sessionId;
}

export function getSession(sessionId: string): { userId: string } | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  
  if (session.expiresAt < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  
  return { userId: session.userId };
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function getAuthUser(userId: string): AuthUser | null {
  const user = getUser(userId);
  if (!user) return null;
  
  return user as AuthUser;
}

// Role-based access control
export function hasAccess(user: AuthUser | null, requiredRole: "admin" | "consultant" | "client"): boolean {
  if (!user) return false;
  
  const roleHierarchy: Record<string, number> = {
    client: 1,
    consultant: 2,
    admin: 3
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

export function canAccessOrganization(user: AuthUser | null, organizationId: string): boolean {
  if (!user) return false;
  
  // Admins can access all
  if (user.role === "admin") return true;
  
  // Users can only access their own organization
  return user.organizationId === organizationId;
}

export function canAccessClient(user: AuthUser | null, organizationId: string): boolean {
  if (!user) return false;
  
  // Admins and consultants can access clients in their organization
  if (user.role === "admin" || user.role === "consultant") {
    return user.organizationId === organizationId;
  }
  
  // Clients can only access themselves
  if (user.role === "client") {
    return user.organizationId === organizationId;
  }
  
  return false;
}







