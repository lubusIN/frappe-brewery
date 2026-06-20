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
import { execFileSync } from "node:child_process";
import {
  type BranchCompatibility,
  extractCiFrappeVersions,
  extractDependencyFrappeVersions,
  getFrappeVersionFromBranchName,
  selectInstallBranches,
} from "./frappe-compat.js";
import { getAllowedFrappeVersions, getAllowedLicenses } from "./schema.js";
import { getRemoteBranches } from "./git.js";
import { githubFetch } from "./github.js";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");

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

interface GitHubTree {
  tree: Array<{
    path: string;
    type: "blob" | "tree";
    size?: number;
  }>;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
export function parseRepoUrl(url: string): { owner: string; repo: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  let repo = parts[1] ?? "";
  if (repo.endsWith(".git")) repo = repo.slice(0, -4);

  const owner = parts[0] ?? "";
  const validOwner = /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner);
  const validRepo = /^[a-z\d._-]+$/i.test(repo);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.hostname.toLowerCase() !== "github.com" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash ||
    parts.length !== 2 ||
    !validOwner ||
    !validRepo
  ) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  return { owner, repo };
}

export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function getLocalFileContent(
  tmpDir: string,
  filePaths: string[],
): string | null {
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
      if (getAllowedFrappeVersions().includes(v) && !versions.includes(v)) {
        versions.push(v);
      }
    }
  }

  return versions;
}

function detectLicense(spdxId: string | undefined): string {
  if (!spdxId || spdxId === "NOASSERTION") return "other";
  // Normalize GPL-3.0-only → GPL-3.0 etc.
  const normalized = spdxId.replace("-only", "").replace("-or-later", "");
  return getAllowedLicenses().includes(normalized) ? normalized : "other";
}

export async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`,
    );
    return res.ok ? res.text() : null;
  } catch {
    return null;
  }
}

export async function inspectBranchCompatibility(
  owner: string,
  repo: string,
  branch: string,
  allowedVersions: string[],
): Promise<BranchCompatibility[]> {
  const evidence: BranchCompatibility[] = [];
  const namedVersion = getFrappeVersionFromBranchName(branch, allowedVersions);
  if (namedVersion) {
    evidence.push({
      branch,
      versions: [namedVersion],
      source: "branch-name",
      score: 100,
    });
  }

  const pyproject = await fetchRawFile(owner, repo, branch, "pyproject.toml");
  const dependencyVersions = pyproject
    ? extractDependencyFrappeVersions(pyproject, allowedVersions)
    : [];
  if (dependencyVersions.length > 0) {
    evidence.push({
      branch,
      versions: dependencyVersions,
      source: "dependency",
      score: 80,
    });
  }

  // CI is the best available signal for apps that do not declare Frappe as a
  // package dependency. Inspect only .github text files to keep API use bounded.
  if (dependencyVersions.length === 0 && !namedVersion) {
    let tree: GitHubTree | null = null;
    try {
      tree = (await githubFetch(
        `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
      )) as GitHubTree | null;
    } catch (err: any) {
      console.warn(
        `⚠️  Failed to fetch git tree for ${owner}/${repo}@${branch}: ${err.message}`,
      );
    }

    const ciPaths = (tree?.tree ?? [])
      .filter(
        (item) =>
          item.type === "blob" &&
          item.path.startsWith(".github/") &&
          /\.(?:ya?ml|sh)$/i.test(item.path) &&
          (item.size ?? 0) <= 200_000,
      )
      .slice(0, 30)
      .map((item) => item.path);

    const ciContents = await Promise.all(
      ciPaths.map((filePath) => fetchRawFile(owner, repo, branch, filePath)),
    );
    const ciVersions = new Set<string>();
    for (const content of ciContents) {
      if (!content) continue;
      for (const version of extractCiFrappeVersions(content, allowedVersions)) {
        ciVersions.add(version);
      }
    }
    if (ciVersions.size > 0) {
      evidence.push({
        branch,
        versions: [...ciVersions],
        source: "ci",
        score: 60,
      });
    }
  }

  return evidence;
}

