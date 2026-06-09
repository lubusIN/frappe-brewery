import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const INDEX_DIR = path.join(ROOT, "index");
const SCHEMA_PATH = path.join(ROOT, "schema", "app.schema.json");

import type { App } from "../web/src/types";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function readJson(filePath: string): App {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as App;
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`  → wrote ${path.relative(ROOT, filePath)}`);
}

function toSummary(app: App) {
  return {
    slug: app.slug,
    name: app.name,
    title: app.title,
    description: app.description,
    repository: app.repository,
    license: app.license,
    frappe_versions: app.frappe_versions,
    required_apps: app.required_apps,
    categories: app.categories,
    tags: app.tags ?? [],
    verified: app.meta?.verified ?? false,
    status: app.meta?.status ?? "active",
    icon: app.media?.icon || null,
  };
}

// ──────────────────────────────────────────────
// Ensure output directory exists
// ──────────────────────────────────────────────
if (!fs.existsSync(INDEX_DIR)) {
  fs.mkdirSync(INDEX_DIR, { recursive: true });
}

// ──────────────────────────────────────────────
// Load apps
// ──────────────────────────────────────────────
const files = fs
  .readdirSync(APPS_DIR)
  .filter((file) => file.endsWith(".json"))
  .sort();

const apps: App[] = files
  .map((file) => readJson(path.join(APPS_DIR, file)))
  .sort((a, b) => a.title.localeCompare(b.title));

const generatedAt = new Date().toISOString();
const appSummaries = apps.map(toSummary);

console.log(`\n📦 Generating index for ${apps.length} app(s)…\n`);

// ──────────────────────────────────────────────
// index/apps.json — full list of all apps
// ──────────────────────────────────────────────
writeJson(path.join(INDEX_DIR, "apps.json"), {
  generated_at: generatedAt,
  count: appSummaries.length,
  apps: appSummaries,
});

// ──────────────────────────────────────────────
// index/categories.json — grouped by category
// ──────────────────────────────────────────────
const categoryMap: Record<string, ReturnType<typeof toSummary>[]> = {};

for (const app of apps) {
  for (const category of app.categories ?? []) {
    if (!categoryMap[category]) {
      categoryMap[category] = [];
    }
    categoryMap[category].push(toSummary(app));
  }
}

writeJson(path.join(INDEX_DIR, "categories.json"), {
  generated_at: generatedAt,
  categories: Object.keys(categoryMap)
    .sort()
    .map((category) => ({
      name: category,
      count: categoryMap[category].length,
      apps: categoryMap[category],
    })),
});

// ──────────────────────────────────────────────
// index/frappe-{14,15,16}.json — filtered by version
// ──────────────────────────────────────────────
const schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
const frappeVersions = schema.properties.frappe_versions.items.enum as string[];

for (const version of frappeVersions) {
  const compatibleApps = apps
    .filter((app) => app.frappe_versions.includes(version))
    .map(toSummary);

  writeJson(path.join(INDEX_DIR, `frappe-${version}.json`), {
    generated_at: generatedAt,
    frappe_version: version,
    count: compatibleApps.length,
    apps: compatibleApps,
  });
}

// ──────────────────────────────────────────────
// index/stats.json — aggregate statistics
// ──────────────────────────────────────────────
writeJson(path.join(INDEX_DIR, "stats.json"), {
  generated_at: generatedAt,
  total_apps: apps.length,
  total_categories: Object.keys(categoryMap).length,
  by_frappe_version: frappeVersions.reduce<Record<string, number>>(
    (acc, version) => {
      acc[version] = apps.filter((app) =>
        app.frappe_versions.includes(version)
      ).length;
      return acc;
    },
    {}
  ),
  by_category: Object.fromEntries(
    Object.entries(categoryMap).map(([category, items]) => [
      category,
      items.length,
    ])
  ),
});

console.log(`\n✅ Registry index generated for ${apps.length} app(s)`);
