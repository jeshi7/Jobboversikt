import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, ".data");
const APPLICATIONS_DIR = path.join(DATA_DIR, "applications");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");

export type ApplicationStatus = 
  | "planlagt"
  | "forberedes"
  | "sendt"
  | "intervju"
  | "avslått"
  | "tilbud"
  | "ansatt";

export interface ApplicationDocument {
  id: string;
  name: string;
  type: "cv" | "cover_letter" | "job_listing" | "other";
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface ApplicationNote {
  id: string;
  type: "kontakt" | "intervju" | "general";
  number?: number; // For kontakt1, kontakt2, intervju1, etc.
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppApplication {
  id: string;
  // Basic info
  company: string;
  jobTitle: string;
  status: ApplicationStatus;
  
  // Job details
  deadline?: string;
  location?: string;
  employmentType?: string;
  salary?: string;
  listingUrl?: string;
  
  // Application details
  angle?: string; // User's approach/angle for this application
  notes?: string; // General notes
  
  // Contact info
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  
  // Documents
  documents: ApplicationDocument[];
  
  // Follow-up notes
  followUpNotes: ApplicationNote[];
  
  // Dates
  sentAt?: string;
  interviewDates?: string[];
  
  // Multi-tenant
  clientId?: string;
  organizationId?: string;
  userId?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getApplicationPath(id: string): string {
  ensureDir(APPLICATIONS_DIR);
  return path.join(APPLICATIONS_DIR, `${id}.json`);
}

export function getUploadPath(filename: string): string {
  ensureDir(UPLOADS_DIR);
  return path.join(UPLOADS_DIR, filename);
}

export function getUploadUrl(filename: string): string {
  return `/api/uploads/${filename}`;
}

/**
 * Save an application
 */
export function saveApplication(app: AppApplication): void {
  const filePath = getApplicationPath(app.id);
  app.updatedAt = new Date().toISOString();
  fs.writeFileSync(filePath, JSON.stringify(app, null, 2), "utf8");
}

/**
 * Get an application by ID
 */
export function getApplication(id: string): AppApplication | null {
  const filePath = getApplicationPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Delete an application
 */
export function deleteApplication(id: string): boolean {
  const filePath = getApplicationPath(id);
  if (!fs.existsSync(filePath)) return false;
  
  // Get app to delete associated files
  const app = getApplication(id);
  if (app) {
    for (const doc of app.documents) {
      const uploadPath = getUploadPath(doc.filename);
      if (fs.existsSync(uploadPath)) {
        fs.unlinkSync(uploadPath);
      }
    }
  }
  
  fs.unlinkSync(filePath);
  return true;
}

/**
 * List all applications
 */
export function listApplications(): AppApplication[] {
  ensureDir(APPLICATIONS_DIR);
  
  const files = fs.readdirSync(APPLICATIONS_DIR);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(APPLICATIONS_DIR, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter((app): app is AppApplication => app !== null)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * List applications for a specific user/client/organization
 */
export function listApplicationsForUser(
  userId?: string,
  clientId?: string,
  organizationId?: string,
  userRole?: "admin" | "consultant" | "client"
): AppApplication[] {
  const allApps = listApplications();
  
  // Admin sees all
  if (userRole === "admin") {
    return allApps;
  }
  
  // Consultant sees all in their organization
  if (userRole === "consultant" && organizationId) {
    return allApps.filter(app => 
      !app.organizationId || app.organizationId === organizationId
    );
  }
  
  // Client sees only their own
  if (userRole === "client" && userId) {
    return allApps.filter(app => 
      app.userId === userId || app.clientId === clientId
    );
  }
  
  // Default: show all (for backwards compatibility)
  return allApps;
}

/**
 * Create a new application
 */
export function createApplication(
  data: Omit<AppApplication, "id" | "createdAt" | "updatedAt" | "documents" | "followUpNotes">
): AppApplication {
  const now = new Date().toISOString();
  const app: AppApplication = {
    ...data,
    id: `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    documents: [],
    followUpNotes: [],
    createdAt: now,
    updatedAt: now,
  };
  
  saveApplication(app);
  return app;
}

/**
 * Update application status
 */
export function updateApplicationStatus(id: string, status: ApplicationStatus): AppApplication | null {
  const app = getApplication(id);
  if (!app) return null;
  
  app.status = status;
  
  // Set sentAt if moving to "sendt" status
  if (status === "sendt" && !app.sentAt) {
    app.sentAt = new Date().toISOString();
  }
  
  saveApplication(app);
  return app;
}

/**
 * Add a document to an application
 */
export function addDocumentToApplication(
  appId: string,
  document: Omit<ApplicationDocument, "id" | "uploadedAt">
): AppApplication | null {
  const app = getApplication(appId);
  if (!app) return null;
  
  const doc: ApplicationDocument = {
    ...document,
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    uploadedAt: new Date().toISOString(),
  };
  
  app.documents.push(doc);
  saveApplication(app);
  return app;
}

/**
 * Remove a document from an application
 */
export function removeDocumentFromApplication(appId: string, docId: string): AppApplication | null {
  const app = getApplication(appId);
  if (!app) return null;
  
  const docIndex = app.documents.findIndex(d => d.id === docId);
  if (docIndex === -1) return app;
  
  const doc = app.documents[docIndex];
  
  // Delete the file
  const uploadPath = getUploadPath(doc.filename);
  if (fs.existsSync(uploadPath)) {
    fs.unlinkSync(uploadPath);
  }
  
  app.documents.splice(docIndex, 1);
  saveApplication(app);
  return app;
}

/**
 * Add a follow-up note
 */
export function addNoteToApplication(
  appId: string,
  note: Omit<ApplicationNote, "id" | "createdAt" | "updatedAt">
): AppApplication | null {
  const app = getApplication(appId);
  if (!app) return null;
  
  const now = new Date().toISOString();
  const newNote: ApplicationNote = {
    ...note,
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: now,
    updatedAt: now,
  };
  
  app.followUpNotes.push(newNote);
  saveApplication(app);
  return app;
}

/**
 * Update a follow-up note
 */
export function updateNoteInApplication(
  appId: string,
  noteId: string,
  content: string
): AppApplication | null {
  const app = getApplication(appId);
  if (!app) return null;
  
  const note = app.followUpNotes.find(n => n.id === noteId);
  if (!note) return app;
  
  note.content = content;
  note.updatedAt = new Date().toISOString();
  
  saveApplication(app);
  return app;
}

/**
 * Get summary statistics
 */
export function getApplicationsSummary(apps: AppApplication[]) {
  const total = apps.length;
  const sent = apps.filter(a => 
    a.status === "sendt" || 
    a.status === "intervju" || 
    a.status === "avslått" || 
    a.status === "tilbud" ||
    a.status === "ansatt"
  ).length;
  const interview = apps.filter(a => a.status === "intervju").length;
  const planned = apps.filter(a => a.status === "planlagt" || a.status === "forberedes").length;
  const offers = apps.filter(a => a.status === "tilbud").length;
  const hired = apps.filter(a => a.status === "ansatt").length;
  
  return { total, sent, interview, planned, offers, hired };
}

