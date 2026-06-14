import { extractApp, parseRepoUrl } from "./extract.js";
import { checkValidFrappeApp, validateSingleApp } from "./validate.js";
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
  const tagsMatch = issueBody.match(/### Tags\s+([^\n]+)/);
  const screenshotMatch = issueBody.match(/### Main Screenshot URL\s+([^\n]+)/);

  const repository = repoMatch ? repoMatch[1].trim() : "";
  let categoriesStr = categoriesMatch ? categoriesMatch[1].trim() : "";
  const tagsStr = tagsMatch ? tagsMatch[1].trim() : "";
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
    // Categories are comma separated from dropdown, limited to 4
    app.categories = categoriesStr.split(",").map(s => s.trim()).filter(Boolean).slice(0, 4);
  }

  if (tagsStr && tagsStr !== "_No response_") {
    // Override auto-extracted tags with user provided tags, limited to 4
    app.tags = tagsStr.split(",").map(s => s.trim().toLowerCase()).filter(Boolean).slice(0, 4);
  }
  
  if (screenshot && screenshot !== "_No response_") {
    app.media.screenshots = [screenshot];
  }

  // Write markdown comment
  const jsonStr = JSON.stringify(app, null, 2);
  
  const branchesStr = Object.entries(app.install_branches || {}).map(([v, b]) => `**${v}**: \`${b}\``).join("<br>");
  const reqAppsStr = (app.required_apps || []).join(", ");
  const descStr = (app.description || "").replace(/\n/g, " ");

  const mediaPreview = [];
  if (app.media?.icon) mediaPreview.push(`**Icon:** <br><img src="${app.media.icon}" height="50" align="top"/>`);
  if (app.media?.screenshots?.[0]) mediaPreview.push(`**Screenshot:** <br><img src="${app.media.screenshots[0]}" width="500"/>`);

  const { errors, warnings } = await validateSingleApp(app);
  
  let validationStatus = "";
  if (errors.length === 0) {
    validationStatus = "✅ **Validation Passed!**";
    if (warnings.length > 0) {
      validationStatus += "\n\n⚠️ **Warnings (Non-blocking):**\n" + warnings.map(w => `- ${w}`).join("\n");
    }
  } else {
    validationStatus = "❌ **Validation Failed!** Please fix the following errors before this app can be accepted:\n" + errors.map(e => `- ${e}`).join("\n");
    if (warnings.length > 0) {
      validationStatus += "\n\n⚠️ **Warnings:**\n" + warnings.map(w => `- ${w}`).join("\n");
    }
  }

  const markdown = `### ✅ Extraction Successful!
  
We have automatically extracted your app's details from the repository. Please review the details below.

| Field | Value |
| --- | --- |
| **App Name** | \`${app.name}\` |
| **Title** | ${app.title} |
| **Description** | ${descStr} |
| **Repository** | ${app.repository} |
| **Versions** | ${app.frappe_versions.join(", ")} |
| **Min Version** | ${app.min_frappe_version || "Not specified"} |
| **License** | ${app.license} |
| **Categories** | ${(app.categories || []).join(", ")} |
| **Tags** | ${(app.tags || []).join(", ")} |
| **Required Apps** | ${reqAppsStr} |
| **Install Branches** | ${branchesStr} |

${mediaPreview.length ? "### Media Preview\n\n" + mediaPreview.join("\n\n") + "\n\n" : ""}### Validation Results

${validationStatus}

<details>
<summary>Raw JSON (Do not edit this block)</summary>

\`\`\`json
${jsonStr}
\`\`\`
</details>

*Maintainers will review your submission shortly! If everything looks good, they will label this issue as \`[app]accepted\` to automatically add it to the registry.*
`;

  await postComment(markdown);
  await setIssueState("open"); // Reopen in case it was previously closed
  console.log("Successfully posted extraction result to issue!");
}

const BOT_MARKER = "<!-- frappe-brewery-bot-comment -->";

async function postComment(body: string) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issueNumber = process.env.ISSUE_NUMBER;
  
  if (!token || !repo || !issueNumber) {
    console.log("Not running in GitHub Actions. Would have posted comment:\n", body);
    return;
  }
  
  const finalBody = BOT_MARKER + "\n\n" + body;

  // Fetch existing comments to see if we already commented
  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json"
    }
  });

  if (res.ok) {
    const comments = await res.json();
    const existingComment = comments.find((c: any) => c.body.includes(BOT_MARKER));
    
    if (existingComment) {
      // Update existing comment
      await fetch(`https://api.github.com/repos/${repo}/issues/comments/${existingComment.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ body: finalBody })
      });
      return;
    }
  }

  // Create new comment
  await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ body: finalBody })
  });
}

async function setIssueState(state: "open" | "closed") {
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
      body: JSON.stringify({ state })
    });
  }
}

async function commentAndClose(message: string) {
  const body = `### ❌ Validation Failed\n\n${message}\n\nClosing this issue. Feel free to fix the issues and edit the issue body to retry!`;
  await postComment(body);
  await setIssueState("closed");
}

main().catch(console.error);
