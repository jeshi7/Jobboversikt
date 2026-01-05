import { getSupabaseAdmin } from "./supabase";
import crypto from "crypto";

// Types matching the database schema
export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  role: "admin" | "consultant" | "client";
  password_hash: string | null;
  must_change_password: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: string;
  created_at: string;
}

export interface Client {
  id: string;
  organization_id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  user_id: string;
  client_id: string | null;
  organization_id: string;
  company: string;
  job_title: string;
  status: string;
  deadline: string | null;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  listing_url: string | null;
  angle: string | null;
  notes: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  cv_text: string | null;
  cover_letter_text: string | null;
  sent_at: string | null;
  interview_dates: string[] | null;
  created_at: string;
  updated_at: string;
  documents?: Document[];
  follow_up_notes?: FollowUpNote[];
}

export interface Document {
  id: string;
  application_id: string;
  name: string;
  type: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size: number;
  created_at: string;
}

export interface FollowUpNote {
  id: string;
  application_id: string;
  type: string;
  number: number | null;
  content: string;
  created_at: string;
  updated_at: string;
}

// Password utilities
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generatePassword(): string {
  return crypto.randomBytes(8).toString("hex");
}

// Organizations
export async function createOrganization(name: string): Promise<Organization> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("organizations")
    .insert({ name })
    .select()
    .single();

  if (error) throw new Error(`Failed to create organization: ${error.message}`);
  return data;
}

export async function getOrganization(id: string): Promise<Organization | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("organizations")
    .select()
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function listOrganizations(): Promise<Organization[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("organizations")
    .select()
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list organizations: ${error.message}`);
  return data || [];
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id);

  if (error) return false;
  return true;
}

// Users
export async function createUser(userData: {
  organization_id: string;
  email: string;
  name: string;
  role: "admin" | "consultant" | "client";
  password?: string;
}): Promise<{ user: User; temporaryPassword?: string }> {
  const supabase = getSupabaseAdmin();
  
  const temporaryPassword = userData.password || generatePassword();
  const password_hash = hashPassword(temporaryPassword);

  const { data, error } = await supabase
    .from("users")
    .insert({
      organization_id: userData.organization_id,
      email: userData.email.toLowerCase(),
      name: userData.name,
      role: userData.role,
      password_hash,
      must_change_password: !userData.password,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create user: ${error.message}`);
  
  return {
    user: data,
    temporaryPassword: userData.password ? undefined : temporaryPassword,
  };
}

export async function getUser(id: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .select()
    .eq("email", email.toLowerCase())
    .single();

  if (error) return null;
  return data;
}

export async function listUsers(organizationId?: string): Promise<User[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("users").select();
  
  if (organizationId) {
    query = query.eq("organization_id", organizationId);
  }
  
  const { data, error } = await query.order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list users: ${error.message}`);
  return data || [];
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function updateUserPassword(id: string, newPassword: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: hashPassword(newPassword),
      must_change_password: false,
    })
    .eq("id", id);

  return !error;
}

export async function deleteUser(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", id);

  return !error;
}

// Sessions
export async function createSession(userId: string): Promise<Session> {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
  
  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: userId,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("sessions")
    .select()
    .eq("id", id)
    .single();

  if (error) return null;
  
  // Check if session is expired
  if (new Date(data.expires_at) < new Date()) {
    await deleteSession(id);
    return null;
  }
  
  return data;
}

export async function deleteSession(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id);

  return !error;
}

// Clients
export async function createClient(clientData: {
  organization_id: string;
  user_id?: string;
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
}): Promise<Client> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .insert(clientData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create client: ${error.message}`);
  return data;
}

