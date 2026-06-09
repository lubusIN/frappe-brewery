import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const SCHEMA_PATH = path.join(ROOT, "schema", "app.schema.json");



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

// ──────────────────────────────────────────────
// Setup AJV & Schema
// ──────────────────────────────────────────────
const schema = readJson(SCHEMA_PATH);
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema as object);

// Dynamically extract allowed categories from schema
const allowedCategories = (schema as any).properties.categories.items.enum as string[];

// ──────────────────────────────────────────────
// Collect app files
// ──────────────────────────────────────────────
const files = fs
  .readdirSync(APPS_DIR)
  .filter((file) => file.endsWith(".json"))
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
  const repository = app.repository as string;
  const required_apps = app.required_apps as string[];
  const categories = (app.categories as string[]) || [];
  const install = app.install as { app_name?: string };
  const media = app.media as { screenshots?: string[] } | undefined;
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

  // repository must be a GitHub URL
  if (!isGitHubUrl(repository)) {
    fail(`repository must be a valid GitHub URL (got: ${repository})`);
  }

  // required_apps must include "frappe"
  if (!required_apps.includes("frappe")) {
    fail(`required_apps must include "frappe"`);
  }

  // install.app_name is required
  if (!install?.app_name) {
    fail(`install.app_name is required`);
  }

  // categories must be from the allowed list
  for (const category of categories) {
    if (!allowedCategories.includes(category as (typeof allowedCategories)[number])) {
      fail(`unknown category "${category}" — allowed: ${allowedCategories.join(", ")}`);
    }
  }

  // ── Warnings (non-blocking) ──────────────────
  if (!media?.screenshots?.length) {
    warn(`no screenshots provided`);
  }

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
