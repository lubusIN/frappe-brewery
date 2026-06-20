import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { parseRepoUrl } from "./extract.js";

// Helper to escape output block
function escapeMarkdown(text: string): string {
  return text.trim().replace(/```/g, "'''");
}

function formatSemgrepTable(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.results || data.results.length === 0) return "✅ Passed\n";

    let table = "| File | Rule | Message | Line |\n";
    table += "| --- | --- | --- | --- |\n";
    for (const res of data.results) {
      const file = res.path || "";
      let rule = res.check_id || "";
      // Strip temporary path prefix from local rule IDs
      // e.g. "var.folders...semgrep-rules.rules.security.foo" → "security.foo"
      const rulesIdx = rule.lastIndexOf(".rules.");
      if (rulesIdx !== -1) {
        rule = rule.substring(rulesIdx + ".rules.".length);
      }

      let msg = (res.extra?.message || "").replace(/\n/g, " ");
      const line = res.start?.line || "";
      table += `| \`${file}\` | \`${rule}\` | ${msg} | ${line} |\n`;
    }
    return table + "\n";
  } catch (err) {
    return `❌ **Error or Fatal Failure**\n\n\`\`\`text\n${escapeMarkdown(jsonStr)}\n\`\`\`\n`;
  }
}

function formatPipAuditTable(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.dependencies || data.dependencies.length === 0)
      return "✅ Passed\n";

    let vulnsFound = false;
    let table = "| Package | Version | Vulnerability ID | Fix Versions |\n";
    table += "| --- | --- | --- | --- |\n";

    for (const dep of data.dependencies) {
      if (dep.vulns && dep.vulns.length > 0) {
        vulnsFound = true;
        for (const vuln of dep.vulns) {
          const name = dep.name || "";
          const version = dep.version || "";
          const vulnId = vuln.id || vuln.aliases?.[0] || "Unknown";
          const fixVersions = vuln.fix_versions
            ? vuln.fix_versions.join(", ")
            : "None";
          table += `| \`${name}\` | \`${version}\` | \`${vulnId}\` | \`${fixVersions}\` |\n`;
        }
      }
    }
    return vulnsFound ? table + "\n" : "✅ Passed\n";
  } catch (err) {
    return `❌ **Error or Fatal Failure**\n\n\`\`\`text\n${escapeMarkdown(jsonStr)}\n\`\`\`\n`;
  }
}

