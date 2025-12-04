import { kv } from "@vercel/kv";

// Check if we're running on Vercel (KV available) or locally
const isVercel = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

type NoteType =
  | "kontakt1" | "kontakt2" | "kontakt3" | "kontakt4" | "kontakt5"
  | "intervju1" | "intervju2" | "intervju3" | "intervju4";

interface NoteData {
  text: string;
  updatedAt: string;
}

interface ContactDates {
  kontakt1?: string;
  kontakt2?: string;
  kontakt3?: string;
  kontakt4?: string;
  kontakt5?: string;
  intervju1?: string;
  intervju2?: string;
  intervju3?: string;
  intervju4?: string;
}

// Key format: note:{company}:{type}
function getNoteKey(company: string, type: NoteType): string {
  return `note:${company.toLowerCase().trim()}:${type}`;
}

// Key format: dates:{company}
function getDatesKey(company: string): string {
  return `dates:${company.toLowerCase().trim()}`;
}

/**
 * Get a note from the database
 */
export async function getNote(company: string, type: NoteType): Promise<string> {
  if (!isVercel) {
    // Fallback for local development - return empty (file system handled elsewhere)
    return "";
  }

  try {
    const key = getNoteKey(company, type);
    const data = await kv.get<NoteData>(key);
    return data?.text ?? "";
  } catch (error) {
    console.error("Error reading note from KV:", error);
    return "";
  }
}

/**
 * Save a note to the database
 */
export async function saveNote(company: string, type: NoteType, text: string): Promise<boolean> {
  if (!isVercel) {
    // Fallback for local development - return false (file system handled elsewhere)
    return false;
  }

  try {
    const key = getNoteKey(company, type);
    const data: NoteData = {
      text,
      updatedAt: new Date().toISOString()
    };
    await kv.set(key, data);

    // Also update the contact dates
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear().toString().slice(2)}`;
    await updateContactDate(company, type, dateStr);

    return true;
  } catch (error) {
    console.error("Error saving note to KV:", error);
    return false;
  }
}

/**
 * Check if a note exists in the database
 */
export async function hasNote(company: string, type: NoteType): Promise<boolean> {
  if (!isVercel) {
    return false;
  }

  try {
    const key = getNoteKey(company, type);
    const exists = await kv.exists(key);
    return exists > 0;
  } catch (error) {
    console.error("Error checking note in KV:", error);
    return false;
  }
}

/**
 * Get all contact/interview dates for a company
 */
export async function getContactDates(company: string): Promise<ContactDates> {
  if (!isVercel) {
    return {};
  }

  try {
    const key = getDatesKey(company);
    const data = await kv.get<ContactDates>(key);
    return data ?? {};
  } catch (error) {
    console.error("Error reading dates from KV:", error);
    return {};
  }
}

/**
 * Update a contact/interview date
 */
async function updateContactDate(company: string, type: NoteType, date: string): Promise<void> {
  if (!isVercel) {
    return;
  }

  try {
    const key = getDatesKey(company);
    const existing = await kv.get<ContactDates>(key) ?? {};
    existing[type] = date;
    await kv.set(key, existing);
  } catch (error) {
    console.error("Error updating date in KV:", error);
  }
}

/**
 * Check if we're running on Vercel with KV
 */
export function isKVAvailable(): boolean {
  return !!isVercel;
}

/**
 * Get all notes for a company (for checking which contacts have been made)
 */
export async function getCompanyNotes(company: string): Promise<Record<NoteType, boolean>> {
  const noteTypes: NoteType[] = [
    "kontakt1", "kontakt2", "kontakt3", "kontakt4", "kontakt5",
    "intervju1", "intervju2", "intervju3", "intervju4"
  ];

  const result: Record<NoteType, boolean> = {} as Record<NoteType, boolean>;

  for (const type of noteTypes) {
    result[type] = await hasNote(company, type);
  }

  return result;
}

