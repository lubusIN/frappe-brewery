import fs from "node:fs";
import path from "node:path";

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.ISSUE_NUMBER;

  if (!token || !repo || !issueNumber) {
    console.error("Missing environment variables");
    process.exit(1);
  }

  // Fetch all comments on the issue
  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch comments: ${res.statusText}`);
  }

  const comments = await res.json();
  
  // Find the latest comment containing the Raw JSON
  const botComment = comments.reverse().find((c: any) => 
    c.user.login === "github-actions[bot]" && 
    c.body.includes("<summary>Raw JSON (Do not edit this block)</summary>")
  );

  if (!botComment) {
    console.error("Could not find the automated comment with the extracted JSON.");
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

  // Ensure format-apps order
  const KEY_ORDER = [
    "slug", "name", "title", "description", "repository", "license",
    "min_frappe_version", "frappe_versions", "install_branches", "required_apps",
    "categories", "tags", "install_commands", "links", "media", "meta"
  ];
  
  const formatted: any = {};
  for (const key of KEY_ORDER) if (key in app) formatted[key] = app[key];
  for (const key of Object.keys(app)) if (!KEY_ORDER.includes(key)) formatted[key] = app[key];

  const outputPath = path.join(process.cwd(), "apps", `${app.slug}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(formatted, null, 2) + "\n");
  
  console.log(`Successfully wrote apps/${app.slug}.json`);
  
  // Also post a comment saying PR is being generated
  await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: "### 🚀 App Accepted!\nA Pull Request is being automatically generated to add this app to the registry." })
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