async function detectInstallBranchesAsync(
  owner: string,
  repo: string,
  topicVersions: string[],
  branchNames: string[],
  defaultBranch: string,
): Promise<{
  installBranches: Record<string, string>;
  validFrappeVersions: string[];
  warnings: string[];
}> {
  const candidates = new Set(
    branchNames.filter(
      (branch) =>
        branch === defaultBranch ||
        ["main", "master", "develop"].includes(branch) ||
        /^(?:version-|v)\d+$/i.test(branch) ||
        /^(?:frappe-v?|version-)\d+$/i.test(branch),
    ),
  );
  candidates.add(defaultBranch);

  const evidence = (
    await Promise.all(
      [...candidates].map((branch) =>
        inspectBranchCompatibility(
          owner,
          repo,
          branch,
          getAllowedFrappeVersions(),
        ),
      ),
    )
  ).flat();
  const warnings: string[] = [];
  let installBranches = selectInstallBranches(
    evidence,
    getAllowedFrappeVersions(),
    defaultBranch,
  );

  if (Object.keys(installBranches).length === 0 && topicVersions.length > 0) {
    const topicEvidence: BranchCompatibility[] = [
      {
        branch: defaultBranch,
        versions: topicVersions,
        source: "topic",
        score: 20,
      },
    ];
    installBranches = selectInstallBranches(
      topicEvidence,
      getAllowedFrappeVersions(),
      defaultBranch,
    );
    warnings.push(
      "Compatibility came only from GitHub topics; review install_branches.",
    );
  }

  if (Object.keys(installBranches).length === 0) {
    const latestVersion = getAllowedFrappeVersions().at(-1)!;
    installBranches = { [latestVersion]: defaultBranch };
    warnings.push(
      `No Frappe compatibility declaration was found; ${defaultBranch} was tentatively mapped to Frappe ${latestVersion}.`,
    );
  }

  return {
    installBranches,
    validFrappeVersions: getAllowedFrappeVersions().filter(
      (version) => installBranches[version],
    ),
    warnings,
  };
}

function detectMinFrappeVersion(frappeVersions: string[]): string {
  if (frappeVersions.length === 0) return "14.0.0";
  const minV = frappeVersions.map((v) => parseInt(v)).sort((a, b) => a - b)[0];
  return `${minV}.0.0`;
}

function topicsToCategories(topics: string[]): string[] {
  // Values MUST match the allowed categories in app.schema.json
  const map: Record<string, string> = {
    crm: "CRM & Support",
    support: "CRM & Support",
    helpdesk: "CRM & Support",
    hr: "Human Resources",
    hrms: "Human Resources",
    payroll: "Human Resources",
    accounting: "Accounting & Finance",
    finance: "Accounting & Finance",
    erpnext: "Business & Operations",
    manufacturing: "Business & Operations",
    operations: "Business & Operations",
    pos: "E-Commerce & Retail",
    retail: "E-Commerce & Retail",
    healthcare: "Industry Specific",
    education: "Industry Specific",
    lms: "Industry Specific",
    integration: "Utilities",
    payments: "Accounting & Finance",
    payment: "Accounting & Finance",
    reports: "Analytics & AI",
    analytics: "Analytics & AI",
    bi: "Analytics & AI",
    ai: "Analytics & AI",
    "developer-tools": "Developer Tools",
    developer: "Developer Tools",
    ecommerce: "E-Commerce & Retail",
    "e-commerce": "E-Commerce & Retail",
    utilities: "Utilities",
    utility: "Utilities",
    theme: "Website & Themes",
    website: "Website & Themes",
    marketing: "Marketing",
    mobile: "Mobile",
  };
  const found = new Set<string>();
  for (const topic of topics) {
    if (map[topic]) found.add(map[topic]);
  }
  return found.size > 0 ? Array.from(found) : ["Utilities"];
}

