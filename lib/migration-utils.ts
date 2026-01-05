/**
 * Migration utilities for importing data from Jobb_Søknad_Pakke folder structure
 * to Supabase database
 */

import fs from "fs";
import path from "path";

export interface ParsedApplication {
  company: string;
  jobTitle: string;
  status: "planlagt" | "sendt" | "intervju" | "avslått" | "ansatt";
  deadline?: string;
  location?: string;
  employmentType?: string;
  listingUrl?: string;
  angle?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  sentAt?: string;
  cvText?: string;
  coverLetterText?: string;
  notes?: string;
  folderPath: string;
  hasCV: boolean;
  hasCoverLetter: boolean;
  cvFileName?: string;
  coverLetterFileName?: string;
}

export interface MigrationResult {
  success: boolean;
  applications: ParsedApplication[];
  errors: string[];
  competenceBank?: string;
  cvMasterText?: string;
}

/**
 * Parse the Søknadsoversikt.md to extract status information for each company
 */
function parseOverview(overviewPath: string): Map<string, { status: string; sentDate?: string; deadline?: string; location?: string; form?: string; contact?: string; notes?: string }> {
  const statusMap = new Map();
  
  if (!fs.existsSync(overviewPath)) {
    return statusMap;
  }
  
  const content = fs.readFileSync(overviewPath, "utf8");
  const lines = content.split("\n");
  
  for (const line of lines) {
    if (!line.startsWith("|") || line.includes(":---")) continue;
    
    const cells = line.split("|").map(c => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    
    // Extract company name (remove ** markers)
    const company = cells[0].replace(/\*\*/g, "").trim();
    if (!company || company === "Bedrift") continue;
    
    // Check for status indicators
    let status = "planlagt";
    const statusCell = cells[7] || "";
    
    if (statusCell.includes("Avslått") || statusCell.includes("❌")) {
      status = "avslått";
    } else if (statusCell.includes("Intervju") || statusCell.includes("🎯")) {
      status = "intervju";
    } else if (statusCell.includes("Sendt") || statusCell.includes("✉️")) {
      status = "sendt";
    } else if (statusCell.includes("Under arbeid") || statusCell.includes("📝")) {
      status = "planlagt";
    }
    
    statusMap.set(company, {
      status,
      sentDate: cells[6] || undefined,
      deadline: cells[5] || undefined,
      location: cells[4] || undefined,
      form: cells[2] || undefined,
      contact: cells[8] || undefined,
      notes: cells[9] || undefined,
    });
  }
  
  return statusMap;
}

/**
 * Parse Utlysning.md file to extract job details
 */
function parseUtlysning(filePath: string): Partial<ParsedApplication> {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, "utf8");
  const result: Partial<ParsedApplication> = {};
  
  // Extract job title from first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    result.jobTitle = titleMatch[1].trim();
  }
  
  // Extract company from second line (bold)
  const companyMatch = content.match(/^\*\*(.+?)\*\*$/m);
  if (companyMatch) {
    result.company = companyMatch[1].trim();
  }
  
  // Extract deadline
  const deadlineMatch = content.match(/\*\s+\*\*Frist:\*\*\s*(.+)/);
  if (deadlineMatch) {
    result.deadline = deadlineMatch[1].trim();
  }
  
  // Extract employment type
  const formMatch = content.match(/\*\s+\*\*Ansettelsesform:\*\*\s*(.+)/);
  if (formMatch) {
    result.employmentType = formMatch[1].trim();
  }
  
  // Extract location
  const locationMatch = content.match(/\*\s+\*\*Sted:\*\*\s*(.+)/);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }
  
  // Extract contact
  const contactMatch = content.match(/\*\s+\*\*Kontakt:\*\*\s*(.+)/);
  if (contactMatch) {
    result.contactName = contactMatch[1].trim();
  }
  
  // Extract angle/din vinkel
  const angleMatch = content.match(/\*\*Din vinkel:\*\*\s*([\s\S]*?)(?=Link:|$)/);
  if (angleMatch) {
    result.angle = angleMatch[1].trim();
  }
  
  // Extract link
  const linkMatch = content.match(/Link:\s*(https?:\/\/[^\s]+)/);
  if (linkMatch) {
    result.listingUrl = linkMatch[1].trim();
  }
  
  return result;
}