export function getSafePipAuditArgs(projectDir: string): string[] | null {
  const lockfiles = fs
    .readdirSync(projectDir)
    .filter((name) => /^pylock(?:\.[a-z\d_-]+)?\.toml$/i.test(name));
  if (lockfiles.length > 0) {
    return ["--locked", "--no-deps", "--disable-pip", "."];
  }

  const requirementsPath = path.join(projectDir, "requirements.txt");
  if (!fs.existsSync(requirementsPath)) return null;

  const requirements = fs
    .readFileSync(requirementsPath, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
  const exactRequirement =
    /^[a-z\d][a-z\d._-]*(?:\[[a-z\d,._-]+\])?==[^\s;]+(?:\s*;.+)?$/i;
  if (
    requirements.length === 0 ||
    requirements.some((line) => !exactRequirement.test(line))
  ) {
    return null;
  }

  return ["--requirement", requirementsPath, "--no-deps", "--disable-pip"];
}

export function lintApp(appJsonPath: string): boolean {
  const absolutePath = path.resolve(process.cwd(), appJsonPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`App JSON not found at ${absolutePath}`);
  }

  const app = JSON.parse(fs.readFileSync(absolutePath, "utf-8"));
  const repository = app.repository;
  const installBranches = app.install_branches || {};

  if (!repository) {
    throw new Error("Repository URL not found in JSON.");
  }

  const { owner, repo } = parseRepoUrl(repository);
  const repoUrl = `https://github.com/${owner}/${repo}.git`;

  const uniqueBranches = new Set<string>(
    Object.values(installBranches as Record<string, string>),
  );
  if (uniqueBranches.size === 0) {
    uniqueBranches.add(""); // Empty string acts as fallback for the default branch
  }

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "frappe-linter-"));
  let overallFailed = false;

  let report = "### 🔎 Linter Results\n\n";

  try {
    // Clone semgrep rules
    console.log("📥 Downloading Frappe semgrep rules...");
    const rulesDir = path.join(tmpDir, "semgrep-rules");
    execFileSync(
      "git",
      [
        "clone",
        "--depth",
        "1",
        "https://github.com/frappe/semgrep-rules.git",
        rulesDir,
      ],
      {
        stdio: "ignore",
      },
    );

    let branchIndex = 0;
    for (const branch of uniqueBranches) {
      const branchLabel = branch || "default branch";
      console.log(`\n⏳ Linting branch: ${branchLabel}`);
      const branchDir = path.join(tmpDir, `app-${branchIndex++}`);

      try {
        const cloneArgs = ["clone", "--depth", "1"];
        if (branch) cloneArgs.push("--branch", branch);
        cloneArgs.push("--", repoUrl, branchDir);
        execFileSync("git", cloneArgs, { stdio: "ignore" });
      } catch {
        console.error(`❌ Failed to clone branch ${branchLabel}`);
        report += `#### Branch: \`${branchLabel}\`\n\n❌ **Failed to clone repository on this branch.**\n\n`;
        overallFailed = true;
        continue;
      }

      let semgrepOutput = "";
      try {
        console.log("   Running semgrep...");
        semgrepOutput = execFileSync(
          "semgrep",
          [
            "scan",
            "--config",
            path.join(rulesDir, "rules"),
            "--config",
            "r/python.lang.correctness",
            "--json",
            "--quiet",
            "--error",
          ],
          {
            cwd: branchDir,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "pipe"],
          },
        );
      } catch (e: any) {
        semgrepOutput = e.stdout || e.stderr || e.message;
        overallFailed = true;
      }

      let pipAuditOutput = "";
      let pipAuditPassed = false;
      const pipAuditArgs = getSafePipAuditArgs(branchDir);
      if (pipAuditArgs) {
        try {
          console.log("   Running pip-audit without dependency resolution...");
          pipAuditOutput = execFileSync(
            "pip-audit",
            ["--desc", "on", "--format", "json", ...pipAuditArgs],
            {
              cwd: branchDir,
              encoding: "utf-8",
              stdio: ["ignore", "pipe", "pipe"],
            },
          );
          pipAuditPassed = true;
        } catch (e: any) {
          pipAuditOutput = e.stdout || e.stderr || e.message;
          const output =
            `${e.stdout || ""}\n${e.stderr || ""}\n${e.message || ""}`.toLowerCase();
          if (output.includes("no dependencies found")) {
            pipAuditPassed = true;
          } else {
            overallFailed = true;
          }
        }
      }

      report += `#### Branch: \`${branchLabel}\`\n\n`;

      report += `**Semgrep**:\n`;
      report += formatSemgrepTable(semgrepOutput);

      report += `**pip-audit**:\n`;
      if (!pipAuditArgs) {
        report +=
          "⏭️ Skipped — no lockfile or fully pinned requirements.txt was found.\n";
      } else {
        report += pipAuditPassed
          ? "✅ Passed\n"
          : formatPipAuditTable(pipAuditOutput);
      }

      report += `\n---\n\n`;
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  if (overallFailed) {
    console.error("❌ Linters failed on one or more branches.");
  } else {
    console.log("✅ All linters passed on all branches.");
  }

  fs.writeFileSync("linter_report.md", report);

  return !overallFailed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const targetJson = process.argv[2];
  if (!targetJson) {
    console.error("Usage: npx tsx scripts/lint-app.ts <path-to-app.json>");
    process.exit(1);
  }
  try {
    const success = lintApp(targetJson);
    process.exit(success ? 0 : 1);
  } catch (err: any) {
    console.error(err.message || err);
    process.exit(1);
  }
}
