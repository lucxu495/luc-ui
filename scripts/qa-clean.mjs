/**
 * Remove generated QA artifacts — and nothing else.
 *
 * Three artifact classes are deliberately kept apart:
 *
 *   A. baselines   `artifacts/baselines/**`        committed, pixel-diff truth
 *   B. transient   `artifacts/screenshots/**`      rewritten by every QA run
 *                  `artifacts/qa-report.json`      overwritten by every QA run
 *                  `artifacts/qa/**`               server markers, traces
 *                  `artifacts/pack/**`             `pnpm pack` scratch output
 *                  `artifacts/chart-review/**`     chart screenshot review output
 *   C. everything else in the repository
 *
 * Only class B is removed. Every target is an explicit path under
 * `luc-ui/artifacts`, resolved and re-checked against the artifact root before
 * deletion, so a bad flag or a symlink cannot reach outside it.
 *
 * Two guards stand in front of the deletion loop:
 *
 *   1. `PROTECTED` — the committed baselines and this directory's README.
 *   2. a Git check — a target that holds *any* tracked file, still on disk, is
 *      refused outright, so the cleaner can never delete something that lives in
 *      history. This is why `reports/` is not in the class-B list even though
 *      the class table once called it transient: four
 *      `artifacts/reports/*.json` files are committed, and a class-B entry that
 *      is really class A is exactly how the 236-file QA diff used to happen. A
 *      refusal is reported and sets a non-zero exit status; it never deletes
 *      part of a target.
 *
 *   node scripts/qa-clean.mjs            # remove class B
 *   node scripts/qa-clean.mjs --dry-run  # list what would go
 *   node scripts/qa-clean.mjs --keep-report
 *   node scripts/qa-clean.mjs --root DIR # clean another artifacts dir (tests)
 */

import { execFile } from "node:child_process";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const defaultArtifactRoot = path.join(root, "artifacts");

const TRANSIENT = [
  "screenshots",
  "qa",
  "pack",
  "chart-review",
  "qa-report.json",
  ".playwright",
  "playwright-report",
  "test-results",
];

/** The committed pixel-diff baselines. Never a deletion target. */
const PROTECTED = ["baselines", "README.md"];

async function measure(target) {
  const info = await stat(target).catch(() => undefined);
  if (!info) return { files: 0, bytes: 0 };
  if (info.isFile()) return { files: 1, bytes: info.size };
  let files = 0;
  let bytes = 0;
  for (const entry of await readdir(target, { withFileTypes: true })) {
    const nested = await measure(path.join(target, entry.name));
    files += nested.files;
    bytes += nested.bytes;
  }
  return { files, bytes };
}

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The Git-tracked files under `relative`, resolved from `artifactRoot`, that are
 * still present on disk — i.e. the tracked content a deletion here would
 * actually destroy. Empty when the path is untracked, or when every tracked
 * file below it is already gone from the worktree. Throws when Git cannot
 * answer, and the caller then refuses the target: "could not check" must never
 * be read as "safe to delete".
 */
async function trackedFiles(artifactRoot, relative) {
  const { stdout } = await execFileAsync("git", ["-C", artifactRoot, "ls-files", "-z", "--", relative], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const tracked = stdout.split("\0").filter(Boolean);
  const present = [];
  for (const file of tracked) {
    if (await stat(path.join(artifactRoot, file)).catch(() => undefined)) present.push(file);
  }
  return present;
}

/**
 * Remove the class-B paths under `artifactRoot`. Returns a summary so a caller
 * (the CLI, or a test) can assert on what happened.
 */
export async function cleanArtifacts({
  artifactRoot = defaultArtifactRoot,
  dryRun = false,
  keepReport = false,
  log = console,
} = {}) {
  const targets = TRANSIENT.filter((entry) => !(keepReport && entry === "qa-report.json"));
  const rootWithSep = artifactRoot.endsWith(path.sep) ? artifactRoot : artifactRoot + path.sep;
  const summary = { removed: [], refused: [], files: 0, bytes: 0 };

  log.log(`LUC UI — QA artifact cleanup${dryRun ? " (dry run)" : ""}`);
  log.log(`  root        : ${artifactRoot}`);

  for (const relative of targets) {
    const target = path.resolve(artifactRoot, relative);
    // Resolve first, then assert containment: a traversal or symlink cannot win.
    if (!target.startsWith(rootWithSep)) {
      log.error(`  refused     : ${relative} resolves outside the artifact root`);
      summary.refused.push(relative);
      continue;
    }
    if (PROTECTED.includes(relative)) {
      log.error(`  refused     : ${relative} is a protected baseline`);
      summary.refused.push(relative);
      continue;
    }
    let tracked;
    try {
      tracked = await trackedFiles(artifactRoot, relative);
    } catch (error) {
      log.error(`  refused     : ${relative} — cannot confirm Git status (${String(error.message).trim()})`);
      summary.refused.push(relative);
      continue;
    }
    if (tracked.length > 0) {
      log.error(`  refused     : ${relative} holds ${tracked.length} tracked file(s)`);
      for (const file of tracked.slice(0, 5)) log.error(`                ${file}`);
      if (tracked.length > 5) log.error(`                … and ${tracked.length - 5} more`);
      summary.refused.push(relative);
      continue;
    }
    const { files, bytes } = await measure(target);
    if (files === 0) continue;
    log.log(`  ${dryRun ? "would remove" : "removed    "} : ${relative} (${files} file(s), ${human(bytes)})`);
    summary.files += files;
    summary.bytes += bytes;
    summary.removed.push(relative);
    if (!dryRun) await rm(target, { recursive: true, force: true });
  }

  log.log(`  total       : ${summary.files} file(s), ${human(summary.bytes)}`);
  log.log(
    `  kept        : ${PROTECTED.join(", ")}${keepReport ? ", qa-report.json" : ""} (committed baselines and the artifact README)`,
  );
  /*
   * Generated *framework* caches are a separate class from QA artifacts and are
   * deliberately not removed here (a running dev server reuses them; deleting
   * behind its back corrupts the session). The size is reported so an unbounded
   * cache is visible while cleaning, and `pnpm cache:prune` removes it with a
   * bound when the dev server is stopped.
   */
  const cacheBytes = await generatedCacheBytes();
  if (cacheBytes > 0) {
    log.log(`  generated caches : ${human(cacheBytes)} — \`pnpm cache:prune\` (stop the dev server first)`);
  }
  if (summary.refused.length > 0) {
    log.log(`  refused     : ${summary.refused.join(", ")} — tracked content is never deleted`);
  }
  return summary;
}

/** Size of the generated framework caches, for the report line above. */
async function generatedCacheBytes() {
  let total = 0;
  for (const target of ["apps/showcase/.next/cache", "apps/showcase/.next/dev"]) {
    const { bytes } = await measure(path.join(root, target));
    total += bytes;
  }
  return total;
}

async function cli(argv) {
  const rootFlag = argv.indexOf("--root");
  let artifactRoot = defaultArtifactRoot;
  if (rootFlag !== -1) {
    const value = argv[rootFlag + 1];
    if (!value || value.startsWith("--")) {
      console.error("--root needs a directory");
      process.exitCode = 2;
      return;
    }
    artifactRoot = path.resolve(value);
  }
  const summary = await cleanArtifacts({
    artifactRoot,
    dryRun: argv.includes("--dry-run"),
    keepReport: argv.includes("--keep-report"),
  });
  if (summary.refused.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await cli(process.argv.slice(2));
}
