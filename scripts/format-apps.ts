import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APPS_DIR = path.join(ROOT, "apps");

export const KEY_ORDER = [
  "slug",
  "name",
  "title",
  "description",
  "repository",
  "license",
  "min_frappe_version",
  "frappe_versions",
  "install_branches",
  "required_apps",
  "categories",
  "tags",
  "install_commands",
  "links",
  "media",
  "meta"
];

export function formatApp(data: any): any {
  const formatted: Record<string, any> = {};
  
  // Apply ordered keys
  for (const key of KEY_ORDER) {
    if (key in data) {
      formatted[key] = data[key];
    }
  }
  
  // Preserve any extra keys that might not be in the KEY_ORDER array just in case
  for (const key of Object.keys(data)) {
    if (!KEY_ORDER.includes(key)) {
      formatted[key] = data[key];
    }
  }
  
  return formatted;
}

import { fileURLToPath } from 'url';

export async function main() {
  const files = fs
    .readdirSync(APPS_DIR)
    .filter((file) => file.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(APPS_DIR, file);
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
    const formatted = formatApp(data);
    
    fs.writeFileSync(filePath, JSON.stringify(formatted, null, 2) + "\n");
    console.log(`✅ Formatted ${file}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error("❌", err.message);
    process.exit(1);
  });
}
