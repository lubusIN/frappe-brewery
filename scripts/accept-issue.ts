import fs from "node:fs";
import path from "node:path";
import { formatApp } from "./format-apps.js";

const COMMENTS_PATH = path.join(process.cwd(), "issue-comments.json");

async function main() {
  if (!fs.existsSync(COMMENTS_PATH)) {
    console.error(
      `Missing ${path.basename(COMMENTS_PATH)}. Fetch issue comments before running this script.`,
    );
    process.exit(1);
  }

  const comments = JSON.parse(fs.readFileSync(COMMENTS_PATH, "utf8"));
  if (!Array.isArray(comments)) {
    throw new Error("Issue comments payload must be an array.");
  }

  // Find the latest comment containing the Raw JSON
  const botComment = comments
    .toReversed()
    .find(
      (c: any) =>
        c.user.login === "github-actions[bot]" &&
        c.body.includes("<summary>Raw JSON (Do not edit this block)</summary>"),
    );

  if (!botComment) {
    console.error(
      "Could not find the automated comment with the extracted JSON.",
    );
    process.exit(1);
  }

  const jsonMatch = botComment.body.match(/```json\n([\s\S]+?)\n```/);
  if (!jsonMatch) {
    console.error("Could not extract JSON from the comment body.");
    process.exit(1);
  }

  const jsonStr = jsonMatch[1];
  let app;
  try {
    app = JSON.parse(jsonStr);
  } catch (err) {
    console.error("Failed to parse extracted JSON.");
    process.exit(1);
  }

  if (!app.slug) {
    console.error("Extracted JSON is missing a slug.");
    process.exit(1);
  }

  const formatted = formatApp(app);

  const outputPath = path.join(process.cwd(), "apps", `${app.slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(formatted, null, 2) + "\n");

  console.log(`Successfully wrote apps/${app.slug}.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