function detectIconUrl(
  owner: string,
  repo: string,
  defaultBranch: string,
  appName: string,
  tmpDir: string,
): string | null {
  const candidates = [
    `${appName}/public/images/${appName}-logo.svg`,
    `${appName}/public/images/${appName}-logo.png`,
    `${appName}/public/images/${appName}_logo.svg`,
    `${appName}/public/images/${appName}_logo.png`,
    `${appName}/public/images/${appName}-icon.svg`,
    `${appName}/public/images/${appName}-icon.png`,
    `${appName}/public/images/${appName}_icon.svg`,
    `${appName}/public/images/${appName}_icon.png`,
    `${appName}/public/images/frappe-${appName}-logo.svg`,
    `${appName}/public/images/frappe-${appName}-logo.png`,
    `${appName}/public/images/logo.svg`,
    `${appName}/public/images/logo.png`,
    `${appName}/frontend/public/logo.svg`,
    `${appName}/frontend/public/logo.png`,
    `${appName}/frontend/public/${appName}_logo.svg`,
    `${appName}/frontend/public/${appName}_logo.png`,
    `${appName}/frontend/public/favicon.svg`,
    `${appName}/frontend/public/favicon.png`,
    `frontend/src/assets/${appName}-icon.svg`,
    `frontend/src/assets/${appName}-logo.svg`,
    `frontend/public/${appName}_logo.svg`,
    `frontend/public/${appName}_logo.png`,
    `frontend/public/${appName}-logo.svg`,
    `frontend/public/${appName}-logo.png`,
    `frontend/public/logo.svg`,
    `frontend/public/logo.png`,
    `frontend/public/favicon.png`,
    `frontend/public/favicon.svg`,
    `desk/public/favicon.svg`,
    `desk/public/logo.svg`,
    `public/favicon.svg`,
    `public/logo.svg`,
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
  const repoData = (await githubFetch(
    `/repos/${owner}/${repo}`,
  )) as GitHubRepo | null;
  if (!repoData) {
    throw new Error(`Repository not found: ${repoUrl}`);
  }

  const defaultBranch = repoData.default_branch;

  // Clone repository locally to temp dir
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "frappe-brewery-"));
  console.log(`📥 Cloning repository to temp directory...`);
  try {
    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        `https://github.com/${owner}/${repo}.git`,
        tmpDir,
      ],
      {
        stdio: "ignore",
      },
    );
  } catch (err) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Failed to clone repository`);
  }

  try {
    // Fetch latest release
    const releases = (await githubFetch(
      `/repos/${owner}/${repo}/releases?per_page=1`,
    )) as GitHubRelease[] | null;
    const latestRelease = releases?.[0] ?? null;

    // Fetch branches using git ls-remote
    let branchNames: string[] = [];
    try {
      branchNames = Array.from(
        getRemoteBranches(`https://github.com/${owner}/${repo}.git`),
      );
    } catch {}

    const appName = repo.replace(/-/g, "_");

    // Extract files locally
    const hooksContent =
      getLocalFileContent(tmpDir, [`${appName}/hooks.py`, "hooks.py"]) ?? "";

    // Derive fields
    const slug = toSlug(appName);
    const title =
      extractAppTitle(hooksContent) ??
      repoData.name
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());
    const description =
      repoData.description ?? `A Frappe app from ${owner}/${repo}`;
    const license = detectLicense(repoData.license?.spdx_id);
    let frappeVersions = detectFrappeVersions(repoData.topics);
    const {
      installBranches,
      validFrappeVersions,
      warnings: compatibilityWarnings,
    } = await detectInstallBranchesAsync(
      owner,
      repo,
      frappeVersions,
      branchNames,
      defaultBranch,
    );
    frappeVersions = validFrappeVersions;
    const minFrappeVersion = detectMinFrappeVersion(frappeVersions);
    const requiredApps = hooksContent
      ? extractRequiredApps(hooksContent)
      : ["frappe"];
    const categories = topicsToCategories(repoData.topics).slice(0, 4);
    const tags = repoData.topics
      .filter((t) => !["frappe", "erpnext", "python"].includes(t))
      .slice(0, 4);
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
        `bench restart`,
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
      for (const warning of compatibilityWarnings) {
        console.warn(`   ⚠ ${warning}`);
      }
      console.log(`\nThen run: npm run brewery:validate`);

      if (latestRelease) {
        console.log(
          `\n📦 Latest release: ${latestRelease.tag_name} (${latestRelease.published_at.slice(0, 10)})`,
        );
      }
    }

    return app;
  } finally {
    // Clean up temporary directory
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

import { fileURLToPath } from "url";

export async function main() {
  const repoUrl = process.argv[2];
  if (!repoUrl) {
    console.error(
      "Usage: npm run brewery:extract https://github.com/owner/repo",
    );
    process.exit(1);
  }
  await extractApp(repoUrl, true);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
