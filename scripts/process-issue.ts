import { extractApp, parseRepoUrl } from "./extract.js";
import { checkValidFrappeApp, validateSingleApp } from "./validate.js";
import fs from "node:fs";

async function main() {
  const issueBody = process.env.ISSUE_BODY || "";

  if (!issueBody) {
    console.error("No ISSUE_BODY provided");
    process.exit(1);
  }

  // Parse markdown from GitHub Issue Form
  const repoMatch = issueBody.match(/### GitHub Repository URL\s+([^\n]+)/);
  const categoriesMatch = issueBody.match(/### Categories\s+([^\n]+)/);
  const tagsMatch = issueBody.match(/### Tags\s+([^\n]+)/);
  const installBranchesMatch = issueBody.match(
    /### Install Branches\s+([^\n]+)/,
  );
  const screenshotMatch = issueBody.match(/### Main Screenshot URL\s+([^\n]+)/);

  const repository = repoMatch ? repoMatch[1].trim() : "";
  let categoriesStr = categoriesMatch ? categoriesMatch[1].trim() : "";
  const tagsStr = tagsMatch ? tagsMatch[1].trim() : "";
  const installBranchesStr = installBranchesMatch
    ? installBranchesMatch[1].trim()
    : "";
  let screenshot = screenshotMatch ? screenshotMatch[1].trim() : "";
  if (screenshot) {
    const mdImageMatch = screenshot.match(/!\[.*?\]\((.+?)\)/);
    if (mdImageMatch) {
      screenshot = mdImageMatch[1];
    } else {
      const htmlImageMatch = screenshot.match(/<img.*?src=["'](.+?)["']/);
      if (htmlImageMatch) {
        screenshot = htmlImageMatch[1];
      }
    }
  }

  if (categoriesStr === "_No response_") categoriesStr = "";

  if (!repository || repository === "_No response_") {
    commentAndClose("No repository URL provided.");
    process.exit(0);
  }

  let repo;
  try {
    const parsed = parseRepoUrl(repository);
    repo = parsed.repo;
  } catch {
    commentAndClose(
      `Invalid GitHub repository URL: \`${repository}\`. Please provide a valid URL like \`https://github.com/frappe/erpnext\`.`,
    );
    process.exit(0);
  }

  const appName = repo.replace(/-/g, "_");

  // Validate frappe app
  const isValidApp = await checkValidFrappeApp(repository, appName);
  if (!isValidApp) {
    commentAndClose(
      `We did not find a valid Frappe app at \`${repository}\` (Missing \`${appName}/hooks.py\` on the default branch). If this is incorrect, please let us know in the comments!`,
    );
    process.exit(0);
  }

  console.log("App is valid! Extracting metadata...");
  let app;
  try {
    app = await extractApp(repository, false);
  } catch (err: any) {
    commentAndClose(`Failed to extract app metadata: ${err.message}`);
    process.exit(0);
  }

  // Merge form data
  if (categoriesStr) {
    // Categories are comma separated from dropdown, limited to 4
    app.categories = categoriesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  if (tagsStr && tagsStr !== "_No response_") {
    // Override auto-extracted tags with user provided tags, limited to 4
    app.tags = tagsStr
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 4);
  }

  if (installBranchesStr && installBranchesStr !== "_No response_") {
    const pairs = installBranchesStr
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const customBranches: Record<string, string> = {};
    for (const pair of pairs) {
      const parts = pair.split(":");
      if (parts.length === 2) {
        customBranches[parts[0].trim()] = parts[1].trim();
      }
    }
    if (Object.keys(customBranches).length > 0) {
      app.install_branches = customBranches;
      app.frappe_versions = Object.keys(customBranches).sort();
      app.min_frappe_version = app.frappe_versions[0]
        ? `${app.frappe_versions[0]}.0.0`
        : undefined;
    }
  }

  if (screenshot && screenshot !== "_No response_") {
    app.media.screenshots = [screenshot];
  }

  // Write markdown comment
  const jsonStr = JSON.stringify(app, null, 2);

  const branchesStr = Object.entries(app.install_branches || {})
    .map(([v, b]) => `**${v}**: \`${b}\``)
    .join("<br>");
  const reqAppsStr = (app.required_apps || []).join(", ");
  const descStr = (app.description || "").replace(/\n/g, " ");

  const mediaPreview = [];
  if (app.media?.icon)
    mediaPreview.push(
      `**Icon:** <br><img src="${app.media.icon}" height="50" align="top"/>`,
    );
  if (app.media?.screenshots?.[0])
    mediaPreview.push(
      `**Screenshot:** <br><img src="${app.media.screenshots[0]}" width="500"/>`,
    );

  const { errors, warnings } = await validateSingleApp(app);

  let validationStatus = "";
  if (errors.length === 0) {
    validationStatus = "✅ **Validation Passed!**";
    if (warnings.length > 0) {
      validationStatus +=
        "\n\n⚠️ **Warnings (Non-blocking):**\n" +
        warnings.map((w) => `- ${w}`).join("\n");
    }
  } else {
    validationStatus =
      "❌ **Validation Failed!** Please fix the following errors before this app can be accepted:\n" +
      errors.map((e) => `- ${e}`).join("\n");
    if (warnings.length > 0) {
      validationStatus +=
        "\n\n⚠️ **Warnings:**\n" + warnings.map((w) => `- ${w}`).join("\n");
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

> [!NOTE]  
> Please review the extracted details above! If anything looks incorrect or if you'd like to suggest changes, please leave a comment below.
`;

  fs.writeFileSync("app.json", jsonStr);
  writeValidationFile(markdown);
  writeIssueState("open"); // Reopen in case it was previously closed
  console.log("Successfully wrote extraction result to validation.md!");
}

function writeValidationFile(body: string) {
  fs.writeFileSync("validation.md", body);
}

function writeIssueState(state: "open" | "closed") {
  fs.writeFileSync("issue_state.txt", state);
}

function commentAndClose(message: string) {
  const body = `### ❌ Validation Failed

${message}

Closing this issue. Feel free to fix the issues and edit the issue body to retry!`;
  writeValidationFile(body);
  writeIssueState("closed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
