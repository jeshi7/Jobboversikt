import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, ".data");

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
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getFilePath(entity: string, id?: string): string {
  ensureDataDir();
  const entityDir = path.join(DATA_DIR, entity);
  if (!fs.existsSync(entityDir)) {
    fs.mkdirSync(entityDir, { recursive: true });
  }
  
  if (id) {
    return path.join(entityDir, `${id}.json`);
  }
  return entityDir;
}

export function saveOrganization(org: Organization): void {
  const filePath = getFilePath("organizations", org.id);
  fs.writeFileSync(filePath, JSON.stringify(org, null, 2), "utf8");
}

export function getOrganization(id: string): Organization | null {
  const filePath = getFilePath("organizations", id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function getOrganizationBySlug(slug: string): Organization | null {
  const orgsDir = getFilePath("organizations");
  if (!fs.existsSync(orgsDir)) return null;
  
  const files = fs.readdirSync(orgsDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const org = JSON.parse(fs.readFileSync(path.join(orgsDir, file), "utf8"));
        if (org.slug === slug) return org;
      } catch {
        continue;
      }
    }
  }
  return null;
}

export function listOrganizations(): Organization[] {
  const orgsDir = getFilePath("organizations");
  if (!fs.existsSync(orgsDir)) return [];
  
  const files = fs.readdirSync(orgsDir);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        return JSON.parse(fs.readFileSync(path.join(orgsDir, f), "utf8"));
      } catch {
        return null;
      }
    })
    .filter((org): org is Organization => org !== null);
}

export function saveUser(user: User): void {
  const filePath = getFilePath("users", user.id);
  fs.writeFileSync(filePath, JSON.stringify(user, null, 2), "utf8");
}

export function deleteUser(userId: string): void {
  const filePath = getFilePath("users", userId);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

export function getUser(id: string): User | null {
  const filePath = getFilePath("users", id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function getUsersByOrganization(organizationId: string): User[] {
  const usersDir = getFilePath("users");
  if (!fs.existsSync(usersDir)) return [];
  
  const files = fs.readdirSync(usersDir);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const user = JSON.parse(fs.readFileSync(path.join(usersDir, f), "utf8"));
        return user.organizationId === organizationId ? user : null;
      } catch {
        return null;
      }
    })
    .filter((user): user is User => user !== null);
}

export function saveClient(client: Client): void {
  const filePath = getFilePath("clients", client.id);
  fs.writeFileSync(filePath, JSON.stringify(client, null, 2), "utf8");
}

export function getClient(id: string): Client | null {
  const filePath = getFilePath("clients", id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function getClientsByOrganization(organizationId: string): Client[] {
  const clientsDir = getFilePath("clients");
  if (!fs.existsSync(clientsDir)) return [];
  
  const files = fs.readdirSync(clientsDir);
  return files
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const client = JSON.parse(fs.readFileSync(path.join(clientsDir, f), "utf8"));
        return client.organizationId === organizationId ? client : null;
      } catch {
        return null;
      }
    })
    .filter((client): client is Client => client !== null);
}

export function saveCompetenceBank(bank: CompetenceBank): void {
  const filePath = getFilePath("competenceBanks", bank.id);
  fs.writeFileSync(filePath, JSON.stringify(bank, null, 2), "utf8");
}

export function getCompetenceBank(id: string): CompetenceBank | null {
  const filePath = getFilePath("competenceBanks", id);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function getCompetenceBankByClient(clientId: string): CompetenceBank | null {
  const banksDir = getFilePath("competenceBanks");
  if (!fs.existsSync(banksDir)) return null;
  
  const files = fs.readdirSync(banksDir);
  for (const file of files) {
    if (file.endsWith(".json")) {
      try {
        const bank = JSON.parse(fs.readFileSync(path.join(banksDir, file), "utf8"));
        if (bank.clientId === clientId) return bank;
      } catch {
        continue;
      }
    }
  }
  return null;
}

