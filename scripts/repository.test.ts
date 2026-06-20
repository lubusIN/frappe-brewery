import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseRepoUrl } from "./extract.js";
import { getSafePipAuditArgs } from "./lint-app.js";

test("parses canonical GitHub repository URLs", () => {
  assert.deepEqual(parseRepoUrl("https://github.com/frappe/erpnext"), {
    owner: "frappe",
    repo: "erpnext",
  });
  assert.deepEqual(parseRepoUrl("https://github.com/frappe/frappe.git/"), {
    owner: "frappe",
    repo: "frappe",
  });
});

test("rejects non-repository and option-like URLs", () => {
  for (const url of [
    "file:///tmp/app",
    "https://example.com/frappe/erpnext",
    "https://github.com/frappe/erpnext/issues",
    "https://github.com/frappe/erpnext?tab=readme",
    "https://github.com/--upload-pack=touch%20/tmp/pwned/repo",
  ]) {
    assert.throws(() => parseRepoUrl(url), /Invalid GitHub URL/);
  }
});

test("audits only dependency inputs that do not require pip resolution", () => {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), "brewery-audit-test-"),
  );
  try {
    fs.writeFileSync(
      path.join(directory, "requirements.txt"),
      "frappe==15.0.0\nrequests>=2\n",
    );
    assert.equal(getSafePipAuditArgs(directory), null);

    fs.writeFileSync(
      path.join(directory, "requirements.txt"),
      "frappe==15.0.0\nrequests==2.32.4\n",
    );
    assert.deepEqual(getSafePipAuditArgs(directory), [
      "--requirement",
      path.join(directory, "requirements.txt"),
      "--no-deps",
      "--disable-pip",
    ]);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
