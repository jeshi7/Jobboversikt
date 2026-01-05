import type { Application } from "./applications";

/**
 * Filter applications based on user role and organization
 */
export function filterApplicationsByRole(
  apps: Application[],
  userRole: "admin" | "consultant" | "client",
  organizationId?: string,
  clientId?: string
): Application[] {
  // For now, all users see all applications
  // In a full multi-tenant setup, this would filter by organization
  // and clients would only see their own applications
  
  // If client role and clientId is provided, filter to only that client's applications
  // (This would require adding clientId to Application interface)
  
  return apps;
}

/**
 * Check if user can access a specific resource
 */
export function canAccessResource(
  userRole: "admin" | "consultant" | "client",
  resourceOrganizationId?: string,
  userOrganizationId?: string,
  resourceClientId?: string,
  userClientId?: string
): boolean {
  // Admin can access everything
  if (userRole === "admin") return true;
  
  // Consultant can access resources in their organization
  if (userRole === "consultant") {
    return !resourceOrganizationId || resourceOrganizationId === userOrganizationId;
  }
  
  // Client can only access their own resources
  if (userRole === "client") {
    if (resourceClientId && userClientId) {
      return resourceClientId === userClientId;
    }
    // If no clientId specified, allow access (for backwards compatibility)
    return true;
  }
  
  return false;
}







