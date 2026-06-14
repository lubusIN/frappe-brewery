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
import os from "node:os";
import path from "node:path";
import { execSync } from "node:child_process";
import { parseFrappeDependencyVersions } from "./validate.js";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const SCHEMA_PATH = path.join(ROOT, "scripts", "app.schema.json");

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
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  const match = url.match(
    /^https?:\/\/github\.com\/([^/]+)\/([^/]+?)\/?$/
  );
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }
  let repo = match[2];
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);
  return { owner: match[1], repo };
}

export function toSlug(str: string): string {
  return str.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function githubFetch(endpoint: string): Promise<unknown> {
  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "Frappe-Brewery-Extractor"
  };
  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`https://api.github.com${endpoint}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub API error ${res.status}: ${endpoint}`);
  return res.json();
}

function getLocalFileContent(tmpDir: string, filePaths: string[]): string | null {
  for (const p of filePaths) {
    const fullPath = path.join(tmpDir, p);
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath, "utf8");
    }
  }
  return null;
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
  
  for (const topic of topics) {
    const match = topic.match(/^(?:frappe-v|v)(\d+)$/);
    if (match) {
      const v = match[1];
      if (SCHEMA_FRAPPE_VERSIONS.includes(v) && !versions.includes(v)) {
        versions.push(v);
      }
    }
  }

  // Default: all allowed versions if none detected from topics
  return versions.length > 0 ? versions : SCHEMA_FRAPPE_VERSIONS;
}

function detectLicense(spdxId: string | undefined): string {
  if (!spdxId || spdxId === "NOASSERTION") return "other";
  // Normalize GPL-3.0-only → GPL-3.0 etc.
  const normalized = spdxId.replace("-only", "").replace("-or-later", "");
  return SCHEMA_LICENSES.includes(normalized) ? normalized : "other";
}

async function getSupportedFrappeVersionsForBranch(owner: string, repo: string, branch: string, appName: string): Promise<string[]> {
  const versions = new Set<string>();
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/pyproject.toml`);
    if (res.ok) {
      const text = await res.text();
      const frappeMatch = text.match(/(?:^|\n)\s*frappe\s*=\s*['"]([^'"]+)['"]/);
      if (frappeMatch) {
         const supported = parseFrappeDependencyVersions(frappeMatch[1]);
         supported.forEach(v => versions.add(v));
      }
      const versionMatch = text.match(/version\s*=\s*['"](\d+)\./);
      if (versionMatch) versions.add(versionMatch[1]);
    }
  } catch {}

  if (versions.size === 0) {
    try {
      const res = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${appName}/__init__.py`);
      if (res.ok) {
        const text = await res.text();
        const match = text.match(/__version__\s*=\s*['"](\d+)\./);
        if (match) versions.add(match[1]);
      }
    } catch {}
  }
  return Array.from(versions);
}

async function detectInstallBranchesAsync(
  owner: string,
  repo: string,
  appName: string,
  initialFrappeVersions: string[], 
  branchNames: string[], 
  defaultBranch: string
): Promise<{ installBranches: Record<string, string>, validFrappeVersions: string[] }> {
  const branches: Record<string, string> = {};
  
  // 1. Filter and identify standard Frappe-compatible branch patterns
  const candidates = new Set<string>();
  
  // High Priority: Explicit version branches (e.g. version-14, v14)
  const exactBranches = branchNames.filter(b => /^(?:version-|v)(\d+)$/.test(b));
  exactBranches.forEach(b => candidates.add(b));
  
  // Medium Priority: Stable/Default branches
  if (branchNames.includes("main")) candidates.add("main");
  if (branchNames.includes("master")) candidates.add("master");
  
  // Low Priority: Future/Development branches
  if (branchNames.includes("develop")) candidates.add("develop");
  
  // Add repository default branch if it's not already in there
  if (branchNames.includes(defaultBranch)) candidates.add(defaultBranch);

  // 2. Map versions explicitly declared in these branches' pyproject.toml
  for (const branch of candidates) {
    const supported = await getSupportedFrappeVersionsForBranch(owner, repo, branch, appName);
    for (const v of supported) {
      if (SCHEMA_FRAPPE_VERSIONS.includes(v) && !branches[v]) {
        branches[v] = branch;
      }
    }
  }
  
  // 3. Guaranteed mapping for explicit version branches even if pyproject is missing
  for (const branch of exactBranches) {
    const match = branch.match(/^(?:version-|v)(\d+)$/);
    if (match) {
      const v = match[1];
      if (SCHEMA_FRAPPE_VERSIONS.includes(v) && !branches[v]) {
         branches[v] = branch;
      }
    }
  }

  // 4. Fallback for absolute minimum operation if NOTHING was found
  if (Object.keys(branches).length === 0) {
      const fallbackVersion = initialFrappeVersions.length > 0 
        ? initialFrappeVersions[initialFrappeVersions.length - 1] 
        : SCHEMA_FRAPPE_VERSIONS[SCHEMA_FRAPPE_VERSIONS.length - 1];
      branches[fallbackVersion] = defaultBranch;
  }
  
  return {
    installBranches: branches,
    validFrappeVersions: Object.keys(branches).sort()
  };
}

function detectMinFrappeVersion(frappeVersions: string[]): string {
  if (frappeVersions.length === 0) return "14.0.0";
  const minV = frappeVersions.map(v => parseInt(v)).sort((a, b) => a - b)[0];
  return `${minV}.0.0`;
}

