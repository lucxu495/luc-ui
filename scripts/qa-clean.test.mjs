/**
 * Regression test for `qa-clean.mjs`.
 *
 * The defect it locks down: `reports/` was listed as class B (transient) while
 * four `artifacts/reports/*.json` files are committed, so the sanctioned
 * cleanup would have deleted tracked files and left a dirty tree — the same
 * 236-file-diff failure the artifact classes exist to prevent.
 *
 *   pnpm qa:clean:test        # node --test scripts/qa-clean.test.mjs
 *
 * Each case builds its own throwaway Git repository under `os.tmpdir()`, so the
 * test never touches the real `luc-ui/artifacts`.
 */

import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { cleanArtifacts } from "./qa-clean.mjs";

const script = fileURLToPath(new URL("./qa-clean.mjs", import.meta.url));
const quiet = { log() {}, error() {} };
const REPORTS = ["behaviour.json", "changed.json", "full.json", "providers.json"];

function write(file, body = "x\n") {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, body);
}

/** A throwaway repo shaped like `luc-ui`: class-A content in tracked paths. */
function fixture(t) {
  const repo = mkdtempSync(path.join(os.tmpdir(), "qa-clean-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  const artifactRoot = path.join(repo, "artifacts");

  // class B, untracked → deletable
  write(path.join(artifactRoot, "screenshots", "nested", "shot.png"));
  write(path.join(artifactRoot, "qa-report.json"), "{}\n");
  // named like class B, but holds a tracked file → must be refused
  write(path.join(artifactRoot, "qa", "server-build.json"), "{}\n");
  // committed evidence → must survive
  for (const name of REPORTS) write(path.join(artifactRoot, "reports", name), "{}\n");
  write(path.join(artifactRoot, "baselines", "golden.png"));
  write(path.join(artifactRoot, "README.md"), "# artifacts\n");

  execFileSync("git", ["init", "-q"], { cwd: repo });
  execFileSync("git", ["add", "artifacts/qa", "artifacts/reports", "artifacts/baselines", "artifacts/README.md"], {
    cwd: repo,
  });

  return { repo, artifactRoot };
}

const reportPaths = (artifactRoot) => REPORTS.map((name) => path.join(artifactRoot, "reports", name));

test("tracked reports are never deleted", async (t) => {
  const { artifactRoot } = fixture(t);
  const summary = await cleanArtifacts({ artifactRoot, log: quiet });

  for (const file of reportPaths(artifactRoot)) {
    assert.ok(existsSync(file), `${path.basename(file)} must survive qa:clean`);
  }
  assert.ok(!summary.removed.includes("reports"));
  assert.ok(!summary.refused.includes("reports"), "reports is not a class-B target any more");
});

test("a class-B path holding tracked files is refused, not emptied", async (t) => {
  const { artifactRoot } = fixture(t);
  const summary = await cleanArtifacts({ artifactRoot, log: quiet });

  assert.ok(existsSync(path.join(artifactRoot, "qa", "server-build.json")));
  assert.ok(summary.refused.includes("qa"));
});

test("untracked class-B paths are still removed", async (t) => {
  const { artifactRoot } = fixture(t);
  const summary = await cleanArtifacts({ artifactRoot, log: quiet });

  assert.ok(!existsSync(path.join(artifactRoot, "screenshots")));
  assert.ok(!existsSync(path.join(artifactRoot, "qa-report.json")));
  assert.deepEqual([...summary.removed].sort(), ["qa-report.json", "screenshots"]);
  assert.equal(summary.files, 2);
});

test("baselines and the artifacts README are protected", async (t) => {
  const { artifactRoot } = fixture(t);
  await cleanArtifacts({ artifactRoot, log: quiet });

  assert.ok(existsSync(path.join(artifactRoot, "baselines", "golden.png")));
  assert.ok(existsSync(path.join(artifactRoot, "README.md")));
});

test("--dry-run reports without removing", async (t) => {
  const { artifactRoot } = fixture(t);
  const summary = await cleanArtifacts({ artifactRoot, dryRun: true, log: quiet });

  assert.ok(existsSync(path.join(artifactRoot, "screenshots", "nested", "shot.png")));
  assert.ok(summary.removed.includes("screenshots"));
});

test("the CLI refuses (exit 1) when a target holds tracked files", (t) => {
  const { artifactRoot } = fixture(t);
  const result = spawnSync(process.execPath, [script, "--root", artifactRoot], { encoding: "utf8" });

  assert.equal(result.status, 1);
  for (const file of reportPaths(artifactRoot)) assert.ok(existsSync(file));
  assert.match(result.stderr, /refused\s+:\s+qa /);
});

test("the CLI exits 0 once no class-B path holds tracked files", (t) => {
  const { artifactRoot } = fixture(t);
  rmSync(path.join(artifactRoot, "qa"), { recursive: true, force: true });
  const result = spawnSync(process.execPath, [script, "--root", artifactRoot, "--dry-run"], { encoding: "utf8" });

  assert.equal(result.status, 0);
  assert.match(result.stdout, /would remove : screenshots/);
});
