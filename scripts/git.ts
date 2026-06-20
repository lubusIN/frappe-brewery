import { execFileSync } from "node:child_process";

export function getRemoteBranches(repoUrl: string): Set<string> {
  try {
    const output = execFileSync(
      "git",
      ["ls-remote", "--heads", "--", repoUrl],
      { stdio: "pipe" },
    ).toString();
    return new Set(
      output
        .split("\n")
        .filter((line) => line.includes("refs/heads/"))
        .map((line) => line.split("refs/heads/")[1].trim()),
    );
  } catch (err: any) {
    throw new Error(
      `failed to query repository branches using git ls-remote: ${err.message}`,
    );
  }
}

export function getDefaultBranch(repoUrl: string): string | null {
  try {
    const output = execFileSync(
      "git",
      ["ls-remote", "--symref", "--", repoUrl, "HEAD"],
      { stdio: "pipe" },
    ).toString();
    const branchMatch = output.match(/ref:\s+refs\/heads\/([^\s]+)\s+HEAD/);
    return branchMatch ? branchMatch[1] : null;
  } catch {
    return null;
  }
}
