/**
 * The dev-loop disk guard.
 *
 * The behaviour worth pinning is not the arithmetic — it is the two decisions
 * that make this tool safe to run automatically and to run by hand:
 *
 *   1. a dev server that is still alive **blocks** a prune, because deleting the
 *      cache underneath it corrupts the running session;
 *   2. a *stale* lock (the PID is gone, the server crashed) does **not** block
 *      anything, because refusing to clean up after a crash is the tool being
 *      wrong twice.
 *
 * A third: the free-space block is a real exit code, not a log line, so a build
 * command that chains it cannot start on a full disk.
 */

import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, describe, it } from "node:test";
import { promisify } from "node:util";
import {
  ancestry,
  DEV_CACHE_PATH,
  DEV_LOCK_PATH,
  directoryBytes,
  freeBytes,
  findStrayServers,
  inspect,
  processAlive,
  readDevServer,
  readSessionServer,
  readSessions,
  sessionLockPath,
  thresholds,
} from "./dev-guard.mjs";
import { CACHE_TARGETS } from "./cache-prune.mjs";

const run = promisify(execFile);
const HERE = path.dirname(new URL(import.meta.url).pathname);
const scratch = await mkdtemp(path.join(tmpdir(), "luc-dev-guard-"));
after(async () => {
  await rm(scratch, { recursive: true, force: true });
});

/** A throwaway checkout with a dev cache and whatever lock the case needs. */
async function scaffold(lock) {
  const root = path.join(scratch, `case-${Math.random().toString(36).slice(2)}`);
  for (const target of CACHE_TARGETS) {
    await mkdir(path.join(root, target), { recursive: true });
    await writeFile(path.join(root, target, "blob.bin"), "x".repeat(4096));
  }
  /*
   * A real (throwaway) Git repository: without one, the prune cannot confirm
   * that a target holds no tracked content and refuses to delete anything —
   * which is its own test, below, but not what these cases are about.
   */
  await run("git", ["init", "-q"], { cwd: root });
  if (lock !== undefined) {
    await mkdir(path.join(root, DEV_CACHE_PATH), { recursive: true });
    await writeFile(path.join(root, DEV_LOCK_PATH), JSON.stringify(lock));
  }
  return root;
}

describe("reading the state", () => {
  it("measures a directory instead of reporting a convenient zero", async () => {
    const root = await scaffold();
    const bytes = await directoryBytes(path.join(root, DEV_CACHE_PATH));
    assert.ok(bytes >= 4096, `expected the 4 KiB blob to be counted, got ${bytes}`);
    assert.equal(await directoryBytes(path.join(root, "does-not-exist")), 0);
  });

  it("reads free space from the volume that holds the checkout", async () => {
    const free = await freeBytes(scratch);
    assert.ok(free > 0, "a throwaway directory on a live volume has free space");
  });

  /*
   * CONCURRENCY-001 — the guard has to see *every* session, and it has to name
   * the one a live server owns, because that is the directory a prune must not
   * touch and the directory the user has to know about.
   */
  it("reports each session's cache separately and totals them", async () => {
    const root = await scaffold();
    await mkdir(path.join(root, "apps/showcase/.next-b/dev"), { recursive: true });
    await writeFile(path.join(root, "apps/showcase/.next-b/dev/blob.bin"), "y".repeat(8192));

    const { sessions, cacheBytes } = await inspect({ root, env: {}, strays: false });
    assert.deepEqual(
      sessions.map((session) => session.sessionDir),
      [".next", ".next-b"],
      "the default session is listed first, then the isolated ones",
    );
    const isolated = sessions.find((session) => session.sessionDir === ".next-b");
    assert.ok(isolated.cacheBytes >= 8192, "an isolated session's dev cache is measured");
    assert.equal(
      cacheBytes,
      sessions.reduce((total, session) => total + session.cacheBytes, 0),
      "the reported total is the sum of the sessions",
    );
  });

  it("finds the live server in whichever session owns it", async () => {
    const root = await scaffold();
    await mkdir(path.join(root, "apps/showcase/.next-a/dev"), { recursive: true });
    await writeFile(
      path.join(root, "apps/showcase/.next-a/dev/lock"),
      JSON.stringify({ pid: process.pid, port: 3459, appUrl: "http://localhost:3459" }),
    );
    const { server, servers } = await inspect({ root, env: {}, strays: false });
    assert.equal(server?.port, 3459);
    assert.equal(server?.sessionDir, ".next-a");
    assert.deepEqual(servers.map((entry) => entry.sessionDir), [".next-a"]);
    assert.equal(await readSessionServer(root, ".next"), undefined, "the default session has no lock");
  });

  it("reports the lock's server as running only while the process is alive", async () => {
    const alive = await scaffold({ pid: process.pid, port: 3457, appUrl: "http://localhost:3457" });
    const running = await readDevServer(alive);
    assert.equal(running?.alive, true);
    assert.equal(running?.port, 3457);

    /* PID 2^22 is above the default limit on every mainstream platform. */
    const dead = await scaffold({ pid: 4194304, port: 3457 });
    const gone = await readDevServer(dead);
    assert.equal(gone?.alive, false);
    assert.equal(gone?.stale, true, "a lock whose process is gone is stale, not running");

    const none = await scaffold();
    assert.equal(await readDevServer(none), undefined, "no lock at all is not a server");
  });

  it("never mistakes the current process for a dead one", async () => {
    assert.equal(processAlive(process.pid), true);
    assert.equal(processAlive(4194304), false);
    assert.equal(processAlive(1), false, "pid 1 is excluded on purpose: signalling it is never ours to do");
  });

  /*
   * A lockless dev server is the state a prune behind a live server leaves
   * behind, and the reason two servers can end up on one output directory. It
   * is found by pid, never killed, and never confused with a server that a lock
   * already accounts for.
   */
  it("only calls a dev server stray when it is in this checkout and unclaimed", async () => {
    const root = await scaffold();
    assert.deepEqual(
      await findStrayServers(root),
      [],
      "no dev server runs in a throwaway checkout, so nothing is stray there",
    );
    const running = await findStrayServers(HERE);
    assert.equal(
      running.some((entry) => entry.pid === process.pid),
      false,
      "the guard never reports itself",
    );
    assert.equal(
      running.some((entry) => entry.pid === 1),
      false,
      "and never pid 1",
    );
  });

  /*
   * The reason ancestry exists: a session's lock names the server process, but
   * the process matching "next dev" in the table is its parent wrapper. Without
   * walking up from the locked pid, every healthy session reports its own
   * launcher as an orphan.
   */
  it("walks up from the locked server, so its launcher is not mistaken for an orphan", async () => {
    const chain = await ancestry(process.pid);
    assert.equal(chain[0], process.ppid, "the nearest ancestor is the parent");
    assert.ok(chain.every((pid) => pid > 1), "init is never included: its pid is not ours to reason about");
    assert.deepEqual(await ancestry(1), [], "pid 1 has no ancestry worth reporting");
    assert.deepEqual(await ancestry(4194304), [], "a pid that does not exist yields nothing rather than throwing");
  });
});

