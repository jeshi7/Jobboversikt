import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, ".data");

// Check if we're in a read-only environment (like Vercel)
const isReadOnlyEnvironment = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  settings: {
    autoGenerateCV: boolean;
    autoGenerateCoverLetter: boolean;
    autoCreateFolders: boolean;
  };
}

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  role: "admin" | "consultant" | "client";
  passwordHash?: string; // Hashed password (optional for backwards compatibility)
  mustChangePassword?: boolean; // True if user needs to change password on first login
  createdAt: string;
}

export interface Client {
  id: string;
  organizationId: string;
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  competenceBankId?: string;
}

export interface CompetenceBank {
  id: string;
  clientId: string;
  organizationId: string;
  skills: string[];
  experiences: {
    company: string;
    role: string;
    period: string;
    description: string;
    achievements: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    period: string;
  }[];
  languages: {
    language: string;
    level: string;
  }[];
  extractedFrom?: {
    cvPath?: string;
    applicationPath?: string;
    extractedAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

function ensureDataDir() {
  if (isReadOnlyEnvironment) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch {
    // Ignore errors in read-only environment
  }
}

function getFilePath(entity: string, id?: string): string {
  ensureDataDir();
  const entityDir = path.join(DATA_DIR, entity);
  if (!isReadOnlyEnvironment) {
    try {
      if (!fs.existsSync(entityDir)) {
        fs.mkdirSync(entityDir, { recursive: true });
      }
    } catch {
      // Ignore errors in read-only environment
    }
  }
  
  if (id) {
    return path.join(entityDir, `${id}.json`);
  }
  return entityDir;
}

function safeReadDir(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

function safeReadFile(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return null;
  }
}

function safeWriteFile(filePath: string, data: string): boolean {
  if (isReadOnlyEnvironment) return false;
  try {
    fs.writeFileSync(filePath, data, "utf8");
    return true;
  } catch {
    return false;
  }
}

export function saveOrganization(org: Organization): void {
  const filePath = getFilePath("organizations", org.id);
  safeWriteFile(filePath, JSON.stringify(org, null, 2));
}

export function getOrganization(id: string): Organization | null {
  const filePath = getFilePath("organizations", id);
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getOrganizationBySlug(slug: string): Organization | null {
  const orgsDir = getFilePath("organizations");
  const files = safeReadDir(orgsDir);
  
  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = safeReadFile(path.join(orgsDir, file));
      if (content) {
        try {
          const org = JSON.parse(content);
          if (org.slug === slug) return org;
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

export function listOrganizations(): Organization[] {
  const orgsDir = getFilePath("organizations");
  const files = safeReadDir(orgsDir);
  
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const content = safeReadFile(path.join(orgsDir, f));
      if (!content) return null;
      try {
        return JSON.parse(content);
      } catch {
        return null;
      }
    })
    .filter((org): org is Organization => org !== null);
}

export function saveUser(user: User): void {
  const filePath = getFilePath("users", user.id);
  safeWriteFile(filePath, JSON.stringify(user, null, 2));
}

export function deleteUser(userId: string): void {
  if (isReadOnlyEnvironment) return;
  const filePath = getFilePath("users", userId);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore errors
  }
}

export function deleteOrganization(orgId: string): void {
  if (isReadOnlyEnvironment) return;
  const filePath = getFilePath("organizations", orgId);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore errors
  }
}

export function getUser(id: string): User | null {
  const filePath = getFilePath("users", id);
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getUsersByOrganization(organizationId: string): User[] {
  const usersDir = getFilePath("users");
  const files = safeReadDir(usersDir);
  
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const content = safeReadFile(path.join(usersDir, f));
      if (!content) return null;
      try {
        const user = JSON.parse(content);
        return user.organizationId === organizationId ? user : null;
      } catch {
        return null;
      }
    })
    .filter((user): user is User => user !== null);
}

export function saveClient(client: Client): void {
  const filePath = getFilePath("clients", client.id);
  safeWriteFile(filePath, JSON.stringify(client, null, 2));
}

export function getClient(id: string): Client | null {
  const filePath = getFilePath("clients", id);
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getClientsByOrganization(organizationId: string): Client[] {
  const clientsDir = getFilePath("clients");
  const files = safeReadDir(clientsDir);
  
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const content = safeReadFile(path.join(clientsDir, f));
      if (!content) return null;
      try {
        const client = JSON.parse(content);
        return client.organizationId === organizationId ? client : null;
      } catch {
        return null;
      }
    })
    .filter((client): client is Client => client !== null);
}

export function saveCompetenceBank(bank: CompetenceBank): void {
  const filePath = getFilePath("competenceBanks", bank.id);
  safeWriteFile(filePath, JSON.stringify(bank, null, 2));
}

export function getCompetenceBank(id: string): CompetenceBank | null {
  const filePath = getFilePath("competenceBanks", id);
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function getCompetenceBankByClient(clientId: string): CompetenceBank | null {
  const banksDir = getFilePath("competenceBanks");
  const files = safeReadDir(banksDir);
  
  for (const file of files) {
    if (file.endsWith(".json")) {
      const content = safeReadFile(path.join(banksDir, file));
      if (content) {
        try {
          const bank = JSON.parse(content);
          if (bank.clientId === clientId) return bank;
        } catch {
          continue;
        }
      }
    }
  }
  return null;
}

