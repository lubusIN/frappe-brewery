import { extractApp, parseRepoUrl } from "./extract.js";
import { checkValidFrappeApp } from "./validate.js";
import fs from "node:fs";

async function main() {
  const issueBody = process.env.ISSUE_BODY || "";
  const issueNumber = process.env.ISSUE_NUMBER;
  
  if (!issueBody) {
    console.error("No ISSUE_BODY provided");
    process.exit(1);
  }

  // Parse markdown from GitHub Issue Form
  const repoMatch = issueBody.match(/### GitHub Repository URL\s+([^\n]+)/);
  const categoriesMatch = issueBody.match(/### Categories\s+([^\n]+)/);
  const screenshotMatch = issueBody.match(/### Main Screenshot URL\s+([^\n]+)/);

  const repository = repoMatch ? repoMatch[1].trim() : "";
  let categoriesStr = categoriesMatch ? categoriesMatch[1].trim() : "";
  const screenshot = screenshotMatch ? screenshotMatch[1].trim() : "";

  if (categoriesStr === "_No response_") categoriesStr = "";

  if (!repository || repository === "_No response_") {
    await commentAndClose("No repository URL provided.");
    process.exit(0);
  }

  let owner, repo;
  try {
    const parsed = parseRepoUrl(repository);
    owner = parsed.owner;
    repo = parsed.repo;
  } catch {
    await commentAndClose(`Invalid GitHub repository URL: \`${repository}\`. Please provide a valid URL like \`https://github.com/frappe/erpnext\`.`);
    process.exit(0);
  }

  const appName = repo.replace(/-/g, "_");

  // Validate frappe app
  const isValidApp = await checkValidFrappeApp(repository, appName);
  if (!isValidApp) {
    await commentAndClose(`We did not find a valid Frappe app at \`${repository}\` (Missing \`${appName}/hooks.py\` on the default branch). If this is incorrect, please let us know in the comments!`);
    process.exit(0);
  }

  console.log("App is valid! Extracting metadata...");
  let app;
  try {
    app = await extractApp(repository, false);
  } catch (err: any) {
    await commentAndClose(`Failed to extract app metadata: ${err.message}`);
    process.exit(0);
  }

  // Merge form data
  if (categoriesStr) {
    // Categories are comma separated from dropdown
    app.categories = categoriesStr.split(",").map(s => s.trim()).filter(Boolean);
  }
  
  if (screenshot && screenshot !== "_No response_") {
    app.media.screenshots = [screenshot];
  }

  // Write markdown comment
  const jsonStr = JSON.stringify(app, null, 2);
  
  const markdown = `### ✅ Extraction Successful!
  
We have automatically extracted your app's details from the repository. Please review the details below.

| Field | Value |
| --- | --- |
| **App Name** | \`${app.name}\` |
| **Title** | ${app.title} |
| **Versions** | ${app.frappe_versions.join(", ")} |
| **License** | ${app.license} |
| **Categories** | ${app.categories.join(", ")} |

<details>
<summary>Raw JSON (Do not edit this block)</summary>

\`\`\`json
${jsonStr}
\`\`\`
</details>

*Maintainers will review your submission shortly! If everything looks good, they will label this issue as \`[app]accepted\` to automatically add it to the registry.*
`;

  await postComment(markdown);
  console.log("Successfully posted extraction result to issue!");
}

async function postComment(body: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.ISSUE_NUMBER;
  
  if (!token || !repo || !issueNumber) {
    console.log("Not running in GitHub Actions. Would have posted comment:\n", body);
    return;
  }
  
  await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body })
  });
}

async function commentAndClose(message: string) {
  const body = `### ❌ Validation Failed\n\n${message}\n\nClosing this issue. Feel free to open a new one once the problem is resolved!`;
  await postComment(body);
  
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.ISSUE_NUMBER;
  
  if (token && repo && issueNumber) {
    await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}`, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ state: "closed" })
    });
  }
}

main().catch(console.error);
