/**
 * Prune generated framework caches with a bound — nothing else.
 *
 * A local dev loop leaves two kinds of generated data behind:
 *
 *   `apps/showcase/.next/cache/**`       build cache (Turbopack/Next)
 *   `apps/showcase/.next/dev/**`          dev-server cache — this is the one that
 *                                        reached ~18 GiB and filled the disk
 *
 * Since CONCURRENCY-001 each development session may have its own output
 * directory (`LUC_NEXT_DIST_DIR`, see docs/DEV_MODE.md §7), so the two roots
 * above are discovered for *every* `.next*` directory under the app rather than
 * hardcoded to `.next`. The default session keeps the same two paths it always
 * had.
 *
 * Neither is source, neither is tracked, and both are regenerated on demand. But
 * they are also *reused* between runs, so they cannot be deleted behind a live
 * dev server's back: this command is explicit, refuses to touch anything with
 * tracked content beneath it, and reports what it removed so the bound stays
 * visible.
 *
 *   node scripts/cache-prune.mjs               # prune, printing sizes
 *   node scripts/cache-prune.mjs --dry-run     # report only
 *   node scripts/cache-prune.mjs --if-over=2048  # only when the cache exceeds N MiB
 *
 * It never touches: `artifacts/baselines/**` (committed pixels), anything under
 * `packages/**`, or any path outside the two cache roots below.
 */

import { execFile } from "node:child_process";
import { readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

/** The only paths this command may remove. All are generated and gitignored. */
export const CACHE_TARGETS = [
  "apps/showcase/.next/dev/cache",
  "apps/showcase/.next/dev",
  "apps/showcase/.next/cache",
];

/**
 * The output directories that belong to a Next.js session in the Showcase app.
 *
 * `.next` is the default session; `.next-a`, `.next-b` and the throwaway
 * `.next-qa-*` directories are the per-session ones. The pattern is deliberately
 * narrow — one level under `apps/showcase`, `.next` or `.next-<something>` — so
 * it can never reach a nested copy such as `.next/standalone/luc-ui/apps/showcase/.next`,
 * and it can never match a source directory.
 */
export const SESSION_DIR_PATTERN = /^\.next($|-)/;

/** Names (relative to `apps/showcase`) of the output directories that exist. */
export async function discoverSessionDirs(cacheRoot = root) {
  const appDir = path.join(cacheRoot, "apps/showcase");
  const entries = await readdir(appDir, { withFileTypes: true }).catch(() => []);
  return entries
    .filter((entry) => entry.isDirectory() && SESSION_DIR_PATTERN.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => (a === ".next" ? -1 : b === ".next" ? 1 : a.localeCompare(b)));
}

/**
 * The prunable cache roots for each session directory, in an order that removes
 * the nested path before its parent so a parent removal never hides a child that
 * is still accounted for.
 *
 * @param {string[]} sessionDirs
 */
export function cacheTargetsFor(sessionDirs) {
  const targets = [];
  for (const dir of sessionDirs) {
    const base = `apps/showcase/${dir}`;
    targets.push(`${base}/dev/cache`, `${base}/dev`, `${base}/cache`);
  }
  return targets;
}

export async function measure(target) {
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
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function trackedPresent(gitRoot, relative) {
  const { stdout } = await execFileAsync("git", ["-C", gitRoot, "ls-files", "-z", "--", relative], {
    maxBuffer: 64 * 1024 * 1024,
  });
  const present = [];
  for (const file of stdout.split("\0").filter(Boolean)) {
    if (await stat(path.join(gitRoot, file)).catch(() => undefined)) present.push(file);
  }
  return present;
}

/**
 * Prune the cache roots. Returns a summary so a test (or a caller) can assert on
 * what happened instead of scraping the log.
 */
export async function pruneCaches({
  cacheRoot = root,
  sessionDirs,
  dryRun = false,
  ifOverBytes = 0,
  log = console,
} = {}) {
  const summary = { removed: [], refused: [], files: 0, bytes: 0, seen: 0 };
  /*
   * The Git check runs against the same root the deletion targets resolve from —
   * a guard against a different checkout than the one being pruned would be
   * worse than no guard, because it would report "safe" for a directory it never
   * looked at.
   */
  const gitRoot = cacheRoot;
  /*
   * Discover rather than assume: an empty or brand-new checkout has no output
   * directories at all, and falling back to the default session keeps the
   * "nothing to prune yet" case printing the same thing it always did.
   */
  const discovered = sessionDirs ?? (await discoverSessionDirs(cacheRoot));
  const targets = cacheTargetsFor(discovered.length > 0 ? discovered : [".next"]);
  for (const relative of targets) {
    const target = path.join(cacheRoot, relative);
    /*
     * Existence, not emptiness, decides whether a target is in play: a nested
     * root such as `<session>/dev` still holds the directory its child cache
     * lived in after that child is removed, and leaving those behind would leave
     * an empty "session" for the guard to keep reporting.
     */
    if (!(await stat(target).catch(() => undefined))) continue;
    const { files, bytes } = await measure(target);
    summary.seen += bytes;
    if (bytes < ifOverBytes) {
      log.log(`  kept     : ${relative} (${human(bytes)}) — under the threshold`);
      continue;
    }
    let tracked;
    try {
      tracked = await trackedPresent(gitRoot, relative);
    } catch (error) {
      log.error(`  refused  : ${relative} — cannot confirm Git status (${String(error.message).trim()})`);
      summary.refused.push(relative);
      continue;
    }
    if (tracked.length > 0) {
      log.error(`  refused  : ${relative} — holds ${tracked.length} tracked file(s)`);
      summary.refused.push(relative);
      continue;
    }
    // A nested root may already be gone after its parent was pruned.
    if (!(await stat(target).catch(() => undefined))) continue;
    log.log(`  ${dryRun ? "would remove" : "removed  "} : ${relative} (${files} file(s), ${human(bytes)})`);
    summary.files += files;
    summary.bytes += bytes;
    summary.removed.push(relative);
    if (!dryRun) await rm(target, { recursive: true, force: true });
  }
  return summary;
}

async function cli(argv) {
  const dryRun = argv.includes("--dry-run");
  const ifOver = argv.find((value) => value.startsWith("--if-over="));
  const ifOverBytes = ifOver ? Number.parseInt(ifOver.slice("--if-over=".length), 10) * 1024 * 1024 : 0;
  console.log(`LUC UI — generated cache prune${dryRun ? " (dry run)" : ""}`);
  const sessionDirs = await discoverSessionDirs(root);
  console.log(`  sessions : ${sessionDirs.length > 0 ? sessionDirs.join(", ") : ".next (none present)"}`);
  const summary = await pruneCaches({ dryRun, ifOverBytes, sessionDirs });
  console.log(`  total    : ${summary.files} file(s), ${human(summary.bytes)} in ${summary.removed.length} target(s)`);
  if (summary.refused.length > 0) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await cli(process.argv.slice(2));
}
