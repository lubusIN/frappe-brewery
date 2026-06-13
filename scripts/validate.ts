import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const SCHEMA_PATH = path.join(ROOT, "scripts", "app.schema.json");

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    throw new Error(`Failed to parse JSON at ${filePath}`);
  }
}

function isGitHubUrl(url: string): boolean {
  return /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url);
}

async function checkUrlAccessible(url: string): Promise<boolean> {
  try {
    // Some servers reject HEAD, so fallback to GET
    let res = await fetch(url, { method: "HEAD" });
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: "GET" });
    }
    return res.ok;
  } catch {
    return false;
  }
}

async function checkValidFrappeApp(repoUrl: string, appName: string): Promise<boolean> {
  const match = repoUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/);
  if (!match) return false;
  const owner = match[1];
  let repo = match[2];
  if (repo.endsWith('.git')) repo = repo.slice(0, -4);

  const branches = ["main", "master", "develop"];
  for (const branch of branches) {
    const hooksUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${appName}/hooks.py`;
    try {
      const res = await fetch(hooksUrl, { method: "HEAD" });
      if (res.ok) return true;
    } catch {}
  }
  
  try {
    const headers: Record<string, string> = {
      "User-Agent": "Frappe-Brewery-Validator"
    };
    if (process.env.GITHUB_TOKEN) {
      headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      const defaultBranch = repoData.default_branch;
      if (!branches.includes(defaultBranch)) {
        const hooksUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${appName}/hooks.py`;
        const hooksRes = await fetch(hooksUrl, { method: "HEAD" });
        return hooksRes.ok;
      }
    }
  } catch {}

  return false;
}

// ──────────────────────────────────────────────
// Setup AJV & Schema
// ──────────────────────────────────────────────
const schema = readJson(SCHEMA_PATH);
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema as object);

const allowedCategories = (schema as any).properties.categories.items.enum as string[];

// ──────────────────────────────────────────────
// Collect app files
// ──────────────────────────────────────────────
const files = fs
  .readdirSync(APPS_DIR)
  .filter((file) => file.endsWith(".json") && !file.startsWith("_"))
  .sort();

if (files.length === 0) {
  console.warn("⚠️  No app JSON files found in apps/");
  process.exit(0);
}

let hasError = false;
let warningCount = 0;
const slugs = new Set<string>();

// ──────────────────────────────────────────────
// Validate each app file
// ──────────────────────────────────────────────
for (const file of files) {
  const filePath = path.join(APPS_DIR, file);
  const expectedSlug = file.replace(".json", "");

  const fail = (message: string) => {
    hasError = true;
    console.error(`❌ ${file}: ${message}`);
  };

  const warn = (message: string) => {
    warningCount++;
    console.warn(`⚠️  ${file}: ${message}`);
  };

  // Parse JSON
  let app: Record<string, unknown>;
  try {
    app = readJson(filePath) as Record<string, unknown>;
  } catch (err) {
    fail(`invalid JSON — ${(err as Error).message}`);
    continue;
  }

  // Schema validation (AJV)
  if (!validateSchema(app)) {
    hasError = true;
    console.error(`❌ ${file}: schema validation failed`);
    for (const error of validateSchema.errors ?? []) {
      console.error(`   • ${error.instancePath || "(root)"}: ${error.message}`);
    }
    continue;
  }

  const slug = app.slug as string;
  const name = app.name as string;
  const repository = app.repository as string;
  const required_apps = app.required_apps as string[];
  const frappe_versions = app.frappe_versions as string[];
  const version_matrix = app.version_matrix as Record<string, string>;
  const categories = (app.categories as string[]) || [];
  const media = app.media as { icon?: string; screenshots?: string[] } | undefined;
  const links = app.links as { docs?: string } | undefined;

  // slug must match filename
  if (slug !== expectedSlug) {
    fail(`slug "${slug}" must match filename "${expectedSlug}.json"`);
  }

  // slug must be unique
  if (slugs.has(slug)) {
    fail(`duplicate slug "${slug}"`);
  }
  slugs.add(slug);

  // repository must be a GitHub URL and valid app
  if (!isGitHubUrl(repository)) {
    fail(`repository must be a valid GitHub URL (got: ${repository})`);
  } else {
    const isValidApp = await checkValidFrappeApp(repository, name);
    if (!isValidApp) {
      fail(`repository is either not public or not a valid Frappe app (missing ${name}/hooks.py on default branch)`);
    }
  }

  // required_apps must include "frappe"
  if (!required_apps.includes("frappe")) {
    fail(`required_apps must include "frappe"`);
  }

  // categories must be from the allowed list
  for (const category of categories) {
    if (!allowedCategories.includes(category as (typeof allowedCategories)[number])) {
      fail(`unknown category "${category}" — allowed: ${allowedCategories.join(", ")}`);
    }
  }

  // version_matrix keys must exactly match frappe_versions
  if (version_matrix && frappe_versions) {
    const matrix_keys = Object.keys(version_matrix).sort();
    const sorted_versions = [...frappe_versions].sort();
    if (matrix_keys.join(",") !== sorted_versions.join(",")) {
      fail(`version_matrix keys (${matrix_keys.join(", ")}) do not match frappe_versions (${sorted_versions.join(", ")})`);
    }
  }

  // Network check 2: App logo/icon URL
  if (!media?.icon) {
    fail(`app logo/icon (media.icon) is mandatory`);
  } else {
    const isIconValid = await checkUrlAccessible(media.icon);
    if (!isIconValid) fail(`app logo/icon URL is not accessible: ${media.icon}`);
  }

  // Network check 3: Screenshots
  const screenshots = media?.screenshots || [];
  if (screenshots.length < 1) {
    fail(`at least 1 screenshot is mandatory in media.screenshots`);
  } else {
    if (screenshots.length < 2) {
      warn(`2 screenshots are recommended (found ${screenshots.length})`);
    }
    
    for (const ss of screenshots) {
      const isSsValid = await checkUrlAccessible(ss);
      if (!isSsValid) fail(`screenshot URL is not accessible: ${ss}`);
    }
  }

  // ── Warnings (non-blocking) ──────────────────
  if (!links?.docs) {
    warn(`no docs link provided`);
  }
}

// ──────────────────────────────────────────────
// Summary
// ──────────────────────────────────────────────
console.log("");
console.log(`📦 Checked ${files.length} app file(s)`);

if (warningCount > 0) {
  console.log(`⚠️  ${warningCount} warning(s) — see above`);
}

if (hasError) {
  console.error(`\n❌ Validation failed — fix the errors above before merging`);
  process.exit(1);
}

console.log(`✅ All ${files.length} app(s) passed validation`);
