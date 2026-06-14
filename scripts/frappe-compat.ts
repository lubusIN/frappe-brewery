export interface BranchCompatibility {
  branch: string;
  versions: string[];
  source: "branch-name" | "dependency" | "ci" | "topic" | "fallback";
  score: number;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: boolean;
}

function parseVersion(value: string): ParsedVersion | null {
  const match = value.trim().match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?([^\s]*)/i);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    prerelease: Boolean(match[4]),
  };
}

function compareVersions(left: ParsedVersion, right: ParsedVersion): number {
  for (const key of ["major", "minor", "patch"] as const) {
    if (left[key] !== right[key]) return left[key] - right[key];
  }
  if (left.prerelease === right.prerelease) return 0;
  return left.prerelease ? -1 : 1;
}

function satisfiesConstraint(candidate: ParsedVersion, constraint: string): boolean {
  const token = constraint.trim();
  if (!token || token === "*") return true;

  const compatible = token.match(/^~=?\s*(.+)$/);
  if (compatible) {
    const version = parseVersion(compatible[1]);
    return version ? candidate.major === version.major : false;
  }

  const caret = token.match(/^\^\s*(.+)$/);
  if (caret) {
    const version = parseVersion(caret[1]);
    return version ? candidate.major === version.major : false;
  }

  const wildcard = token.match(/^(?:==?\s*)?v?(\d+)(?:\.\*)?$/);
  if (wildcard) return candidate.major === Number(wildcard[1]);

  const comparison = token.match(/^(>=|<=|>|<|==|=)\s*(.+)$/);
  if (!comparison) return true;
  const version = parseVersion(comparison[2]);
  if (!version) return true;

  const result = compareVersions(candidate, version);
  switch (comparison[1]) {
    case ">=": return result >= 0;
    case "<=": return result <= 0;
    case ">": return result > 0;
    case "<": return result < 0;
    default: return result === 0;
  }
}

export function parseFrappeDependencyVersions(
  requirement: string,
  allowedVersions: string[],
): string[] {
  const alternatives = requirement.split(/\s*\|\|\s*/).filter(Boolean);
  if (alternatives.length > 1) {
    const versions = new Set(
      alternatives.flatMap((item) =>
        parseFrappeDependencyVersions(item, allowedVersions)
      ),
    );
    return allowedVersions.filter((version) => versions.has(version));
  }

  const constraints = requirement
    .replace(/[()]/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (constraints.length === 0) return [];
  return allowedVersions.filter((version) => {
    const major = Number(version);
    if (!Number.isInteger(major)) return false;

    const candidates: ParsedVersion[] = [
      { major, minor: 0, patch: 0, prerelease: false },
      { major, minor: 999999, patch: 999999, prerelease: false },
    ];
    for (const constraint of constraints) {
      const parsed = parseVersion(constraint.replace(/^(?:>=|<=|>|<|==|=|~=?|\^)\s*/, ""));
      if (parsed?.major === major && !parsed.prerelease) candidates.push(parsed);
    }

    return candidates.some((candidate) =>
      constraints.every((constraint) => satisfiesConstraint(candidate, constraint))
    );
  });
}

export function extractDependencyFrappeVersions(
  pyproject: string,
  allowedVersions: string[],
): string[] {
  const versions = new Set<string>();
  const dependencyPattern = /^\s*frappe\s*=\s*(?:\{\s*version\s*=\s*)?["']([^"']+)["']/gm;
  const pep508Pattern = /["']frappe\s*([<>=~^!][^"']+)["']/gi;

  for (const match of pyproject.matchAll(dependencyPattern)) {
    for (const version of parseFrappeDependencyVersions(match[1], allowedVersions)) {
      versions.add(version);
    }
  }
  for (const match of pyproject.matchAll(pep508Pattern)) {
    for (const version of parseFrappeDependencyVersions(match[1], allowedVersions)) {
      versions.add(version);
    }
  }
  return allowedVersions.filter((version) => versions.has(version));
}

export function extractCiFrappeVersions(
  content: string,
  allowedVersions: string[],
): string[] {
  const versions = new Set<string>();
  const allowed = new Set(allowedVersions);
  const pattern = /(?:frappe[_ -]?branch|--frappe-branch|frappe_branch)[^\n]*?(?:version-|frappe-v?|v)(\d+)/gi;

  for (const match of content.matchAll(pattern)) {
    if (allowed.has(match[1])) versions.add(match[1]);
  }

  // Matrix declarations often put the key on one line and the values on the next.
  const matrixPattern = /frappe_branch\s*:\s*\[([^\]]+)\]/gi;
  for (const matrix of content.matchAll(matrixPattern)) {
    for (const match of matrix[1].matchAll(/(?:version-|frappe-v?|v)(\d+)/gi)) {
      if (allowed.has(match[1])) versions.add(match[1]);
    }
  }
  return allowedVersions.filter((version) => versions.has(version));
}

export function getFrappeVersionFromBranchName(
  branch: string,
  allowedVersions: string[],
): string | null {
  const match = branch.match(/^(?:version-|frappe-v?|v)(\d+)$/i);
  return match && allowedVersions.includes(match[1]) ? match[1] : null;
}

function branchPreference(branch: string, defaultBranch: string): number {
  const release = branch.match(/^(?:version-|v)(\d+)$/i);
  if (release) return 30 + Math.min(Number(release[1]), 19);
  if (branch === defaultBranch) return 25;
  if (branch === "main" || branch === "master") return 20;
  if (branch === "develop") return 0;
  return 10;
}

export function selectInstallBranches(
  evidence: BranchCompatibility[],
  allowedVersions: string[],
  defaultBranch: string,
): Record<string, string> {
  const selected: Record<string, { branch: string; score: number }> = {};

  for (const item of evidence) {
    const score = item.score + branchPreference(item.branch, defaultBranch);
    for (const version of item.versions) {
      if (!allowedVersions.includes(version)) continue;
      if (!selected[version] || score > selected[version].score) {
        selected[version] = { branch: item.branch, score };
      }
    }
  }

  return Object.fromEntries(
    allowedVersions
      .filter((version) => selected[version])
      .map((version) => [version, selected[version].branch]),
  );
}