function topicsToCategories(topics: string[]): string[] {
  const map: Record<string, string> = {
    crm: "Customer Relations",
    hr: "Human Resources",
    hrms: "Human Resources",
    payroll: "Human Resources",
    accounting: "Accounting",
    erpnext: "Accounting",
    manufacturing: "Business",
    pos: "Retail",
    healthcare: "Healthcare",
    education: "Business",
    lms: "Business",
    integration: "Integrations",
    payments: "Payments",
    payment: "Payments",
    reports: "Analytics",
    analytics: "Analytics",
    bi: "Analytics",
    "developer-tools": "Developer",
    developer: "Developer",
    ai: "AI",
    ecommerce: "E-Commerce",
    "e-commerce": "E-Commerce",
    utilities: "Utilities",
    utility: "Utility",
    theme: "Themes",
    website: "Website",
  };
  const found = new Set<string>();
  for (const topic of topics) {
    if (map[topic]) found.add(map[topic]);
  }
  return found.size > 0 ? Array.from(found) : ["Utilities"];
}

function detectIconUrl(owner: string, repo: string, defaultBranch: string, appName: string, tmpDir: string): string | null {
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
    if (fs.existsSync(path.join(tmpDir, item))) {
      return `https://raw.githubusercontent.com/${owner}/${repo}/refs/heads/${defaultBranch}/${item}`;
    }
  }
  return null;
}

// ──────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────
export async function extractApp(repoUrl: string, writeToFile: boolean = true) {
  if (!repoUrl) {
    throw new Error("Repository URL is required");
  }

  console.log(`\n🔍 Extracting metadata from ${repoUrl}…\n`);

  const { owner, repo } = parseRepoUrl(repoUrl);

  // Fetch repo info
  const repoData = (await githubFetch(`/repos/${owner}/${repo}`)) as GitHubRepo | null;
  if (!repoData) {
    throw new Error(`Repository not found: ${repoUrl}`);
  }

  const defaultBranch = repoData.default_branch;

  // Clone repository locally to temp dir
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "frappe-brewery-"));
  console.log(`📥 Cloning repository to temp directory...`);
  try {
    execSync(`git clone --depth 1 https://github.com/${owner}/${repo}.git ${tmpDir}`, { stdio: "ignore" });
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Failed to clone repository`);
  }

  try {
    // Fetch latest release
    const releases = (await githubFetch(
      `/repos/${owner}/${repo}/releases?per_page=1`
    )) as GitHubRelease[] | null;
    const latestRelease = releases?.[0] ?? null;

    // Fetch branches using git ls-remote
    let branchNames: string[] = [];
    try {
       const output = execSync(`git ls-remote --heads https://github.com/${owner}/${repo}.git`, { stdio: "pipe" }).toString();
       branchNames = output.split("\n")
            .filter(line => line.includes("refs/heads/"))
            .map(line => line.split("refs/heads/")[1].trim());
    } catch {}

    const appName = repo.replace(/-/g, "_");

    // Extract files locally
    const hooksContent = getLocalFileContent(tmpDir, [`${appName}/hooks.py`, "hooks.py"]) ?? "";

    // Derive fields
    const slug = toSlug(appName);
    const title = extractAppTitle(hooksContent)
      ?? repoData.name.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    const description = repoData.description ?? `A Frappe app from ${owner}/${repo}`;
    const license = detectLicense(repoData.license?.spdx_id);
    let frappeVersions = detectFrappeVersions(repoData.topics);
    const { installBranches, validFrappeVersions } = await detectInstallBranchesAsync(owner, repo, appName, frappeVersions, branchNames, defaultBranch);
    frappeVersions = validFrappeVersions;
    const minFrappeVersion = detectMinFrappeVersion(frappeVersions);
    const requiredApps = hooksContent ? extractRequiredApps(hooksContent) : ["frappe"];
    const categories = topicsToCategories(repoData.topics);
    const tags = repoData.topics.filter(t => !["frappe", "erpnext", "python"].includes(t));
    const iconUrl = detectIconUrl(owner, repo, defaultBranch, appName, tmpDir);

    const outputPath = path.join(APPS_DIR, `${slug}.json`);

    if (writeToFile && fs.existsSync(outputPath)) {
      console.warn(`⚠️  ${slug}.json already exists — NOT overwriting.`);
      console.warn(`   Edit manually or delete ${outputPath} first.`);
      return JSON.parse(fs.readFileSync(outputPath, "utf8"));
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
      min_frappe_version: minFrappeVersion,
      install_branches: installBranches,
      required_apps: requiredApps,
      categories,
      tags,
      install_commands: [
        `bench get-app ${owner === "frappe" ? repo : repoUrl}`,
        `bench --site [site-name] install-app ${appName}`,
        `bench --site [site-name] migrate`,
        `bench restart`
      ],
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

    if (writeToFile) {
      fs.writeFileSync(outputPath, `${JSON.stringify(app, null, 2)}\n`);

      console.log(`✅ Written: apps/${slug}.json`);
      console.log(`\n📝 Please review and fill in:`);
      console.log(`   • description (currently auto-extracted)`);
      console.log(`   • frappe_versions (if topics didn't include them)`);
      console.log(`   • categories (may need adjustment)`);
      console.log(`   • media.icon and media.screenshots`);
      console.log(`   • links.docs`);
      console.log(`\nThen run: npm run brewery:validate`);

      if (latestRelease) {
        console.log(`\n📦 Latest release: ${latestRelease.tag_name} (${latestRelease.published_at.slice(0, 10)})`);
      }
    }

    return app;
  } finally {
    // Clean up temporary directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

import { fileURLToPath } from 'url';

export async function main() {
  const repoUrl = process.argv[2];
  if (!repoUrl) {
    console.error("Usage: npm run brewery:extract https://github.com/owner/repo");
    process.exit(1);
  }
  await extractApp(repoUrl, true);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error("❌", err.message);
    process.exit(1);
  });
}

