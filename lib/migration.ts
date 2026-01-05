// Migration utilities for importing existing job application data from Jobb_Søknad_Pakke/

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface ParsedApplication {
  company: string;
  jobTitle: string;
  status: "planlagt" | "forberedes" | "sendt" | "intervju" | "avslått" | "tilbud" | "ansatt";
  deadline?: string;
  location?: string;
  employmentType?: string;
  listingUrl?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  angle?: string;
  notes?: string;
  cvText?: string;
  coverLetterText?: string;
  sentAt?: string;
  interviewDates?: string[];
  folder: "active" | "avslag" | "planlagt";
}

export interface ParsedCompetenceBank {
  skills: string[];
  experiences: Array<{
    title: string;
    company: string;
    period: string;
    description: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    period: string;
    description?: string;
  }>;
  languages: Array<{
    language: string;
    level: string;
  }>;
}

// Parse the main søknadsoversikt.md to get application status
export function parseApplicationOverview(content: string): Map<string, {
  status: string;
  sentDate?: string;
  deadline?: string;
  location?: string;
  employmentType?: string;
  contactName?: string;
  interviewDates?: string[];
}> {
  const applications = new Map();
  
  // Parse the table rows
  const lines = content.split("\n");
  
  for (const line of lines) {
    if (!line.startsWith("|") || line.includes(":---")) continue;
    
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    
    const company = cells[0]?.replace(/\*\*/g, "").trim();
    if (!company || company === "Bedrift") continue;
    
    const jobTitle = cells[1] || "";
    const form = cells[2] || "";
    const location = cells[4] || "";
    const deadline = cells[5] || "";
    const sentDate = cells[6] || "";
    const statusText = cells[7] || "";
    const contactName = cells[8] || "";
    
    // Parse interview dates from columns
    const interviewDates: string[] = [];
    for (let i = 15; i <= 19; i++) {
      if (cells[i] && cells[i] !== "-" && cells[i].includes(".")) {
        interviewDates.push(cells[i]);
      }
    }
    
    // Determine status
    let status = "planlagt";
    if (statusText.includes("Avslått") || statusText.includes("❌")) {
      status = "avslått";
    } else if (statusText.includes("Intervju") || statusText.includes("🎯")) {
      status = "intervju";
    } else if (statusText.includes("Sendt") || statusText.includes("✉️")) {
      status = "sendt";
    } else if (statusText.includes("Under arbeid") || statusText.includes("📝")) {
      status = "forberedes";
    }
    
    applications.set(company, {
      status,
      sentDate: sentDate !== "-" ? sentDate : undefined,
      deadline: deadline !== "-" && deadline !== "Snarest" ? deadline : undefined,
      location: location !== "-" ? location : undefined,
      employmentType: form !== "-" ? form : undefined,
      contactName: contactName,
      interviewDates: interviewDates.length > 0 ? interviewDates : undefined
    });
  }
  
  return applications;
}

// Parse job listing markdown
export function parseJobListing(content: string): {
  company?: string;
  jobTitle?: string;
  deadline?: string;
  employmentType?: string;
  location?: string;
  contactInfo?: string;
  listingUrl?: string;
  angle?: string;
  notes?: string;
} {
  const result: Record<string, string | undefined> = {};
  
  // Extract company from title
  const titleMatch = content.match(/^#\s+(.+?)$/m);
  if (titleMatch) {
    result.jobTitle = titleMatch[1].replace(/[()]/g, "").trim();
  }
  
  // Extract bold company name
  const companyMatch = content.match(/\*\*(.+?)\*\*/);
  if (companyMatch) {
    result.company = companyMatch[1];
  }
  
  // Extract deadline
  const deadlineMatch = content.match(/Frist:\*?\*?\s*(.+?)$/m);
  if (deadlineMatch) {
    result.deadline = deadlineMatch[1].trim();
  }
  
  // Extract employment type
  const formMatch = content.match(/Ansettelsesform:\*?\*?\s*(.+?)$/m);
  if (formMatch) {
    result.employmentType = formMatch[1].trim();
  }
  
  // Extract location
  const locationMatch = content.match(/Sted:\*?\*?\s*(.+?)$/m);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }
  
  // Extract contact
  const contactMatch = content.match(/Kontakt:\*?\*?\s*(.+?)$/m);
  if (contactMatch) {
    result.contactInfo = contactMatch[1].trim();
  }
  
  // Extract link
  const linkMatch = content.match(/Link:\s*(.+?)$/m);
  if (linkMatch) {
    result.listingUrl = linkMatch[1].trim();
  }
  
  // Extract angle
  const angleMatch = content.match(/Din vinkel:\*?\*?\s*(.+?)(?=\n\n|Link:|$)/s);
  if (angleMatch) {
    result.angle = angleMatch[1].trim();
  }
  
  return result;
}

