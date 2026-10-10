import assert from "node:assert/strict";
import test from "node:test";
import {
  addDevelopInstallBranch,
  extractCiFrappeVersions,
  extractDependencyFrappeVersions,
  getFrappeVersionFromBranchName,
  parseFrappeDependencyVersions,
  selectInstallBranches,
} from "./frappe-compat.js";

const supported = ["14", "15", "16", "17"];

test("parses Frappe dependency ranges by stable major", () => {
  assert.deepEqual(parseFrappeDependencyVersions(">=15.109.0,<17.0.0", supported), ["15", "16"]);
  assert.deepEqual(parseFrappeDependencyVersions(">=15.0.0,<17.0.0", supported), ["15", "16"]);
  assert.deepEqual(parseFrappeDependencyVersions(">=16.0.0-dev,<=17.0.0-dev", supported), ["16"]);
  assert.deepEqual(parseFrappeDependencyVersions("~=15.0", supported), ["15"]);
  assert.deepEqual(parseFrappeDependencyVersions("~15.0", supported), ["15"]);
  assert.deepEqual(parseFrappeDependencyVersions("^16.0.0", supported), ["16"]);
  assert.deepEqual(
    parseFrappeDependencyVersions(">=14,<15 || >=16,<17", supported),
    ["14", "16"],
  );
});

test("extracts only the Frappe dependency, not the app package version", () => {
  const pyproject = `
[project]
version = "3.2.0"
[tool.bench.frappe-dependencies]
frappe = ">=15.0.0,<17.0.0"
`;
  assert.deepEqual(extractDependencyFrappeVersions(pyproject, supported), ["15", "16"]);
  assert.deepEqual(
    extractDependencyFrappeVersions(`[project]\ndependencies = ["frappe>=14,<16"]`, supported),
    ["14", "15"],
  );
});

test("recognizes Frappe versions declared in CI", () => {
  const workflow = `
strategy:
  matrix:
    frappe_branch: [version-15, version-16]
run: bench init --frappe-branch version-14 frappe-bench
`;
  assert.deepEqual(extractCiFrappeVersions(workflow, supported), ["14", "15", "16"]);
});

test("does not interpret app release branch version-3 as Frappe 3", () => {
  assert.equal(getFrappeVersionFromBranchName("version-3", supported), null);
  assert.equal(getFrappeVersionFromBranchName("version-15", supported), "15");
});

test("prefers explicit Frappe branches, then stable evidenced branches", () => {
  const selected = selectInstallBranches([
    { branch: "version-14", versions: ["14"], source: "branch-name", score: 100 },
    { branch: "main", versions: ["15", "16"], source: "dependency", score: 80 },
    { branch: "develop", versions: ["16"], source: "dependency", score: 80 },
  ], supported, "main");

  assert.deepEqual(selected, {
    "14": "version-14",
    "15": "main",
    "16": "main",
  });
});

test("can map an app release branch from its CI compatibility matrix", () => {
  const selected = selectInstallBranches([
    { branch: "version-3", versions: ["15", "16"], source: "ci", score: 60 },
    { branch: "develop", versions: ["15", "16"], source: "ci", score: 60 },
  ], supported, "main");

  assert.deepEqual(selected, {
    "15": "version-3",
    "16": "version-3",
  });
});

test("prefers the newest compatible app release branch", () => {
  const selected = selectInstallBranches([
    { branch: "version-2", versions: ["15"], source: "dependency", score: 80 },
    { branch: "version-3", versions: ["15"], source: "dependency", score: 80 },
  ], supported, "develop");

  assert.deepEqual(selected, { "15": "version-3" });
});

test("maps Frappe develop to the app develop branch when available", () => {
  assert.deepEqual(
    addDevelopInstallBranch({ "16": "version-16" }, ["main", "develop"], "main"),
    { "16": "version-16", develop: "develop" },
  );
});

test("falls back to a stable branch for Frappe develop", () => {
  assert.deepEqual(
    addDevelopInstallBranch({ "16": "version-16" }, ["main", "version-16"], "trunk"),
    { "16": "version-16", develop: "main" },
  );
  assert.deepEqual(
    addDevelopInstallBranch({ "16": "version-16" }, [], "trunk"),
    { "16": "version-16", develop: "trunk" },
  );
});
