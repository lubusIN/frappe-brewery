import fs from "node:fs";
import path from "node:path";

const SCHEMA_PATH = path.join(process.cwd(), "scripts", "app.schema.json");
const TEMPLATE_PATH = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", "submit-app.yml");

function main() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error(`Schema not found: ${SCHEMA_PATH}`);
    process.exit(1);
  }
  
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Issue template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  // Read the schema
  const schemaStr = fs.readFileSync(SCHEMA_PATH, "utf8");
  const schema = JSON.parse(schemaStr);
  const categories: string[] = schema.properties?.categories?.items?.enum;
  
  if (!categories || !Array.isArray(categories)) {
    console.error("Could not find categories.items.enum in app.schema.json");
    process.exit(1);
  }

  // Format the categories into YAML list with 8 spaces indentation
  const yamlOptions = categories.map(cat => `        - ${cat}`).join("\n");

  // Read the template
  let templateStr = fs.readFileSync(TEMPLATE_PATH, "utf8");

  // Regex to match the options block inside the categories dropdown
  // It matches "      options:\n" followed by any number of "        - ...\n"
  // up until the next "    validations:" block
  const regex = /(\s+options:\n)(?:\s+- [^\n]+\n)+(\s+validations:)/;

  if (!regex.test(templateStr)) {
    console.error("Could not find the target options block in submit-app.yml. Ensure the file formatting matches expectations.");
    process.exit(1);
  }

  const newTemplateStr = templateStr.replace(regex, `$1${yamlOptions}\n$2`);

  if (templateStr !== newTemplateStr) {
    fs.writeFileSync(TEMPLATE_PATH, newTemplateStr);
    console.log(`✅ Successfully synced ${categories.length} categories to submit-app.yml`);
  } else {
    console.log("✅ submit-app.yml categories are already up to date.");
  }
}

main();
