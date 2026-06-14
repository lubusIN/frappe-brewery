import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");
const INDEX_DIR = path.join(ROOT, "index");

import type { App } from "../src/types";
import { formatApp as sharedFormatApp } from "./format-apps.js";
import { getAllowedFrappeVersions } from "./schema.js";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
function readJson(filePath: string): App {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as App;
}

function writeJson(filePath: string, data: Record<string, any>): void {
  if (fs.existsSync(filePath)) {
    try {
      const existingData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const existingForCompare = { ...existingData, generated_at: "" };
      const newForCompare = { ...data, generated_at: "" };
      
      if (JSON.stringify(existingForCompare) === JSON.stringify(newForCompare)) {
        console.log(`  → skipped ${path.relative(ROOT, filePath)} (no changes)`);
        return;
      }
    } catch {
      // If parsing fails, proceed to overwrite
    }
  }

  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`  → wrote ${path.relative(ROOT, filePath)}`);
}

function formatApp(app: App): App {
  return sharedFormatApp(app) as App;
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
  .filter((file) => file.endsWith(".json") && !file.startsWith("_"))
  .sort();

const apps: App[] = files
  .map((file) => readJson(path.join(APPS_DIR, file)))
  .sort((a, b) => a.title.localeCompare(b.title));

const generatedAt = new Date().toISOString();
const appSummaries = apps.map(formatApp);

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
    categoryMap[category].push(formatApp(app));
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
const frappeVersions = getAllowedFrappeVersions();

for (const version of frappeVersions) {
  const compatibleApps = apps
    .filter((app) => app.frappe_versions.includes(version))
    .map(formatApp);

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
