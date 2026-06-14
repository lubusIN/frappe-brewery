import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { inspectBranchCompatibility, parseRepoUrl } from "./extract.js";
import { getSchema, getAllowedCategories, getAllowedFrappeVersions } from "./schema.js";
import { getRemoteBranches, getDefaultBranch } from "./git.js";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");

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

import { execSync } from "node:child_process";

export async function checkValidFrappeApp(repoUrl: string, appName: string): Promise<boolean> {
  let parsed;
  try {
    parsed = parseRepoUrl(repoUrl);
  } catch {
    return false;
  }
  const { owner, repo } = parsed;

  const defaultBranch = getDefaultBranch(repoUrl);
  if (defaultBranch) {
    const hooksUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${appName}/hooks.py`;
    const res = await fetch(hooksUrl, { method: "HEAD" });
    return res.ok;
  }

  return false;
}


// ──────────────────────────────────────────────
// Setup AJV & Schema
// ──────────────────────────────────────────────
const schema = getSchema();
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema as object);

const allowedCategories = getAllowedCategories();
const allowedFrappeVersions = getAllowedFrappeVersions();

export function validateAppAgainstSchema(app: any): { valid: boolean; errors: string[] } {
  const valid = validateSchema(app);
  if (valid) return { valid: true, errors: [] };
  const errors = validateSchema.errors?.map(e => `${e.instancePath || '(root)'}: ${e.message}`) || [];
  return { valid: false, errors };
}

// ──────────────────────────────────────────────

export async function validateSingleApp(app: any, expectedSlug?: string): Promise<{ errors: string[], warnings: string[] }> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const fail = (message: string) => errors.push(message);
  const warn = (message: string) => warnings.push(message);

  // Schema validation (AJV)
  if (!validateSchema(app)) {
    fail(`schema validation failed`);
    for (const error of validateSchema.errors ?? []) {
      fail(`• ${error.instancePath || "(root)"}: ${error.message}`);
    }
  }

  const slug = app.slug as string;
  const name = app.name as string;
  const repository = app.repository as string;
  const required_apps = app.required_apps as string[] || [];
  const frappe_versions = app.frappe_versions as string[] || [];
  const install_branches = app.install_branches as Record<string, string>;
  const categories = (app.categories as string[]) || [];
  const tags = (app.tags as string[]) || [];
  const media = app.media as { icon?: string; screenshots?: string[] } | undefined;
  const links = app.links as { docs?: string } | undefined;

  // Explicit check for limits
  if (categories.length > 4) {
    fail(`categories list exceeds the maximum limit of 4 (found ${categories.length})`);
  }
  if (tags.length > 4) {
    fail(`tags list exceeds the maximum limit of 4 (found ${tags.length})`);
  }

  // slug must match filename
  if (expectedSlug && slug !== expectedSlug) {
    fail(`slug "${slug}" must match filename "${expectedSlug}.json"`);
  }

  let parsedRepo: { owner: string, repo: string } | null = null;
  try {
    parsedRepo = parseRepoUrl(repository);
  } catch {}

  // repository must be a GitHub URL and valid app
  if (!repository || !parsedRepo) {
    fail(`repository must be a valid GitHub URL (got: ${repository})`);
  } else {
    const isValidApp = await checkValidFrappeApp(repository, name);
    if (!isValidApp) {
      fail(`repository is either not public or not a valid Frappe app (missing ${name}/hooks.py on default branch)`);
    } else if (install_branches && frappe_versions) {
      const matrix_keys = Object.keys(install_branches).sort();
      const sorted_versions = [...frappe_versions].sort();
      if (matrix_keys.join(",") !== sorted_versions.join(",")) {
        fail(`install_branches keys (${matrix_keys.join(", ")}) do not match frappe_versions (${sorted_versions.join(", ")})`);
      } else {
        let remoteBranches: Set<string> | null = null;
        try {
          remoteBranches = getRemoteBranches(repository);
        } catch {
          fail(`failed to query repository branches using git ls-remote`);
        }

        if (remoteBranches) {
        
        const { owner, repo: repoName } = parsedRepo;

        for (const [version, branch] of Object.entries(install_branches)) {
          if (!remoteBranches.has(branch)) {
            fail(`install_branches branch "${branch}" does not exist in repository`);
          } else if (owner && repoName) {
            try {
              const evidence = await inspectBranchCompatibility(
                owner,
                repoName,
                branch,
                allowedFrappeVersions,
              );
              
              const verifiable = evidence.length > 0;
              const valid = evidence.some(e => e.versions.includes(version));
              
              if (!valid && verifiable) {
                fail(`install_branches branch "${branch}" declares compatibility that does not include Frappe ${version}`);
              } else if (!verifiable) {
                warn(`branch "${branch}" (mapped to ${version}) has no machine-readable Frappe compatibility evidence`);
              }
            } catch (err: any) {
              fail(`failed to inspect branch compatibility: ${err.message}`);
            }
          }
        }
        } // close if (remoteBranches)
      }
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

  if (!links?.docs) {
    warn(`no docs link provided`);
  }

  return { errors, warnings };
}

// ──────────────────────────────────────────────
// CLI Entry
// ──────────────────────────────────────────────
import { fileURLToPath } from 'url';

export async function main() {
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
    hasError = true;
    console.error(`❌ ${file}: invalid JSON — ${(err as Error).message}`);
    continue;
  }

  if (slugs.has(app.slug as string)) {
    hasError = true;
    console.error(`❌ ${file}: duplicate slug "${app.slug}"`);
  }
  slugs.add(app.slug as string);

  const { errors, warnings } = await validateSingleApp(app, expectedSlug);
  
  for (const error of errors) {
    hasError = true;
    console.error(`❌ ${file}: ${error}`);
  }
  
  for (const warning of warnings) {
    warningCount++;
    console.warn(`⚠️  ${file}: ${warning}`);
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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