/**
 * Read CV profile or cover letter markdown file
 */
function readMarkdownContent(filePath: string): string | undefined {
  if (!fs.existsSync(filePath)) {
    return undefined;
  }
  
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Scan a company folder and extract all application data
 */
function parseCompanyFolder(folderPath: string, companyName: string, overviewData: Map<string, any>): ParsedApplication {
  const files = fs.readdirSync(folderPath);
  
  // Parse Utlysning.md for job details
  const utlysningPath = path.join(folderPath, "Utlysning.md");
  const utlysningData = parseUtlysning(utlysningPath);
  
  // Get status from overview
  const overviewInfo = overviewData.get(companyName) || { status: "planlagt" };
  
  // Check for CV files
  const cvFile = files.find(f => 
    f.toLowerCase().includes("cv") && 
    (f.endsWith(".pdf") || f.endsWith(".doc") || f.endsWith(".docx"))
  );
  
  // Check for cover letter files
  const coverLetterFile = files.find(f => 
    (f.toLowerCase().includes("søknad") || f.toLowerCase().includes("cover")) && 
    (f.endsWith(".pdf") || f.endsWith(".doc") || f.endsWith(".docx"))
  );
  
  // Read CV profile text
  let cvText: string | undefined;
  const cvProfilePath = path.join(folderPath, "CV-profile.md");
  const cvProfilPath = path.join(folderPath, "CV-profil.md");
  if (fs.existsSync(cvProfilePath)) {
    cvText = readMarkdownContent(cvProfilePath);
  } else if (fs.existsSync(cvProfilPath)) {
    cvText = readMarkdownContent(cvProfilPath);
  }
  
  // Read cover letter text
  let coverLetterText: string | undefined;
  const soknadPath = path.join(folderPath, "Søknadsbrev.md");
  const coverLetterPath = path.join(folderPath, "Cover Letter.md");
  const soknadstekstPath = path.join(folderPath, "Søknadstekst");
  if (fs.existsSync(soknadPath)) {
    coverLetterText = readMarkdownContent(soknadPath);
  } else if (fs.existsSync(coverLetterPath)) {
    coverLetterText = readMarkdownContent(coverLetterPath);
  } else if (fs.existsSync(soknadstekstPath)) {
    coverLetterText = readMarkdownContent(soknadstekstPath);
  }
  
  // Determine status based on folder location and overview
  let status: ParsedApplication["status"] = "planlagt";
  if (folderPath.includes("Avslag")) {
    status = "avslått";
  } else if (overviewInfo.status) {
    status = overviewInfo.status as ParsedApplication["status"];
  }
  
  // Parse sent date
  let sentAt: string | undefined;
  if (overviewInfo.sentDate && overviewInfo.sentDate !== "-") {
    // Try to parse Norwegian date format (DD.MM.YY)
    const dateMatch = overviewInfo.sentDate.match(/(\d{2})\.(\d{2})\.(\d{2})/);
    if (dateMatch) {
      sentAt = `20${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
    }
  }
  
  return {
    company: utlysningData.company || companyName,
    jobTitle: utlysningData.jobTitle || "Stilling",
    status,
    deadline: utlysningData.deadline || overviewInfo.deadline,
    location: utlysningData.location || overviewInfo.location,
    employmentType: utlysningData.employmentType || overviewInfo.form,
    listingUrl: utlysningData.listingUrl,
    angle: utlysningData.angle,
    contactName: utlysningData.contactName || overviewInfo.contact,
    notes: overviewInfo.notes,
    sentAt,
    cvText,
    coverLetterText,
    folderPath,
    hasCV: !!cvFile,
    hasCoverLetter: !!coverLetterFile,
    cvFileName: cvFile,
    coverLetterFileName: coverLetterFile,
  };
}

/**
 * Main migration function - scans the Jobb_Søknad_Pakke folder and extracts all data
 */
export function scanLocalData(basePath: string): MigrationResult {
  const result: MigrationResult = {
    success: false,
    applications: [],
    errors: [],
  };
  
  try {
    // Check if base path exists
    if (!fs.existsSync(basePath)) {
      result.errors.push(`Base path does not exist: ${basePath}`);
      return result;
    }
    
    // Read overview for status information
    const overviewPath = path.join(basePath, "00_Oversikt", "Søknadsoversikt.md");
    const overviewData = parseOverview(overviewPath);
    
    // Read competence bank
    const competenceBankPath = path.join(basePath, "01_Ressurser", "Kompetansebank.md");
    if (fs.existsSync(competenceBankPath)) {
      result.competenceBank = fs.readFileSync(competenceBankPath, "utf8");
    }
    
    // Read CV master text
    const cvMasterPath = path.join(basePath, "03_CV_Master", "CV-tekst.md");
    if (fs.existsSync(cvMasterPath)) {
      result.cvMasterText = fs.readFileSync(cvMasterPath, "utf8");
    }
    
    // Scan "Alle selskaper" folder
    const alleSelskaper = path.join(basePath, "02_Søknader", "Alle selskaper");
    if (fs.existsSync(alleSelskaper)) {
      const companies = fs.readdirSync(alleSelskaper, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      for (const company of companies) {
        try {
          const folderPath = path.join(alleSelskaper, company);
          const app = parseCompanyFolder(folderPath, company, overviewData);
          result.applications.push(app);
        } catch (err) {
          result.errors.push(`Error parsing ${company}: ${err}`);
        }
      }
    }
    
    // Scan "Avslag" folder
    const avslagFolder = path.join(basePath, "02_Søknader", "Avslag");
    if (fs.existsSync(avslagFolder)) {
      const companies = fs.readdirSync(avslagFolder, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);
      
      for (const company of companies) {
        try {
          const folderPath = path.join(avslagFolder, company);
          const app = parseCompanyFolder(folderPath, company, overviewData);
          app.status = "avslått"; // Force status for Avslag folder
          result.applications.push(app);
        } catch (err) {
          result.errors.push(`Error parsing ${company} (Avslag): ${err}`);
        }
      }
    }
    
    // Scan "Planlagte_Søknader" folder for planned applications
    const planlagteFolder = path.join(basePath, "02_Søknader", "Planlagte_Søknader");
    if (fs.existsSync(planlagteFolder)) {
      const files = fs.readdirSync(planlagteFolder)
        .filter(f => f.endsWith(".md"));
      
      for (const file of files) {
        try {
          const filePath = path.join(planlagteFolder, file);
          const companyName = file.replace(".md", "");
          
          // Check if already processed from Alle selskaper
          const existingApp = result.applications.find(a => a.company === companyName);
          if (existingApp) {
            // Just update status if needed
            if (existingApp.status === "planlagt") {
              existingApp.status = "planlagt";
            }
          } else {
            // Parse the planned application file
            const utlysningData = parseUtlysning(filePath);
            result.applications.push({
              company: utlysningData.company || companyName,
              jobTitle: utlysningData.jobTitle || "Stilling",
              status: "planlagt",
              deadline: utlysningData.deadline,
              location: utlysningData.location,
              employmentType: utlysningData.employmentType,
              listingUrl: utlysningData.listingUrl,
              angle: utlysningData.angle,
              contactName: utlysningData.contactName,
              folderPath: filePath,
              hasCV: false,
              hasCoverLetter: false,
            });
          }
        } catch (err) {
          result.errors.push(`Error parsing planned application ${file}: ${err}`);
        }
      }
    }
    
    result.success = result.applications.length > 0;
    
  } catch (err) {
    result.errors.push(`Migration scan failed: ${err}`);
  }
  
  return result;
}

/**
 * Get the default path for Jobb_Søknad_Pakke
 */
export function getDefaultDataPath(): string {
  // In development, use the local path
  return path.join(process.cwd(), "Jobb_Søknad_Pakke");
}