describe("thresholds", () => {
  it("defaults to a bound that would have caught the 26 GiB cache", () => {
    const limits = thresholds({});
    assert.equal(limits.warnGb, 8);
    assert.equal(limits.minFreeGb, 20);
  });

  it("takes the machine's own numbers, and falls back when they are nonsense", () => {
    assert.deepEqual(thresholds({ LUC_DEV_CACHE_WARN_GB: "2", LUC_MIN_FREE_GB: "5" }), {
      warnGb: 2,
      minFreeGb: 5,
    });
    assert.deepEqual(thresholds({ LUC_DEV_CACHE_WARN_GB: "not-a-number" }), { warnGb: 8, minFreeGb: 20 });
  });
});

describe("the inspection", () => {
  it("warns about a cache over the limit and about a nearly full disk", async () => {
    const root = await scaffold();
    const { warnings } = await inspect({
      root,
      /* Zero-byte limits make both branches reachable on any machine. */
      env: { LUC_DEV_CACHE_WARN_GB: "0.000001", LUC_MIN_FREE_GB: "1000000" },
    });
    assert.equal(warnings.length, 2);
    assert.match(warnings.join("\n"), /dev cache/);
    assert.match(warnings.join("\n"), /free/);
  });

  it("says nothing when the cache is small and the disk is roomy", async () => {
    const root = await scaffold();
    /*
     * The free space is stated, not measured: this case is about the *default*
     * thresholds producing silence on a healthy checkout, and the machine
     * running the test is not part of that claim. Measuring it made the case
     * depend on the host — it failed on this Mac at 12.87 GiB free against the
     * 20 GiB minimum, which is the guard working correctly.
     */
    const { warnings } = await inspect({ root, env: {}, freeGb: 500 });
    assert.deepEqual(warnings, []);
  });
});

describe("the command line", () => {
  /*
   * `execFile` rejects on a non-zero exit, and the exit code is the point of
   * these cases — so the helper returns both shapes rather than letting a
   * refusal look like a crash.
   */
  const cli = async (...args) => {
    try {
      const { stdout, stderr } = await run("node", [path.join(HERE, "dev-guard.mjs"), ...args], { cwd: HERE });
      return { stdout, stderr, code: 0 };
    } catch (error) {
      return { stdout: error.stdout ?? "", stderr: error.stderr ?? "", code: error.code ?? 1 };
    }
  };

  /*
   * Both prune cases run against a throwaway checkout. Running them against the
   * real one used to make `pnpm qa:clean:test` delete the developer's live dev
   * cache, which is how a running session loses the lock that protects its
   * output directory (CONCURRENCY-001).
   */
  it("refuses to prune while a dev server is live, and names the pid", async () => {
    /* A lock this process wrote, naming a pid that is genuinely alive. */
    const root = await scaffold({ pid: process.pid, port: 3457, appUrl: "http://localhost:3457" });
    const { stdout, stderr, code } = await cli(`--root=${root}`, "--prune");
    const output = stdout + stderr;
    assert.equal(code, 1, "a live server must stop the prune rather than lose its cache");
    assert.match(output, /refused/, "a refusal explains itself");
    assert.match(output, /--stop-server/, "and offers the way forward");
    assert.match(output, new RegExp(`pid ${process.pid}`), "and names the server it is protecting");
    assert.notEqual(
      await stat(path.join(root, DEV_CACHE_PATH)).catch(() => null),
      null,
      "the cache behind the live server is still there",
    );
  });

  it("prunes once nothing is running, and says what it removed", async () => {
    const root = await scaffold();
    const { stdout, stderr, code } = await cli(`--root=${root}`, "--prune");
    assert.equal(code, 0);
    assert.match(stdout + stderr, /reclaimed/, "exit 0 means it pruned, so it must say what it removed");
    assert.equal(await stat(path.join(root, DEV_CACHE_PATH)).catch(() => null), null);
  });

  it("blocks a build below the free-space floor instead of starting it", async () => {
    const { stdout, stderr, code } = await cli("--require-free-gb=1000000");
    assert.equal(code, 1, "the block is an exit code, not a warning");
    assert.match(stdout + stderr, /BLOCKED/);
  });

  it("runs as a warning-free no-op when the thresholds are met", async () => {
    const { code } = await cli("--check");
    assert.equal(code, 0, "--check never fails a dev start; --strict is the gate");
  });
});