export async function getClient(id: string): Promise<Client | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select()
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function listClients(organizationId: string): Promise<Client[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("clients")
    .select()
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to list clients: ${error.message}`);
  return data || [];
}

// Applications
export async function createApplication(appData: {
  user_id: string;
  client_id?: string;
  organization_id: string;
  company: string;
  job_title: string;
  status?: string;
  deadline?: string;
  location?: string;
  employment_type?: string;
  salary?: string;
  listing_url?: string;
  angle?: string;
  notes?: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  cv_text?: string;
  cover_letter_text?: string;
}): Promise<Application> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .insert({
      ...appData,
      status: appData.status || "planlagt",
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create application: ${error.message}`);
  return data;
}

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("applications")
    .select(`
      *,
      documents (*),
      follow_up_notes (*)
    `)
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function listApplications(options?: {
  userId?: string;
  clientId?: string;
  organizationId?: string;
  status?: string;
}): Promise<Application[]> {
  const supabase = getSupabaseAdmin();
  let query = supabase.from("applications").select(`
    *,
    documents (*),
    follow_up_notes (*)
  `);

  if (options?.userId) {
    query = query.eq("user_id", options.userId);
  }
  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }
  if (options?.organizationId) {
    query = query.eq("organization_id", options.organizationId);
  }
  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });

  if (error) throw new Error(`Failed to list applications: ${error.message}`);
  return data || [];
}

export async function updateApplication(
  id: string,
  updates: Partial<Application>
): Promise<Application | null> {
  const supabase = getSupabaseAdmin();
  
  // Remove nested relations from updates
  const { documents, follow_up_notes, ...cleanUpdates } = updates;
  
  // Set sent_at if status is changing to "sendt"
  if (updates.status === "sendt" && !updates.sent_at) {
    (cleanUpdates as Partial<Application>).sent_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("applications")
    .update(cleanUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id);

  return !error;
}

// Documents
export async function createDocument(docData: {
  application_id: string;
  name: string;
  type: string;
  storage_path: string;
  original_name: string;
  mime_type: string;
  size: number;
}): Promise<Document> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("documents")
    .insert(docData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create document: ${error.message}`);
  return data;
}

export async function deleteDocument(id: string): Promise<Document | null> {
  const supabase = getSupabaseAdmin();
  
  // Get document first to return it
  const { data: doc } = await supabase
    .from("documents")
    .select()
    .eq("id", id)
    .single();

  if (!doc) return null;

  // Delete from database
  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) return null;

  // Also delete from storage
  await supabase.storage.from("documents").remove([doc.storage_path]);

  return doc;
}

// Follow-up notes
export async function createFollowUpNote(noteData: {
  application_id: string;
  type: string;
  number?: number;
  content: string;
}): Promise<FollowUpNote> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("follow_up_notes")
    .insert(noteData)
    .select()
    .single();

  if (error) throw new Error(`Failed to create note: ${error.message}`);
  return data;
}

export async function updateFollowUpNote(
  id: string,
  content: string
): Promise<FollowUpNote | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("follow_up_notes")
    .update({ content })
    .eq("id", id)
    .select()
    .single();

  if (error) return null;
  return data;
}

// File upload to Supabase Storage
export async function uploadFile(
  file: Buffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const supabase = getSupabaseAdmin();
  const path = `uploads/${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from("documents")
    .upload(path, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw new Error(`Failed to upload file: ${error.message}`);
  return path;
}

export async function getFileUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data } = supabase.storage
    .from("documents")
    .getPublicUrl(storagePath);

  return data.publicUrl;
}

export async function getSignedFileUrl(storagePath: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) throw new Error(`Failed to get signed URL: ${error.message}`);
  return data.signedUrl;
}

// Summary statistics
export async function getApplicationsSummary(organizationId?: string): Promise<{
  total: number;
  sent: number;
  interview: number;
  planned: number;
  offers: number;
  hired: number;
}> {
  const apps = await listApplications({ organizationId });
  
  return {
    total: apps.length,
    sent: apps.filter(a => 
      ["sendt", "intervju", "avslått", "tilbud", "ansatt"].includes(a.status)
    ).length,
    interview: apps.filter(a => a.status === "intervju").length,
    planned: apps.filter(a => ["planlagt", "forberedes"].includes(a.status)).length,
    offers: apps.filter(a => a.status === "tilbud").length,
    hired: apps.filter(a => a.status === "ansatt").length,
  };
}

// Check if database has any data (for initial setup)
export async function isDatabaseEmpty(): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { count } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true });

  return count === 0;
}

