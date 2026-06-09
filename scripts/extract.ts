/**
 * scripts/extract.ts
 *
 * Auto-extraction helper: given a GitHub repo URL, fetches metadata from the
 * GitHub API and writes a draft app JSON to apps/<slug>.json.
 *
 * Usage:
 *   npm run extract https://github.com/frappe/frappe_crm
 *
 * Requires:
 *   GITHUB_TOKEN env var (optional, but strongly recommended to avoid rate limits)
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const SCHEMA_PATH = path.join(ROOT, "schema", "app.schema.json");

const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
const SCHEMA_LICENSES = schema.properties.license.enum as string[];
const SCHEMA_FRAPPE_VERSIONS = schema.properties.frappe_versions.items.enum as string[];

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface GitHubRepo {
  name: string;
  description: string | null;
  topics: string[];
  license: { spdx_id: string } | null;
  default_branch: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
}

interface GitHubRelease {
  tag_name: string;
  published_at: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/
  );
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  return { owner: match[1], repo: match[2] };
}

function toSlug(str: string): string {
  return str.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
}

async function githubFetch(endpoint: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${endpoint}`);
  return res.json();
}

async function fetchFileContent(
  owner: string,
  repo: string,
  filePath: string
): Promise<string | null> {
  try {
    const data = (await githubFetch(
      `/repos/${owner}/${repo}/contents/${filePath}`
    )) as { content?: string } | null;
    if (!data?.content) return null;
    return Buffer.from(data.content, "base64").toString("utf8");
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────
// Extract app metadata from pyproject.toml / hooks.py / setup.py
// ──────────────────────────────────────────────
function extractAppTitle(content: string): string | null {
  // hooks.py: app_title = "My App"
  const hookMatch = content.match(/app_title\s*=\s*["'](.+?)["']/);
  if (hookMatch) return hookMatch[1];
  // pyproject.toml: name = "my_app"  (fallback)
  return null;
}

function extractRequiredApps(hooksContent: string): string[] {
  const deps: string[] = ["frappe"];
  const match = hooksContent.match(/required_apps\s*=\s*\[([^\]]+)\]/);
  if (match) {
    const items = match[1]
      .split(",")
      .map((s) => s.trim().replace(/["']/g, ""))
      .filter(Boolean);
    for (const item of items) {
      if (!deps.includes(item)) deps.push(item);
    }
  }
  return deps;
}

function detectFrappeVersions(topics: string[]): string[] {
  const versions: string[] = [];
  const versionMap: Record<string, string> = {
    "frappe-v14": "14",
    "frappe-v15": "15",
    "frappe-v16": "16",
    "v14": "14",
    "v15": "15",
    "v16": "16",
  };
  for (const topic of topics) {
    if (versionMap[topic]) {
      versions.push(versionMap[topic]);
    }
  }
  // Default: all versions if none detected
  return versions.length > 0 ? versions : SCHEMA_FRAPPE_VERSIONS;
}

function detectLicense(spdxId: string | undefined): string {
  if (!spdxId || spdxId === "NOASSERTION") return "other";
  // Normalize GPL-3.0-only → GPL-3.0 etc.
  const normalized = spdxId.replace("-only", "").replace("-or-later", "");
  return SCHEMA_LICENSES.includes(normalized) ? normalized : "other";
}

function topicsToCategories(topics: string[]): string[] {
  const map: Record<string, string> = {
    crm: "CRM",
    hr: "HR",
    hrms: "HR",
    payroll: "HR",
    accounting: "Accounting",
    erpnext: "Accounting",
    manufacturing: "Manufacturing",
    pos: "POS",
    healthcare: "Healthcare",
    education: "Education",
    lms: "Education",
    integration: "Integration",
    payments: "Payments",
    payment: "Payments",
    reports: "Reports",
    analytics: "Reports",
    bi: "Reports",
    "developer-tools": "Developer Tools",
    ai: "AI",
    utilities: "Utilities",
    utility: "Utilities",
  };
  const found = new Set<string>();
  for (const topic of topics) {
    if (map[topic]) found.add(map[topic]);
  }
  return found.size > 0 ? Array.from(found) : ["Utilities"];
}

async function detectIconUrl(owner: string, repo: string, branch: string, appName: string): Promise<string | null> {
  const candidates = [
    `${appName}/public/images/${appName}-logo.svg`,
    `${appName}/public/images/${appName}-logo.png`,
    `${appName}/public/images/frappe-${appName}-logo.svg`,
    `${appName}/public/images/frappe-${appName}-logo.png`,
    `${appName}/public/images/logo.svg`,
    `${appName}/public/images/logo.png`,
    `frontend/src/assets/${appName}-icon.svg`,
    `frontend/src/assets/${appName}-logo.svg`,
    `frontend/public/favicon.png`,
    `frontend/public/favicon.svg`,
    `desk/public/favicon.svg`,
    `desk/public/logo.svg`,
    `public/favicon.svg`,
    `public/logo.svg`
  ];

  for (const item of candidates) {
    const url = `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${branch}/${item}`;
    try {
      const res = await fetch(url, { method: "HEAD" });
      if (res.ok) {
        return url;
      }
    } catch {
      // ignore network errors and try next
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
async function main() {
  const repoUrl = process.argv[2];
  if (!repoUrl) {
    console.error("Usage: npm run extract https://github.com/owner/repo");
    process.exit(1);
  }

  console.log(`\n🔍 Extracting metadata from ${repoUrl}…\n`);

  const { owner, repo } = parseRepoUrl(repoUrl);

  // Fetch repo info
  const repoData = (await githubFetch(`/repos/${owner}/${repo}`)) as GitHubRepo | null;
  if (!repoData) {
    console.error(`❌ Repository not found: ${repoUrl}`);
    process.exit(1);
  }

  // Fetch latest release
  const releases = (await githubFetch(
    `/repos/${owner}/${repo}/releases?per_page=1`
  )) as GitHubRelease[] | null;
  const latestRelease = releases?.[0] ?? null;

  // Try to fetch hooks.py, pyproject.toml, setup.py
  const hooksContent = await fetchFileContent(owner, repo, `${repo.replace(/-/g, "_")}/hooks.py`)
    ?? await fetchFileContent(owner, repo, `hooks.py`)
    ?? "";

  const pyprojectContent = await fetchFileContent(owner, repo, "pyproject.toml") ?? "";

  // Derive fields
  const appName = repo.replace(/-/g, "_");
  const slug = toSlug(appName);
  const title = extractAppTitle(hooksContent)
    ?? repoData.name.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const description = repoData.description ?? `A Frappe app from ${owner}/${repo}`;
  const license = detectLicense(repoData.license?.spdx_id);
  const frappeVersions = detectFrappeVersions(repoData.topics);
  const requiredApps = hooksContent ? extractRequiredApps(hooksContent) : ["frappe"];
  const categories = topicsToCategories(repoData.topics);
  const tags = repoData.topics.filter(t => !["frappe", "erpnext", "python"].includes(t));
  const iconUrl = await detectIconUrl(owner, repo, repoData.default_branch, appName);

  const outputPath = path.join(APPS_DIR, `${slug}.json`);

  if (fs.existsSync(outputPath)) {
    console.warn(`⚠️  ${slug}.json already exists — NOT overwriting.`);
    console.warn(`   Edit manually or delete ${outputPath} first.`);
    process.exit(0);
  }

  const today = new Date().toISOString().slice(0, 10);

  const app = {
    slug,
    name: appName,
    title,
    description: description.slice(0, 500),
    repository: `https://github.com/${owner}/${repo}`,
    license,
    frappe_versions: frappeVersions,
    required_apps: requiredApps,
    categories,
    tags,
    install: {
      method: "bench",
      command: `bench get-app ${repoUrl}`,
      app_name: appName,
    },
    links: {
      ...(repoData.homepage ? { website: repoData.homepage } : {}),
    },
    media: {
      icon: iconUrl || "",
      screenshots: [],
    },
    meta: {
      source: "extracted",
      verified: false,
      status: "active",
      added_at: today,
    },
  };

  fs.writeFileSync(outputPath, `${JSON.stringify(app, null, 2)}\n`);

  console.log(`✅ Written: apps/${slug}.json`);
  console.log(`\n📝 Please review and fill in:`);
  console.log(`   • description (currently auto-extracted)`);
  console.log(`   • frappe_versions (if topics didn't include them)`);
  console.log(`   • categories (may need adjustment)`);
  console.log(`   • media.icon and media.screenshots`);
  console.log(`   • links.docs`);
  console.log(`\nThen run: npm run validate`);

  if (latestRelease) {
    console.log(`\n📦 Latest release: ${latestRelease.tag_name} (${latestRelease.published_at.slice(0, 10)})`);
  }
}

main().catch(err => {
  console.error("❌", err.message);
  process.exit(1);
});
