import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import {
  parseApplicationOverview,
  parseJobListing,
  parseCVProfile,
  parseCoverLetter,
  parseCompetenceBank,
  parseNorwegianDate,
  type ParsedApplication
} from "../../../lib/migration";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// This endpoint reads local files and imports them to Supabase
// It only works in development mode where file system access is available
export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "Migration is only available in development mode" },
      { status: 403 }
    );
  }

  try {
    const { userId, organizationId, clientId } = await request.json();

    if (!userId || !organizationId || !clientId) {
      return NextResponse.json(
        { error: "userId, organizationId, and clientId are required" },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const basePath = path.join(process.cwd(), "Jobb_Søknad_Pakke");

    // Check if the folder exists
    if (!fs.existsSync(basePath)) {
      return NextResponse.json(
        { error: "Jobb_Søknad_Pakke folder not found" },
        { status: 404 }
      );
    }

    const results = {
      applications: { success: 0, failed: 0, details: [] as string[] },
      competenceBank: { success: false },
      errors: [] as string[]
    };

    // 1. Read the overview file to get status information
    const overviewPath = path.join(basePath, "00_Oversikt", "Søknadsoversikt.md");
    let overviewData = new Map<string, any>();
    if (fs.existsSync(overviewPath)) {
      const overviewContent = fs.readFileSync(overviewPath, "utf-8");
      overviewData = parseApplicationOverview(overviewContent);
    }

    // 2. Read master CV text
    const cvMasterPath = path.join(basePath, "03_CV_Master", "CV-tekst.md");
    let cvMasterText = "";
    if (fs.existsSync(cvMasterPath)) {
      cvMasterText = fs.readFileSync(cvMasterPath, "utf-8");
    }

    // 3. Read competence bank
    const competencePath = path.join(basePath, "01_Ressurser", "Kompetansebank.md");
    if (fs.existsSync(competencePath)) {
      const competenceContent = fs.readFileSync(competencePath, "utf-8");
      const competenceData = parseCompetenceBank(competenceContent);

      const { error: compError } = await supabase
        .from("competence_banks")
        .upsert({
          client_id: clientId,
          skills: competenceData.skills,
          experiences: competenceData.experiences,
          education: competenceData.education,
          languages: competenceData.languages,
          certifications: []
        });

      if (compError) {
        results.errors.push(`Kompetansebank: ${compError.message}`);
      } else {
        results.competenceBank.success = true;
      }
    }

    // 4. Read all company folders
    const søknaderPath = path.join(basePath, "02_Søknader");
    const folders = [
      { path: path.join(søknaderPath, "Alle selskaper"), type: "active" },
      { path: path.join(søknaderPath, "Avslag"), type: "avslag" },
      { path: path.join(søknaderPath, "Planlagte_Søknader"), type: "planlagt" }
    ];

    const applications: ParsedApplication[] = [];

    for (const folder of folders) {
      if (!fs.existsSync(folder.path)) continue;

      const companies = fs.readdirSync(folder.path);

      for (const company of companies) {
        const companyPath = path.join(folder.path, company);
        
        // Skip if it's a file (like .md files in Planlagte_Søknader)
        if (!fs.statSync(companyPath).isDirectory()) {
          // Check if it's a planned application file
          if (company.endsWith(".md") && folder.type === "planlagt") {
            const content = fs.readFileSync(companyPath, "utf-8");
            const companyName = company.replace(".md", "");
            
            applications.push({
              company: companyName,
              jobTitle: "Under planlegging",
              status: "planlagt",
              folder: "planlagt"
            });
          }
          continue;
        }

        const app: ParsedApplication = {
          company,
          jobTitle: "",
          status: "planlagt",
          folder: folder.type as "active" | "avslag" | "planlagt"
        };

        // Get status from overview
        const overviewInfo = overviewData.get(company);
        if (overviewInfo) {
          app.status = overviewInfo.status as any;
          app.location = overviewInfo.location;
          app.employmentType = overviewInfo.employmentType;
          app.contactName = overviewInfo.contactName;
          if (overviewInfo.sentDate) {
            app.sentAt = parseNorwegianDate(overviewInfo.sentDate) || undefined;
          }
          if (overviewInfo.interviewDates) {
            app.interviewDates = overviewInfo.interviewDates
              .map((d: string) => parseNorwegianDate(d))
              .filter(Boolean) as string[];
          }
        }

        // Override status for Avslag folder
        if (folder.type === "avslag") {
          app.status = "avslått";
        }

        // Read files in company folder
        const files = fs.readdirSync(companyPath);

        for (const file of files) {
          const filePath = path.join(companyPath, file);
          
          if (file === "Utlysning.md") {
            const content = fs.readFileSync(filePath, "utf-8");
            const listingData = parseJobListing(content);
            
            if (listingData.jobTitle) app.jobTitle = listingData.jobTitle;
            if (listingData.deadline) app.deadline = parseNorwegianDate(listingData.deadline) || undefined;
            if (listingData.location) app.location = listingData.location;
            if (listingData.employmentType) app.employmentType = listingData.employmentType;
            if (listingData.listingUrl) app.listingUrl = listingData.listingUrl;
            if (listingData.angle) app.angle = listingData.angle;
            if (listingData.contactInfo) app.contactEmail = listingData.contactInfo;
          }
          
          if (file === "CV-profile.md" || file === "CV-profil.md") {
            const content = fs.readFileSync(filePath, "utf-8");
            app.cvText = parseCVProfile(content);
          }
          
          if (file === "Søknadsbrev.md" || file === "Cover Letter.md") {
            const content = fs.readFileSync(filePath, "utf-8");
            app.coverLetterText = parseCoverLetter(content);
          }
        }

        // Default job title if not found
        if (!app.jobTitle) {
          app.jobTitle = "Stilling ikke spesifisert";
        }

        applications.push(app);
      }
    }

    // 5. Insert applications to Supabase
    for (const app of applications) {
      try {
        const { error } = await supabase.from("applications").insert({
          user_id: userId,
          organization_id: organizationId,
          client_id: clientId,
          company: app.company,
          job_title: app.jobTitle,
          status: app.status,
          deadline: app.deadline || null,
          location: app.location || null,
          employment_type: app.employmentType || null,
          listing_url: app.listingUrl || null,
          angle: app.angle || null,
          notes: app.notes || null,
          contact_name: app.contactName || null,
          contact_email: app.contactEmail || null,
          contact_phone: app.contactPhone || null,
          cv_text: app.cvText || null,
          cover_letter_text: app.coverLetterText || null,
          sent_at: app.sentAt || null,
          interview_dates: app.interviewDates || null
        });

        if (error) {
          results.errors.push(`${app.company}: ${error.message}`);
          results.applications.failed++;
        } else {
          results.applications.success++;
          results.applications.details.push(`✓ ${app.company} (${app.status})`);
        }
      } catch (e) {
        results.errors.push(`${app.company}: ${String(e)}`);
        results.applications.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      results,
      totalApplications: applications.length
    });

  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}

// Get migration status / preview
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { available: false, reason: "Only available in development" },
      { status: 200 }
    );
  }

  const basePath = path.join(process.cwd(), "Jobb_Søknad_Pakke");
  
  if (!fs.existsSync(basePath)) {
    return NextResponse.json(
      { available: false, reason: "Jobb_Søknad_Pakke folder not found" },
      { status: 200 }
    );
  }

  // Count applications
  const søknaderPath = path.join(basePath, "02_Søknader");
  let totalCompanies = 0;
  const folders = ["Alle selskaper", "Avslag"];

  for (const folder of folders) {
    const folderPath = path.join(søknaderPath, folder);
    if (fs.existsSync(folderPath)) {
      const companies = fs.readdirSync(folderPath).filter(f => 
        fs.statSync(path.join(folderPath, f)).isDirectory()
      );
      totalCompanies += companies.length;
    }
  }

  // Count planned
  const planlagtePath = path.join(søknaderPath, "Planlagte_Søknader");
  if (fs.existsSync(planlagtePath)) {
    const planned = fs.readdirSync(planlagtePath).filter(f => f.endsWith(".md"));
    totalCompanies += planned.length;
  }

  return NextResponse.json({
    available: true,
    preview: {
      totalApplications: totalCompanies,
      hasCompetenceBank: fs.existsSync(path.join(basePath, "01_Ressurser", "Kompetansebank.md")),
      hasMasterCV: fs.existsSync(path.join(basePath, "03_CV_Master", "CV-tekst.md"))
    }
  });
}