// Parse CV profile text
export function parseCVProfile(content: string): string {
  // Remove markdown formatting
  let text = content
    .replace(/\*\*PROFIL\*\*/g, "")
    .replace(/\*\*/g, "")
    .trim();
  
  return text;
}

// Parse cover letter
export function parseCoverLetter(content: string): string {
  // Remove markdown title
  let text = content
    .replace(/^#\s+.+?\n/m, "")
    .trim();
  
  return text;
}

// Parse CV text from the master CV
export function parseMasterCV(content: string): string {
  return content;
}

// Parse competence bank markdown
export function parseCompetenceBank(content: string): ParsedCompetenceBank {
  const result: ParsedCompetenceBank = {
    skills: [],
    experiences: [],
    education: [],
    languages: []
  };
  
  // Extract skill categories from section headers
  const sections = content.split(/##\s+/);
  
  for (const section of sections) {
    // Extract section title
    const titleMatch = section.match(/^[\d\s\.\w,&\(\)]+/);
    if (titleMatch) {
      const title = titleMatch[0].trim();
      // Add as skill category
      if (title && !title.includes("Kompetansebank")) {
        // Extract just the skill name without numbers and emojis
        const cleanTitle = title.replace(/^\d+\.\s*/, "").replace(/[🧠🎨📈🎬🤖📅🤝🌟]/g, "").trim();
        if (cleanTitle) {
          result.skills.push(cleanTitle);
        }
      }
    }
  }
  
  return result;
}

// Import data to Supabase
export async function importToSupabase(
  applications: ParsedApplication[],
  competenceBank: ParsedCompetenceBank,
  userId: string,
  organizationId: string,
  clientId: string,
  cvMasterText: string
) {
  const supabase = createClientComponentClient();
  const results = {
    applications: { success: 0, failed: 0 },
    competenceBank: { success: false },
    errors: [] as string[]
  };

  // Import competence bank
  try {
    const { error } = await supabase
      .from("competence_banks")
      .upsert({
        client_id: clientId,
        skills: competenceBank.skills,
        experiences: competenceBank.experiences,
        education: competenceBank.education,
        languages: competenceBank.languages,
        certifications: []
      });

    if (error) {
      results.errors.push(`Competence bank: ${error.message}`);
    } else {
      results.competenceBank.success = true;
    }
  } catch (e) {
    results.errors.push(`Competence bank: ${String(e)}`);
  }

  // Import applications
  for (const app of applications) {
    try {
      // Map status to enum
      const statusMap: Record<string, string> = {
        "planlagt": "planlagt",
        "forberedes": "forberedes",
        "sendt": "sendt",
        "intervju": "intervju",
        "avslått": "avslått",
        "tilbud": "tilbud",
        "ansatt": "ansatt"
      };

      const { error } = await supabase.from("applications").insert({
        user_id: userId,
        organization_id: organizationId,
        client_id: clientId,
        company: app.company,
        job_title: app.jobTitle,
        status: statusMap[app.status] || "planlagt",
        deadline: app.deadline || null,
        location: app.location || null,
        employment_type: app.employmentType || null,
        listing_url: app.listingUrl || null,
        angle: app.angle || null,
        notes: app.notes || null,
        contact_name: app.contactName || null,
        contact_email: app.contactEmail || null,
        contact_phone: app.contactPhone || null,
        cv_text: app.cvText || cvMasterText || null,
        cover_letter_text: app.coverLetterText || null,
        sent_at: app.sentAt ? new Date(app.sentAt).toISOString() : null,
        interview_dates: app.interviewDates?.map(d => new Date(d).toISOString()) || null
      });

      if (error) {
        results.errors.push(`${app.company}: ${error.message}`);
        results.applications.failed++;
      } else {
        results.applications.success++;
      }
    } catch (e) {
      results.errors.push(`${app.company}: ${String(e)}`);
      results.applications.failed++;
    }
  }

  return results;
}

// Helper to parse Norwegian date format (DD.MM.YY or DD.MM.YYYY) to ISO
export function parseNorwegianDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "-" || dateStr === "Snarest") return null;
  
  const parts = dateStr.trim().split(".");
  if (parts.length !== 3) return null;
  
  let [day, month, year] = parts.map(p => parseInt(p, 10));
  
  // Handle 2-digit year
  if (year < 100) {
    year = year + 2000;
  }
  
  // Create date
  const date = new Date(year, month - 1, day);
  if (isNaN(date.getTime())) return null;
  
  return date.toISOString().split("T")[0];
}

