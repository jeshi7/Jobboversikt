import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { 
  isGitHubConfigured, 
  readFileFromGitHub, 
  writeFileToGitHub 
} from "../../../lib/github";
import { getSession, getAuthUser } from "../../../lib/auth";
import { setApplicationMetadata } from "../../../lib/applications-metadata";
import { getClientsByOrganization } from "../../../lib/db";

export const runtime = "nodejs";

const ROOT = process.cwd();
const OVERVIEW_PATH = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "00_Oversikt",
  "Søknadsoversikt.md"
);
const BASE_DIR = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "02_Søknader",
  "Alle selskaper"
);
const AVSLAG_DIR = path.join(
  ROOT,
  "Jobb_Søknad_Pakke",
  "02_Søknader",
  "avslag"
);
const GITHUB_OVERVIEW_PATH = "Jobb_Søknad_Pakke/00_Oversikt/Søknadsoversikt.md";
const GITHUB_BASE_PATH = "Jobb_Søknad_Pakke/02_Søknader/Alle selskaper";
const GITHUB_AVSLAG_PATH = "Jobb_Søknad_Pakke/02_Søknader/avslag";

const isVercel = process.env.VERCEL === "1";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    company?: string;
    action?: "mark-intervju" | "mark-ansatt" | "mark-avslått";
    intervjuNum?: number;
    sessionId?: string;
  };

  if (!body.company || !body.action) {
    return NextResponse.json({ ok: false, message: "Ugyldig forespørsel" }, { status: 400 });
  }

  // Get user for metadata assignment
  let user = null;
  if (body.sessionId) {
    const session = getSession(body.sessionId);
    if (session) {
      user = getAuthUser(session.userId);
    }
  }

  try {
    // On Vercel with GitHub configured, use GitHub API
    if (isVercel && isGitHubConfigured()) {
      const file = await readFileFromGitHub(GITHUB_OVERVIEW_PATH);
      if (!file) {
        return NextResponse.json({ ok: false, message: "Kunne ikke lese oversikt" }, { status: 500 });
      }

      const updated = updateOverviewStatus(
        file.content,
        body.company,
        body.action,
        body.intervjuNum
      );

      if (!updated) {
        return NextResponse.json({ ok: false, message: "Kunne ikke finne selskap" }, { status: 404 });
      }

      await writeFileToGitHub(
        GITHUB_OVERVIEW_PATH,
        updated.content,
        `Oppdater status for ${body.company}: ${body.action}`,
        file.sha
      );

      // Handle additional actions based on action type
      try {
        await handleActionSpecificTasks(body.company, body.action, body.intervjuNum);
      } catch (error) {
        console.error("Error in handleActionSpecificTasks:", error);
        // Don't fail the entire request if folder operations fail
        // The status update in overview is the most important part
      }

      // Assign application metadata if user is available
      if (user) {
        try {
          await assignApplicationMetadata(body.company, user);
        } catch (error) {
          console.error("Error assigning application metadata:", error);
          // Don't fail the request if metadata assignment fails
        }
      }

      return NextResponse.json({ ok: true });
    }

    // Local development: use file system
    if (!fs.existsSync(OVERVIEW_PATH)) {
      return NextResponse.json({ ok: false, message: "Oversikt ikke funnet" }, { status: 404 });
    }

    const content = fs.readFileSync(OVERVIEW_PATH, "utf8");
    const updated = updateOverviewStatus(
      content,
      body.company,
      body.action,
      body.intervjuNum
    );

    if (!updated) {
      return NextResponse.json({ ok: false, message: "Kunne ikke finne selskap" }, { status: 404 });
    }

    fs.writeFileSync(OVERVIEW_PATH, updated.content, "utf8");

    // Handle additional actions based on action type
    try {
      await handleActionSpecificTasks(body.company, body.action, body.intervjuNum);
    } catch (error) {
      console.error("Error in handleActionSpecificTasks:", error);
      // Don't fail the entire request if folder operations fail
      // The status update in overview is the most important part
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ukjent feil";
    console.error("Error updating status:", message);
    return NextResponse.json({ ok: false, message }, { status: 500 });
  }
}

