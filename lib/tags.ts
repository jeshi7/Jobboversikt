import fs from "node:fs";
import path from "node:path";

const TAGS_FILE = path.join(
  process.cwd(),
  "Jobb_Søknad_Pakke",
  "00_Oversikt",
  "tags.json"
);

export interface CompanyTags {
  [company: string]: string[];
}

export function loadTags(): CompanyTags {
  if (!fs.existsSync(TAGS_FILE)) {
    return {};
  }

  try {
    const content = fs.readFileSync(TAGS_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export function saveTags(tags: CompanyTags): void {
  const dir = path.dirname(TAGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tags, null, 2), "utf8");
}

export function addTagToCompany(company: string, tag: string): void {
  const tags = loadTags();
  if (!tags[company]) {
    tags[company] = [];
  }
  if (!tags[company].includes(tag)) {
    tags[company].push(tag);
  }
  saveTags(tags);
}

export function removeTagFromCompany(company: string, tag: string): void {
  const tags = loadTags();
  if (tags[company]) {
    tags[company] = tags[company].filter((t) => t !== tag);
    if (tags[company].length === 0) {
      delete tags[company];
    }
    saveTags(tags);
  }
}







