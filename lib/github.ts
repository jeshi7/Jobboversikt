/**
 * GitHub API helper for reading and writing files to the repository.
 * Used when running on Vercel (read-only file system).
 */

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "jeshi7";
const GITHUB_REPO = process.env.GITHUB_REPO || "Jobboversikt";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";

interface GitHubFileResponse {
  content: string;
  sha: string;
  encoding: string;
}

interface GitHubError {
  message: string;
  status?: number;
}

/**
 * Check if GitHub API is configured
 */
export function isGitHubConfigured(): boolean {
  return !!GITHUB_TOKEN;
}

/**
 * Read a file from the GitHub repository
 */
export async function readFileFromGitHub(filePath: string): Promise<{ content: string; sha: string } | null> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return null; // File doesn't exist
    }

    if (!response.ok) {
      const error = (await response.json()) as GitHubError;
      throw new Error(`GitHub API error: ${error.message}`);
    }

    const data = (await response.json()) as GitHubFileResponse;
    const content = Buffer.from(data.content, "base64").toString("utf8");
    
    return { content, sha: data.sha };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Write a file to the GitHub repository
 */
export async function writeFileToGitHub(
  filePath: string,
  content: string,
  message: string,
  existingSha?: string
): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN is not configured");
  }

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;

  // If we don't have the SHA, try to get it first (needed for updates)
  let sha = existingSha;
  if (!sha) {
    const existing = await readFileFromGitHub(filePath);
    if (existing) {
      sha = existing.sha;
    }
  }

  const body: {
    message: string;
    content: string;
    branch: string;
    sha?: string;
  } = {
    message,
    content: Buffer.from(content).toString("base64"),
    branch: GITHUB_BRANCH,
  };

  if (sha) {
    body.sha = sha;
  }

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = (await response.json()) as GitHubError;
    throw new Error(`GitHub API error: ${error.message}`);
  }

  return true;
}

/**
 * Check if a file exists in the GitHub repository
 */
export async function fileExistsOnGitHub(filePath: string): Promise<boolean> {
  const file = await readFileFromGitHub(filePath);
  return file !== null;
}





