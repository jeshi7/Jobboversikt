import fs from "node:fs";
import path from "node:path";

interface FolderSetupOptions {
  organizationId: string;
  clientId: string;
  companyName: string;
  jobListingText: string;
  autoGenerateCV?: boolean;
  autoGenerateCoverLetter?: boolean;
}

/**
 * Agent for å automatisk opprette mapper og filer ved nye utlysninger
 */
export function setupCompanyFolder(options: FolderSetupOptions): {
  folderPath: string;
  filesCreated: string[];
} {
  const basePath = path.join(
    process.cwd(),
    "Jobb_Søknad_Pakke",
    "02_Søknader",
    "Alle selskaper",
    options.companyName
  );
  
  // Create folder if it doesn't exist
  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
  }
  
  const filesCreated: string[] = [];
  
  // Create Utlysning.md with job listing
  const utlysningPath = path.join(basePath, "Utlysning.md");
  if (!fs.existsSync(utlysningPath)) {
    fs.writeFileSync(utlysningPath, options.jobListingText, "utf8");
    filesCreated.push("Utlysning.md");
  }
  
  // Optionally create CV-profile.md placeholder
  if (options.autoGenerateCV) {
    const cvProfilePath = path.join(basePath, "CV-profile.md");
    if (!fs.existsSync(cvProfilePath)) {
      fs.writeFileSync(
        cvProfilePath,
        `# CV-profil for ${options.companyName}\n\n*Denne filen vil bli generert automatisk basert på kompetansebank.*\n`,
        "utf8"
      );
      filesCreated.push("CV-profile.md");
    }
  }
  
  // Optionally create Søknadsbrev.md placeholder
  if (options.autoGenerateCoverLetter) {
    const søknadsbrevPath = path.join(basePath, "Søknadsbrev.md");
    if (!fs.existsSync(søknadsbrevPath)) {
      fs.writeFileSync(
        søknadsbrevPath,
        `# Søknadsbrev - ${options.companyName}\n\n*Dette søknadsbrevet vil bli generert automatisk basert på kompetansebank og utlysning.*\n`,
        "utf8"
      );
      filesCreated.push("Søknadsbrev.md");
    }
  }
  
  return {
    folderPath: basePath,
    filesCreated
  };
}







