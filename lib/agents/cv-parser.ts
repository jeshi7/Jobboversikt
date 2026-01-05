import fs from "node:fs";
import path from "node:path";
import type { CompetenceBank } from "../db";

/**
 * Agent for å parse CV og ekstrahere kompetanse
 * Dette er en intelligent parser som leser CV-filer og bygger kompetansebank
 */
export async function parseCVFromFile(cvPath: string): Promise<Partial<CompetenceBank>> {
  const content = fs.readFileSync(cvPath, "utf8");
  return parseCVFromText(content);
}

export function parseCVFromText(cvText: string): Partial<CompetenceBank> {
  // Parse CV-tekst og ekstraher kompetanse
  const lines = cvText.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  
  const skills: string[] = [];
  const experiences: CompetenceBank["experiences"] = [];
  const education: CompetenceBank["education"] = [];
  const languages: CompetenceBank["languages"] = [];
  
  let currentSection: "experience" | "education" | "skills" | "languages" | null = null;
  let currentExperience: CompetenceBank["experiences"][0] | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Detect sections
    if (line.includes("erfaring") || line.includes("arbeidserfaring") || line.includes("yrkeserfaring")) {
      currentSection = "experience";
      continue;
    }
    if (line.includes("utdanning") || line.includes("utdannelse")) {
      currentSection = "education";
      continue;
    }
    if (line.includes("kompetanse") || line.includes("ferdigheter") || line.includes("skills")) {
      currentSection = "skills";
      continue;
    }
    if (line.includes("språk") || line.includes("languages")) {
      currentSection = "languages";
      continue;
    }
    
    // Parse experience
    if (currentSection === "experience") {
      // Look for company/role patterns
      const companyMatch = lines[i].match(/^(.+?)\s*[-|–]\s*(.+?)$/);
      if (companyMatch) {
        if (currentExperience) {
          experiences.push(currentExperience);
        }
        currentExperience = {
          company: companyMatch[1].trim(),
          role: companyMatch[2].trim(),
          period: "",
          description: "",
          achievements: []
        };
        continue;
      }
      
      // Look for period
      const periodMatch = lines[i].match(/(\d{4}|\d{2}\.\d{2}\.\d{4}).*?(\d{4}|\d{2}\.\d{2}\.\d{4}|nå|present|current)/i);
      if (periodMatch && currentExperience) {
        currentExperience.period = lines[i];
        continue;
      }
      
      // Collect description
      if (currentExperience && lines[i].length > 10 && !lines[i].match(/^\d/)) {
        if (!currentExperience.description) {
          currentExperience.description = lines[i];
        } else {
          currentExperience.achievements.push(lines[i]);
        }
      }
    }
    
    // Parse education
    if (currentSection === "education") {
      const eduMatch = lines[i].match(/^(.+?)\s*[-|–]\s*(.+?)$/);
      if (eduMatch) {
        education.push({
          institution: eduMatch[1].trim(),
          degree: eduMatch[2].trim(),
          period: ""
        });
      }
      const periodMatch = lines[i].match(/(\d{4}).*?(\d{4}|nå)/i);
      if (periodMatch && education.length > 0) {
        education[education.length - 1].period = lines[i];
      }
    }
    
    // Parse skills
    if (currentSection === "skills") {
      // Common skill keywords
      const skillKeywords = [
        "figma", "adobe", "photoshop", "illustrator", "indesign", "premiere", "after effects",
        "wordpress", "webflow", "html", "css", "javascript", "typescript", "react", "next.js",
        "ux", "ui", "design", "prototyping", "wireframing", "user research", "usability",
        "marketing", "branding", "content", "copywriting", "seo", "crm", "analytics",
        "project management", "agile", "scrum", "kanban", "customer service", "sales"
      ];
      
      const lowerLine = lines[i].toLowerCase();
      for (const keyword of skillKeywords) {
        if (lowerLine.includes(keyword) && !skills.includes(keyword)) {
          skills.push(keyword);
        }
      }
      
      // Also extract from bullet points or comma-separated lists
      if (lines[i].includes(",") || lines[i].includes("•") || lines[i].includes("-")) {
        const items = lines[i].split(/[,•\-]/).map(s => s.trim()).filter(s => s.length > 2);
        skills.push(...items);
      }
    }
    
    // Parse languages
    if (currentSection === "languages") {
      const langMatch = lines[i].match(/^(.+?)\s*[-|–|:]\s*(.+)$/i);
      if (langMatch) {
        languages.push({
          language: langMatch[1].trim(),
          level: langMatch[2].trim()
        });
      }
    }
  }
  
  if (currentExperience) {
    experiences.push(currentExperience);
  }
  
  return {
    skills: [...new Set(skills)], // Remove duplicates
    experiences,
    education,
    languages
  };
}







