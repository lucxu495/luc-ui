/**
 * Generated-cache lifecycle.
 *
 * The ~18 GiB Turbopack dev cache is what made this necessary: a daily UI dev
 * loop must not be able to fill the disk, but the prune also must not be able to
 * delete anything that is not a generated cache — in particular not committed
 * baselines, and not anything Git tracks.
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { promisify } from "node:util";
import { CACHE_TARGETS, cacheTargetsFor, discoverSessionDirs, measure, pruneCaches } from "./cache-prune.mjs";

const run = promisify(execFile);
const scratch = await mkdtemp(path.join(tmpdir(), "luc-cache-prune-"));
after(async () => {
  await rm(scratch, { recursive: true, force: true });
});

const silent = { log() {}, error() {} };

/**
 * A fake **checkout**: the cache roots plus a baseline, inside a real (throwaway)
 * Git repository so the safety check runs the same code path it runs in the
 * monorepo.
 */
async function scaffold({ git = true } = {}) {
  const root = path.join(scratch, `case-${Math.random().toString(36).slice(2)}`);
  for (const target of CACHE_TARGETS) {
    await mkdir(path.join(root, target), { recursive: true });
    await writeFile(path.join(root, target, "blob.bin"), "x".repeat(2048));
  }
  await mkdir(path.join(root, "artifacts/baselines"), { recursive: true });
  await writeFile(path.join(root, "artifacts/baselines/golden.png"), "golden");
  if (git) await run("git", ["init", "-q"], { cwd: root });
  return root;
}

describe("generated cache prune", () => {
  /*
   * CONCURRENCY-001 — the prune has to cover every development session, not
   * just the default one, or an isolated session's cache is invisible to the
   * guard that exists to bound it.
   */
  it("discovers each session's output directory, and only those", async () => {
    const root = await scaffold();
    for (const dir of [".next-a", ".next-b", ".next-qa-c"]) {
      await mkdir(path.join(root, "apps/showcase", dir, "dev"), { recursive: true });
      await writeFile(path.join(root, "apps/showcase", dir, "dev", "blob.bin"), "x".repeat(1024));
    }
    /* Neither a nested standalone copy nor a source directory is a session. */
    await mkdir(path.join(root, "apps/showcase/.next/standalone/apps/showcase/.next"), { recursive: true });
    await mkdir(path.join(root, "apps/showcase/nextish"), { recursive: true });

    const found = await discoverSessionDirs(root);
    assert.deepEqual(found, [".next", ".next-a", ".next-b", ".next-qa-c"]);
    assert.deepEqual(cacheTargetsFor([".next-a"]), [
      "apps/showcase/.next-a/dev/cache",
      "apps/showcase/.next-a/dev",
      "apps/showcase/.next-a/cache",
    ]);
  });

  it("prunes a session that is not the default one", async () => {
    const root = await scaffold();
    await mkdir(path.join(root, "apps/showcase/.next-b/dev/cache"), { recursive: true });
    await writeFile(path.join(root, "apps/showcase/.next-b/dev/cache/blob.bin"), "x".repeat(2048));
    const summary = await pruneCaches({ cacheRoot: root, log: silent });
    assert.ok(
      summary.removed.some((target) => target.startsWith("apps/showcase/.next-b/")),
      `expected the isolated session to be pruned, removed: ${summary.removed.join(", ")}`,
    );
    assert.equal(await stat(path.join(root, "apps/showcase/.next-b/dev")).catch(() => null), null);
  });

  it("removes only the generated cache roots", async () => {
    const root = await scaffold();
    const summary = await pruneCaches({ cacheRoot: root, log: silent });
    assert.ok(summary.removed.length >= 1);
    assert.equal(summary.refused.length, 0);
    assert.equal(await stat(path.join(root, "apps/showcase/.next/cache")).catch(() => null), null);
    // The committed baseline is untouched, and so is anything else.
    assert.equal(await readFile(path.join(root, "artifacts/baselines/golden.png"), "utf8"), "golden");
  });

  it("honours the size threshold so a healthy loop is not interrupted", async () => {
    const root = await scaffold();
    const summary = await pruneCaches({ cacheRoot: root, ifOverBytes: 1024 * 1024 * 1024, log: silent });
    assert.equal(summary.removed.length, 0);
    assert.ok(summary.seen > 0);
    assert.notEqual(await stat(path.join(root, "apps/showcase/.next/cache")).catch(() => null), null);
  });

  it("is a report, not a deletion, in dry-run mode", async () => {
    const root = await scaffold();
    const summary = await pruneCaches({ cacheRoot: root, dryRun: true, log: silent });
    assert.ok(summary.removed.length >= 1);
    assert.notEqual(await stat(path.join(root, "apps/showcase/.next/cache")).catch(() => null), null);
  });

  it("measures a directory and reports zero for a missing path", async () => {
    const root = await scaffold();
    assert.deepEqual(await measure(path.join(root, "nope")), { files: 0, bytes: 0 });
    const nested = await measure(path.join(root, "apps/showcase/.next"));
    assert.ok(nested.files >= 3);
  });

  it("refuses when the Git status cannot be confirmed", async () => {
    // Outside a repository there is no way to prove a target holds no tracked
    // content, and "could not check" must never be read as "safe to delete".
    const root = await scaffold({ git: false });
    const summary = await pruneCaches({ cacheRoot: root, log: silent });
    assert.equal(summary.removed.length, 0);
    assert.equal(summary.refused.length, CACHE_TARGETS.length);
    assert.notEqual(await stat(path.join(root, "apps/showcase/.next/cache")).catch(() => null), null);
  });
});
