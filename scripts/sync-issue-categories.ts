import fs from "node:fs";
import path from "node:path";
import { getAllowedCategories } from "./schema.js";

const TEMPLATE_PATH = path.join(process.cwd(), ".github", "ISSUE_TEMPLATE", "submit-app.yml");

function main() {
  
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Issue template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }

  const categories = getAllowedCategories();

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
