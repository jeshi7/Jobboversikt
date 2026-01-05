import fs from "node:fs";
import path from "node:path";
import type { Application } from "./applications";

const ROOT = process.cwd();
const METADATA_FILE = path.join(ROOT, ".data", "applications-metadata.json");

interface ApplicationMetadata {
  applicationId: string; // Maps to Application.id (company + folder)
  clientId?: string;
  organizationId?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

let metadataCache: Map<string, ApplicationMetadata> | null = null;

function ensureMetadataDir() {
  const dir = path.dirname(METADATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadMetadata(): Map<string, ApplicationMetadata> {
  if (metadataCache) return metadataCache;
  
  ensureMetadataDir();
  
  if (!fs.existsSync(METADATA_FILE)) {
    metadataCache = new Map();
    return metadataCache;
  }
  
  try {
    const content = fs.readFileSync(METADATA_FILE, "utf8");
    const data: ApplicationMetadata[] = JSON.parse(content);
    metadataCache = new Map(data.map(m => [m.applicationId, m]));
    return metadataCache;
  } catch {
    metadataCache = new Map();
    return metadataCache;
  }
}

function saveMetadata() {
  ensureMetadataDir();
  const data = Array.from(metadataCache!.values());
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), "utf8");
}

/**
 * Get metadata for an application
 */
export function getApplicationMetadata(applicationId: string): ApplicationMetadata | null {
  const metadata = loadMetadata();
  return metadata.get(applicationId) || null;
}

/**
 * Set metadata for an application
 */
export function setApplicationMetadata(
  applicationId: string,
  metadata: Partial<ApplicationMetadata>
): void {
  const allMetadata = loadMetadata();
  const existing = allMetadata.get(applicationId) || { applicationId };
  
  allMetadata.set(applicationId, {
    ...existing,
    ...metadata,
    applicationId,
    updatedAt: new Date().toISOString(),
    createdAt: existing.createdAt || new Date().toISOString()
  });
  
  metadataCache = allMetadata;
  saveMetadata();
}

/**
 * Get all applications for a specific client
 */
export function getApplicationsByClient(clientId: string): string[] {
  const metadata = loadMetadata();
  const applicationIds: string[] = [];
  
  for (const [appId, meta] of metadata.entries()) {
    if (meta.clientId === clientId) {
      applicationIds.push(appId);
    }
  }
  
  return applicationIds;
}

/**
 * Get all applications for an organization
 */
export function getApplicationsByOrganization(organizationId: string): string[] {
  const metadata = loadMetadata();
  const applicationIds: string[] = [];
  
  for (const [appId, meta] of metadata.entries()) {
    if (meta.organizationId === organizationId) {
      applicationIds.push(appId);
    }
  }
  
  return applicationIds;
}

/**
 * Clear metadata cache (useful for testing or after bulk updates)
 */
export function clearMetadataCache(): void {
  metadataCache = null;
}

/**
 * Enrich applications with metadata
 */
export function enrichApplicationsWithMetadata(applications: Application[]): Application[] {
  const metadata = loadMetadata();
  
  return applications.map(app => {
    const meta = metadata.get(app.id);
    if (!meta) return app;
    
    return {
      ...app,
      clientId: meta.clientId,
      organizationId: meta.organizationId,
      userId: meta.userId
    };
  });
}

/**
 * Filter applications based on user role and access
 */
export function filterApplicationsByAccess(
  applications: Application[],
  userRole: "admin" | "consultant" | "client",
  userOrganizationId?: string,
  userId?: string,
  selectedClientId?: string | null
): Application[] {
  // Admin sees everything
  if (userRole === "admin") {
    return applications;
  }
  
  // Consultant sees ALL applications in their organization
  // If a specific client is selected, filter to that client
  if (userRole === "consultant") {
    if (selectedClientId) {
      // Filter to specific client if selected
      return applications.filter(app => app.clientId === selectedClientId);
    }
    // Consultants see all applications (since demo data has no org metadata)
    // In production, this would filter by organizationId
    return applications.filter(app => {
      // If app has organizationId, check it matches
      if (app.organizationId) {
        return app.organizationId === userOrganizationId;
      }
      // If no organizationId on app, show it (legacy/demo data)
      return true;
    });
  }
  
  // Client sees only their own applications
  if (userRole === "client") {
    // First try to match by userId (user who created it)
    // If no userId on app, show all (for demo/legacy data)
    const hasAnyMetadata = applications.some(app => app.userId || app.clientId);
    
    if (!hasAnyMetadata) {
      // No metadata at all - show everything for demo purposes
      return applications;
    }
    
    return applications.filter(app => {
      if (app.userId === userId) return true;
      // Also allow if no userId is set (legacy data)
      if (!app.userId && !app.clientId) return true;
      return false;
    });
  }
  
  // Default: no access
  return [];
}







