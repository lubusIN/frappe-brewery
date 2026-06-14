import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "scripts", "app.schema.json");

let _schema: any;

export function getSchema(): any {
  if (!_schema) {
    _schema = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf8"));
  }
  return _schema;
}

export function getAllowedLicenses(): string[] {
  return getSchema().properties.license.enum as string[];
}

export function getAllowedFrappeVersions(): string[] {
  return getSchema().properties.frappe_versions.items.enum as string[];
}

export function getAllowedCategories(): string[] {
  return getSchema().properties.categories.items.enum as string[];
}
