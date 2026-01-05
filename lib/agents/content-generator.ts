import type { CompetenceBank } from "../db";

interface JobListing {
  title: string;
  company: string;
  description: string;
  requirements: string[];
  location?: string;
}

/**
 * Agent for å generere CV-profil og søknadsbrev basert på kompetansebank og utlysning
 */
export function generateCVProfile(
  competenceBank: CompetenceBank,
  jobListing: JobListing
): string {
  const relevantSkills = competenceBank.skills.filter(skill => {
    const lowerDesc = jobListing.description.toLowerCase();
    return lowerDesc.includes(skill.toLowerCase()) || 
           jobListing.requirements.some(req => req.toLowerCase().includes(skill.toLowerCase()));
  });
  
  const relevantExperiences = competenceBank.experiences.filter(exp => {
    const combined = `${exp.company} ${exp.role} ${exp.description}`.toLowerCase();
    const lowerDesc = jobListing.description.toLowerCase();
    return jobListing.requirements.some(req => 
      combined.includes(req.toLowerCase()) || lowerDesc.includes(exp.role.toLowerCase())
    );
  });
  
  let profile = `# CV-profil for ${jobListing.company}\n\n`;
  profile += `## Relevante kompetanser\n\n`;
  
  if (relevantSkills.length > 0) {
    profile += relevantSkills.slice(0, 8).join(", ");
    profile += "\n\n";
  }
  
  if (relevantExperiences.length > 0) {
    profile += `## Viktigste erfaringer\n\n`;
    relevantExperiences.slice(0, 3).forEach(exp => {
      profile += `**${exp.role} hos ${exp.company}**\n`;
      if (exp.description) {
        profile += `${exp.description}\n\n`;
      }
      if (exp.achievements.length > 0) {
        exp.achievements.slice(0, 2).forEach(ach => {
          profile += `- ${ach}\n`;
        });
        profile += "\n";
      }
    });
  }
  
  return profile.trim();
}

export function generateCoverLetter(
  competenceBank: CompetenceBank,
  jobListing: JobListing,
  clientName: string
): string {
  const relevantSkills = competenceBank.skills.filter(skill => {
    const lowerDesc = jobListing.description.toLowerCase();
    return lowerDesc.includes(skill.toLowerCase());
  });
  
  const mostRelevantExperience = competenceBank.experiences
    .filter(exp => {
      const combined = `${exp.role} ${exp.description}`.toLowerCase();
      return jobListing.requirements.some(req => 
        combined.includes(req.toLowerCase())
      );
    })
    .sort((a, b) => b.achievements.length - a.achievements.length)[0];
  
  let letter = `# Søknadsbrev - ${jobListing.company}\n\n`;
  letter += `Kjære ${jobListing.company},\n\n`;
  letter += `Jeg søker stillingen som ${jobListing.title} hos dere. `;
  
  if (mostRelevantExperience) {
    letter += `Med min bakgrunn som ${mostRelevantExperience.role} hos ${mostRelevantExperience.company}, `;
    letter += `har jeg erfaring med `;
    
    // Extract key phrases from experience that match job requirements
    const matchingPhrases: string[] = [];
    jobListing.requirements.forEach(req => {
      if (mostRelevantExperience.description.toLowerCase().includes(req.toLowerCase())) {
        matchingPhrases.push(req);
      }
    });
    
    if (matchingPhrases.length > 0) {
      letter += matchingPhrases.slice(0, 2).join(" og ");
    } else {
      letter += "relevante oppgaver";
    }
    letter += ".\n\n";
  }
  
  letter += `## Hvorfor jeg passer\n\n`;
  
  if (relevantSkills.length > 0) {
    letter += `Jeg har kompetanse innen `;
    letter += relevantSkills.slice(0, 4).join(", ");
    letter += ", som er viktig for stillingen.\n\n";
  }
  
  if (mostRelevantExperience && mostRelevantExperience.achievements.length > 0) {
    letter += `I min tid som ${mostRelevantExperience.role} oppnådde jeg:\n\n`;
    mostRelevantExperience.achievements.slice(0, 3).forEach(ach => {
      letter += `- ${ach}\n`;
    });
    letter += "\n";
  }
  
  letter += `## Min tilnærming\n\n`;
  letter += `Jeg tror på en praktisk tilnærming der jeg fokuserer på å levere verdi. `;
  letter += `Min erfaring viser at god kommunikasjon og forståelse for brukerens behov er nøkkelen til gode resultater.\n\n`;
  
  letter += `Jeg ser frem til å høre fra dere.\n\n`;
  letter += `Med vennlig hilsen,\n${clientName}\n`;
  
  return letter.trim();
}

export function extractJobListingFromText(text: string): Partial<JobListing> {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  
  let title = "";
  let company = "";
  const description: string[] = [];
  const requirements: string[] = [];
  let location = "";
  
  let inDescription = false;
  let inRequirements = false;
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Extract title (usually first heading or line with "Stilling" or "Stillingstittel")
    if (!title && (lower.includes("stilling") || lower.match(/^#\s*(.+)$/))) {
      title = line.replace(/^#+\s*/, "").replace(/.*stilling[:\s]+/i, "").trim();
      if (title.length < 5) title = "";
    }
    
    // Extract company
    if (!company && (lower.includes("bedrift") || lower.includes("selskap") || lower.includes("virksomhet"))) {
      const match = line.match(/(?:bedrift|selskap|virksomhet)[:\s]+(.+)/i);
      if (match) company = match[1].trim();
    }
    
    // Extract location
    if (lower.includes("sted") || lower.includes("lokasjon")) {
      const match = line.match(/(?:sted|lokasjon)[:\s]+(.+)/i);
      if (match) location = match[1].trim();
    }
    
    // Detect sections
    if (lower.includes("om stillingen") || lower.includes("beskrivelse")) {
      inDescription = true;
      inRequirements = false;
      continue;
    }
    
    if (lower.includes("krav") || lower.includes("kompetanse") || lower.includes("kvalifikasjoner")) {
      inRequirements = true;
      inDescription = false;
      continue;
    }
    
    // Collect content
    if (inDescription && line.length > 10) {
      description.push(line);
    }
    
    if (inRequirements && (line.startsWith("-") || line.startsWith("•") || line.match(/^\d+\./))) {
      requirements.push(line.replace(/^[-•\d.\s]+/, "").trim());
    }
  }
  
  return {
    title: title || "",
    company: company || "",
    description: description.join("\n"),
    requirements,
    location: location || undefined
  };
}