function updateOverviewStatus(
  content: string,
  company: string,
  action: "mark-intervju" | "mark-ansatt" | "mark-avslått",
  intervjuNum?: number
): { content: string } | null {
  const lines = content.split(/\r?\n/);
  const startIdx = lines.findIndex((line) =>
    line.startsWith("## 🟢 Aktive Prosesser")
  );
  if (startIdx === -1) return null;

  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear().toString().slice(2)}`;

  for (let i = startIdx + 3; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("## ")) break;
    if (!line.trim().startsWith("|")) continue;

    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 21) continue;

    const rawCompany = parts[1] || "";
    const companyName = rawCompany.replace(/\*\*/g, "").trim();

    if (companyName.toLowerCase() !== company.toLowerCase()) continue;

    // Found the company row, update it
    if (action === "mark-intervju") {
      // Update status to include intervju emoji
      const currentStatus = parts[8] || "";
      if (!currentStatus.includes("Intervju")) {
        parts[8] = currentStatus.includes("✉️") 
          ? "✉️ Sendt · 🎯 Intervju" 
          : "🎯 Intervju";
      }

      // Set intervju date if intervjuNum is provided
      if (intervjuNum && intervjuNum >= 1 && intervjuNum <= 4) {
        const intervjuIndex = 15 + intervjuNum; // intervju1 = 16 (index 16), intervju2 = 17 (index 17), etc.
        if (parts.length > intervjuIndex) {
          if (parts[intervjuIndex] === "-" || parts[intervjuIndex] === "" || parts[intervjuIndex] === "–") {
            parts[intervjuIndex] = dateStr;
          }
        }
      }
    } else if (action === "mark-ansatt") {
      parts[8] = "✅ Ansatt";
      parts[20] = "nei"; // Tilbud = nei means ansatt
    } else if (action === "mark-avslått") {
      parts[8] = "❌ Avslått";
      parts[20] = "ja"; // Tilbud = ja means avslått
    }

    lines[i] = "|" + parts.slice(1).join(" | ") + "|";
    return { content: lines.join("\n") };
  }

  return null;
}

async function handleActionSpecificTasks(
  company: string,
  action: "mark-intervju" | "mark-ansatt" | "mark-avslått",
  intervjuNum?: number
) {
  const safeCompany = company.trim();
  
  if (action === "mark-intervju" && intervjuNum) {
    // Create empty Intervju-Note.md file if it doesn't exist
    const intervjuNotePath = path.join(BASE_DIR, safeCompany, `Intervju${intervjuNum}-Notat.md`);
    const intervjuNoteGitHub = `${GITHUB_BASE_PATH}/${safeCompany}/Intervju${intervjuNum}-Notat.md`;
    
    if (isVercel && isGitHubConfigured()) {
      try {
        // Check if file exists
        const existing = await readFileFromGitHub(intervjuNoteGitHub);
        if (!existing) {
          // Create empty file
          await writeFileToGitHub(
            intervjuNoteGitHub,
            `# Intervju ${intervjuNum} - ${safeCompany}\n\n`,
            `Opprett Intervju ${intervjuNum} notat for ${safeCompany}`
          );
        }
      } catch (error) {
        console.error("Error creating intervju note on GitHub:", error);
      }
    } else {
      // Local: create file if it doesn't exist
      const companyDir = path.join(BASE_DIR, safeCompany);
      if (fs.existsSync(companyDir) && !fs.existsSync(intervjuNotePath)) {
        fs.writeFileSync(intervjuNotePath, `# Intervju ${intervjuNum} - ${safeCompany}\n\n`, "utf8");
      }
    }
  } else if (action === "mark-ansatt") {
    // Create Ansatt-status.md file in company folder
    const ansattStatusPath = path.join(BASE_DIR, safeCompany, "Ansatt-status.md");
    const ansattStatusGitHub = `${GITHUB_BASE_PATH}/${safeCompany}/Ansatt-status.md`;
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, "0")}.${(today.getMonth() + 1).toString().padStart(2, "0")}.${today.getFullYear()}`;
    const ansattContent = `# Ansatt hos ${safeCompany}\n\n**Dato:** ${dateStr}\n\n🎉 Gratulerer med ny jobb!\n`;
    
    if (isVercel && isGitHubConfigured()) {
      try {
        await writeFileToGitHub(
          ansattStatusGitHub,
          ansattContent,
          `Markér ${safeCompany} som ansatt`
        );
      } catch (error) {
        console.error("Error creating ansatt status on GitHub:", error);
      }
    } else {
      // Local: create file
      const companyDir = path.join(BASE_DIR, safeCompany);
      if (fs.existsSync(companyDir)) {
        fs.writeFileSync(ansattStatusPath, ansattContent, "utf8");
      }
    }
  } else if (action === "mark-avslått") {
    // Move entire company folder to avslag folder
    const companySourceDir = path.join(BASE_DIR, safeCompany);
    const companyTargetDir = path.join(AVSLAG_DIR, safeCompany);
    
    try {
      if (isVercel && isGitHubConfigured()) {
        // For GitHub, we would need to use the GitHub API to move files
        // This is complex and might require listing all files and moving them
        // For now, we'll just log it - the status update in overview is the main thing
        console.log(`Would move ${safeCompany} to avslag on GitHub`);
      } else {
        // Local: move the folder
        if (!fs.existsSync(companySourceDir)) {
          console.error(`Source directory does not exist: ${companySourceDir}`);
          return;
        }
        
        // Ensure avslag directory exists
        if (!fs.existsSync(AVSLAG_DIR)) {
          fs.mkdirSync(AVSLAG_DIR, { recursive: true });
          console.log(`Created avslag directory: ${AVSLAG_DIR}`);
        }
        
        // Remove target if it exists
        if (fs.existsSync(companyTargetDir)) {
          fs.rmSync(companyTargetDir, { recursive: true, force: true });
          console.log(`Removed existing target directory: ${companyTargetDir}`);
        }
        
        // Move the folder
        fs.renameSync(companySourceDir, companyTargetDir);
        console.log(`Successfully moved ${companySourceDir} to ${companyTargetDir}`);
      }
    } catch (error) {
      console.error(`Error moving company folder to avslag:`, error);
      throw error; // Re-throw to be caught by the API handler
    }
  }
}

async function assignApplicationMetadata(
  company: string,
  user: ReturnType<typeof getAuthUser>
) {
  if (!user) return;

  // Application ID format in loadApplications:
  // - soknad-${companyFolder} for active applications
  // - avslag-${companyFolder} for rejected applications  
  // - plan-${companyName} for planned applications
  // We'll set metadata for all possible IDs for this company
  const safeCompany = company.trim().toLowerCase();
  
  // Get clientId if user is a client
  let clientId: string | undefined;
  if (user.role === "client" && user.email) {
    const clients = getClientsByOrganization(user.organizationId);
    const client = clients.find(c => c.email === user.email);
    clientId = client?.id;
  }

  // Set metadata for all possible application IDs for this company
  const possibleIds = [
    `soknad-${safeCompany}`,
    `avslag-${safeCompany}`,
    `plan-${safeCompany}`
  ];
  
  for (const applicationId of possibleIds) {
    setApplicationMetadata(applicationId, {
      clientId: clientId,
      organizationId: user.organizationId,
      userId: user.id
    });
  }
}

