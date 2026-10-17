/**
 * The dev-loop disk guard.
 *
 * Why this exists, in one paragraph: Turbopack's persistent dev cache
 * (`apps/showcase/.next/dev`) reached ~40 GiB once and left this Mac with 5.35
 * GiB free; after the emergency cleanup it climbed back to 26 GiB within days.
 * The prune command (`cache-prune.mjs`) already knew how to delete the cache
 * *safely*; what was missing was anything that noticed the growth before the
 * disk was full, and anything that stopped a prune from deleting a cache a live
 * dev server was still writing into.
 *
 * So this is a guard, not a daemon and not a second cleaner:
 *
 *   --check             (default) report free space and the dev-cache size,
 *                       warn past the thresholds, exit 0. Cheap enough to run
 *                       in front of `dev`.
 *   --strict            same, but a warning is a non-zero exit — for the gate.
 *   --require-free-gb=N fail before an expensive build rather than during it.
 *   --prune             delete the generated caches, **refusing** while a dev
 *                       server is live, then delegate to `cache-prune.mjs` so
 *                       the Git and target guards are not re-implemented here.
 *
 * Three facts it reads, and none of them needs a new daemon:
 *
 *   - **Free space** from `statfs` on the repository's own volume.
 *   - **The cache size** of every session, from `du -sk`, which is the OS's own
 *     accounting and answers in ~0.1s on a 26 GiB tree; a recursive `readdir`
 *     walk would take seconds and would itself hold up the dev start it is
 *     guarding.
 *   - **Whether a dev server is live** from the lock file Next writes at
 *     `<session>/dev/lock` (`{pid, port, appUrl}`), cross-checked against the
 *     process table, so a lock left behind by a crashed server does not block a
 *     cleanup forever and a live one is never deleted behind.
 *   - **Whether a lockless dev server exists** (`findStrayServers`): a process
 *     serving this checkout with no lock claiming it. That is the state a prune
 *     *behind a live server* leaves behind, and it is what lets two servers end
 *     up on one output directory — CONCURRENCY-001. Reported, never killed
 *     silently, because it may be somebody's browser session.
 *
 * Since CONCURRENCY-001 a checkout may hold several sessions at once
 * (`apps/showcase/.next`, `.next-a`, `.next-b`, …). All of them are measured and
 * reported; a prune covers all of them. The lock check is per session, so an
 * isolated session never blocks or is blocked by another.
 *
 *   node scripts/dev-guard.mjs                       # report, warn, exit 0
 *   node scripts/dev-guard.mjs --strict              # warn is a failure
 *   node scripts/dev-guard.mjs --prune               # refuses if a server is live
 *   node scripts/dev-guard.mjs --prune --stop-server # stops that PID, then prunes
 *   node scripts/dev-guard.mjs --root=<checkout>     # measure a different checkout
 *
 * `--root` exists for the guard's own tests. It is the difference between a test
 * that asserts the refusal and a test that *performs* the deletion: until this
 * flag existed, `pnpm qa:clean:test` pruned the developer's real dev cache as a
 * side effect of running, which is precisely how a live session loses the lock
 * that protects it.
 *
 * Thresholds are configurable, because "too big" is a property of the machine:
 * `LUC_DEV_CACHE_WARN_GB` (default 8) and `LUC_MIN_FREE_GB` (default 20).
 */

import { execFile } from "node:child_process";
import { readFile, stat, statfs } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { discoverSessionDirs, pruneCaches } from "./cache-prune.mjs";

const execFileAsync = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
export const defaultRoot = path.resolve(here, "..");

/** The generated dev cache, and the lock Next writes beside it while running. */
export const DEV_CACHE_PATH = "apps/showcase/.next/dev";
export const DEV_LOCK_PATH = "apps/showcase/.next/dev/lock";
export const APP_DIR = "apps/showcase";
/** Where a session's dev-server lock lives, for any output directory. */
export function sessionLockPath(sessionDir) {
  return `${APP_DIR}/${sessionDir}/dev/lock`;
}

const GIB = 1024 ** 3;

function human(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < GIB) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / GIB).toFixed(2)} GiB`;
}

/** Free bytes on the volume that holds `target`. */
export async function freeBytes(target) {
  const info = await statfs(target);
  return Number(info.bavail) * Number(info.bsize);
}

/**
 * The size of a directory, from `du`.
 *
 * Falls back to a recursive walk only if `du` is unavailable, so a caller never
 * gets a silent zero — "0 bytes" would read as "nothing to worry about".
 */
export async function directoryBytes(target) {
  if (!(await stat(target).catch(() => undefined))) return 0;
  try {
    const { stdout } = await execFileAsync("du", ["-sk", target], { maxBuffer: 1024 * 1024 });
    const kib = Number.parseInt(stdout.trim().split(/\s+/)[0] ?? "", 10);
    if (Number.isFinite(kib)) return kib * 1024;
  } catch {
    /* fall through to the walk */
  }
  const { readdir } = await import("node:fs/promises");
  const walk = async (dir) => {
    let total = 0;
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const nested = path.join(dir, entry.name);
      if (entry.isDirectory()) total += await walk(nested);
      else total += (await stat(nested).catch(() => ({ size: 0 }))).size;
    }
    return total;
  };
  return walk(target);
}

/** Is a process with this id alive? `kill(pid, 0)` is the portable probe. */
export function processAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    /* EPERM means it exists but belongs to someone else — still alive. */
    return error?.code === "EPERM";
  }
}

/**
 * The dev server Next says is running, if it still is.
 *
 * A lock whose PID is gone is reported as `stale` rather than as a server: that
 * is the crashed-process case, and refusing to clean up after it would be the
 * tool being wrong twice.
 */
export async function readDevServer(root = defaultRoot) {
  return readSessionServer(root, ".next");
}

/**
 * The dev server holding one session's output directory, if it still runs.
 *
 * @param {string} root
 * @param {string} sessionDir `.next`, `.next-a`, …
 */
export async function readSessionServer(root, sessionDir) {
  const lockPath = path.join(root, sessionLockPath(sessionDir));
  const raw = await readFile(lockPath, "utf8").catch(() => undefined);
  if (raw === undefined) return undefined;
  let lock;
  try {
    lock = JSON.parse(raw);
  } catch {
    return { pid: undefined, port: undefined, alive: false, stale: true, lockPath };
  }
  const alive = processAlive(Number(lock.pid));
  return {
    sessionDir,
    pid: Number(lock.pid),
    port: Number(lock.port),
    appUrl: typeof lock.appUrl === "string" ? lock.appUrl : undefined,
    alive,
    stale: !alive,
    lockPath,
  };
}

/**
 * Every session in the checkout, with its dev-cache size and its lock.
 *
 * Sessions are discovered from the filesystem rather than from a fixed list, so
 * a session that has never run yet, a throwaway `.next-qa-*` directory from the
 * isolation probe, and an unfamiliar name some other tool chose all behave the
 * same way. `.next` is always included even when it does not exist yet, because
 * that is the directory `pnpm dev` and the production build create.
 */
export async function readSessions(root = defaultRoot) {
  const discovered = await discoverSessionDirs(root);
  const dirs = discovered.includes(".next") ? discovered : [".next", ...discovered];
  return Promise.all(
    dirs.map(async (sessionDir) => ({
      sessionDir,
      relPath: `${APP_DIR}/${sessionDir}`,
      cacheBytes: await directoryBytes(path.join(root, APP_DIR, sessionDir, "dev")),
      outputBytes: await directoryBytes(path.join(root, APP_DIR, sessionDir)),
      server: await readSessionServer(root, sessionDir),
    })),
  );
}

/**
 * A dev server that is running but owns no lock — an orphan from a session that
 * was killed with SIGKILL, or one whose output directory was cleaned while it
 * was live.
 *
 * This matters because it is the case `next dev`'s own lock cannot catch: the
 * lock is a file *inside* the directory the disk guard prunes, so deleting it
 * behind a live server leaves that server writing into an output directory the
 * next `next dev` will happily adopt. That pairing is CONCURRENCY-001.
 *
 * Detection is deliberately conservative — a process named `next-server` (or a
 * `next dev` command line) whose working directory is this checkout's Showcase
 * app — so a dev server for another project is never reported as ours.
 */
export async function findStrayServers(root = defaultRoot, knownPids = []) {
  /*
   * A session's lock names the server process, not the `pnpm dev` / `next dev`
   * wrapper that launched it. Both match the command pattern, so the wrapper has
   * to be accounted for through its child — otherwise every healthy session
   * reports its own parent as an orphan and the warning becomes noise nobody
   * reads.
   */
  const accounted = new Set([process.pid, ...knownPids]);
  for (const pid of knownPids) {
    for (const ancestor of await ancestry(pid)) accounted.add(ancestor);
  }
  const { stdout } = await execFileAsync("ps", ["-eo", "pid=,command="], { maxBuffer: 8 * 1024 * 1024 }).catch(
    () => ({ stdout: "" }),
  );
  const candidates = [];
  for (const line of stdout.split("\n")) {
    const match = /^\s*(\d+)\s+(.*)$/.exec(line);
    if (!match) continue;
    const pid = Number(match[1]);
    const command = match[2];
    if (accounted.has(pid)) continue;
    if (!/\bnext-server\b|\bnext dev\b|next\/dist\/bin\/next/.test(command)) continue;
    candidates.push({ pid, command: command.trim().slice(0, 120) });
  }
  const appDir = path.join(root, APP_DIR);
  const strays = [];
  for (const candidate of candidates) {
    if (!(await processCwd(candidate.pid))?.startsWith(appDir)) continue;
    strays.push({ ...candidate, cwd: appDir });
  }
  return strays;
}

/** The parent chain of a pid, nearest first, stopping before init. */
export async function ancestry(pid, depth = 4) {
  const chain = [];
  let current = pid;
  for (let step = 0; step < depth && Number.isInteger(current) && current > 1; step += 1) {
    const { stdout } = await execFileAsync("ps", ["-o", "ppid=", "-p", String(current)], {
      maxBuffer: 64 * 1024,
    }).catch(() => ({ stdout: "" }));
    const ppid = Number.parseInt(stdout.trim(), 10);
    if (!Number.isFinite(ppid) || ppid <= 1) break;
    chain.push(ppid);
    current = ppid;
  }
  return chain;
}

/** The working directory of a pid, or `undefined` when it cannot be read. */
async function processCwd(pid) {
  const { stdout } = await execFileAsync("lsof", ["-a", "-p", String(pid), "-d", "cwd", "-Fn"], {
    maxBuffer: 1024 * 1024,
  }).catch(() => ({ stdout: "" }));
  const line = stdout.split("\n").find((entry) => entry.startsWith("n/"));
  return line?.slice(1);
}

/**
 * `warnGb` is where a dev cache is worth telling the reader about; `minFreeGb`
 * is the floor below which an expensive build should not be started.
 *
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ warnGb: number, minFreeGb: number }}
 */
export function thresholds(env = process.env) {
  const warnGb = Number.parseFloat(env.LUC_DEV_CACHE_WARN_GB ?? "8");
  const minFreeGb = Number.parseFloat(env.LUC_MIN_FREE_GB ?? "20");
  return {
    warnGb: Number.isFinite(warnGb) ? warnGb : 8,
    minFreeGb: Number.isFinite(minFreeGb) ? minFreeGb : 20,
  };
}

/** Everything the CLI prints, as data — so a test can assert without scraping. */
/**
 * @param {object} [options]
 * @param {string} [options.root] measured checkout; its volume supplies free space
 * @param {NodeJS.ProcessEnv} [options.env] source of the two thresholds
 * @param {boolean} [options.strays] also look for lockless dev servers
 * @param {number} [options.freeGb] free space to reason about, in GiB, instead
 *   of measuring it. The guard's own tests use this: "a roomy disk produces no
 *   warning" is a statement about the guard, and it has to hold on a machine
 *   that is nearly full as well as on one that is empty. Asserting it against
 *   whatever `statfs` reports made the test fail on a full CI/dev box for a
 *   reason that had nothing to do with the code under test (measured
 *   2026-10-17: 12.87 GiB free against a 20 GiB minimum).
 */
export async function inspect({ root = defaultRoot, env = process.env, strays = true, freeGb } = {}) {
  const limits = thresholds(env);
  const sessions = await readSessions(root);
  const cacheBytes = sessions.reduce((total, session) => total + session.cacheBytes, 0);
  const free = freeGb === undefined ? await freeBytes(root) : freeGb * GIB;
  const servers = sessions.map((session) => session.server).filter((server) => server?.alive);
  /* The first live server, for callers that only need to know one exists. */
  const server = servers[0];
  const strayServers = strays ? await findStrayServers(root, servers.map((entry) => entry.pid)) : [];
  const warnings = [];
  if (cacheBytes >= limits.warnGb * GIB) {
    warnings.push(
      `dev cache is ${human(cacheBytes)} across ${sessions.length} session(s) (limit ${limits.warnGb} GiB) — \`pnpm cache:prune:safe\` reclaims it once no dev server is running`,
    );
  }
  if (free < limits.minFreeGb * GIB) {
    warnings.push(`only ${human(free)} free (minimum ${limits.minFreeGb} GiB) — clean caches before the next build`);
  }
  return { cacheBytes, free, server, servers, sessions, strays: strayServers, limits, warnings };
}

async function stopServer(server, log) {
  if (!server?.alive || server.pid === undefined) return false;
  log.log(`  stopping  : dev server pid ${server.pid}${server.port ? ` on port ${server.port}` : ""}`);
  try {
    process.kill(server.pid, "SIGTERM");
  } catch (error) {
    log.error(`  refused   : could not signal pid ${server.pid} (${String(error.message).trim()})`);
    return false;
  }
  /* Give it a moment to release the lock and flush; then confirm. */
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (!processAlive(server.pid)) return true;
  }
  log.error(`  refused   : pid ${server.pid} is still alive after SIGTERM`);
  return false;
}

async function cli(argv, log = console) {
  const rootArg = argv.find((value) => value.startsWith("--root="));
  const rootInline = rootArg?.slice("--root=".length);
  const rootIndex = argv.indexOf("--root");
  const root = path.resolve(
    rootInline ?? (rootIndex >= 0 && argv[rootIndex + 1] ? argv[rootIndex + 1] : defaultRoot),
  );
  const state = await inspect({ root });
  const requireFree = argv.find((value) => value.startsWith("--require-free-gb="));
  const wantPrune = argv.includes("--prune");
  const strict = argv.includes("--strict") || requireFree !== undefined;

  log.log("LUC UI — dev cache guard");
  if (root !== defaultRoot) log.log(`  checkout  : ${root}`);
  log.log(`  free space: ${human(state.free)}`);
  log.log(`  dev cache : ${human(state.cacheBytes)} across ${state.sessions.length} session(s)`);
  for (const session of state.sessions) {
    const where = `${APP_DIR}/${session.sessionDir}`;
    const server = session.server;
    const status = server?.alive
      ? `running (pid ${server.pid}${server.port ? `, port ${server.port}` : ""})`
      : server
        ? "stale lock"
        : "not running";
    log.log(`    ${session.sessionDir.padEnd(12)} ${human(session.cacheBytes).padStart(9)}  ${status}  (${where})`);
  }
  for (const stray of state.strays) {
    log.error(`  stray     : pid ${stray.pid} — ${stray.command}`);
    log.error("             no lock file claims it; it shares this checkout's output directories");
  }
  if (state.sessions.every((session) => !session.server?.alive) && state.strays.length === 0) {
    log.log("  dev server: none running");
  }

  if (requireFree !== undefined) {
    const wanted = Number.parseFloat(requireFree.slice("--require-free-gb=".length));
    if (Number.isFinite(wanted) && state.free < wanted * GIB) {
      log.error(`  BLOCKED   : ${human(state.free)} free, ${wanted} GiB required before this build`);
      log.error("             free space with `pnpm qa:clean` and `pnpm cache:prune:safe`");
      return 1;
    }
  }

  for (const warning of state.warnings) log.log(`  warning   : ${warning}`);
  if (state.strays.length > 0) {
    log.log(
      `  warning   : ${state.strays.length} lockless dev server(s) in ${APP_DIR} — the cache they may hold is not covered by a lock`,
    );
  }

  if (!wantPrune) return strict && state.warnings.length + state.strays.length > 0 ? 1 : 0;

  if (state.server?.alive) {
    if (argv.includes("--stop-server")) {
      if (!(await stopServer(state.server, log))) return 1;
    } else {
      log.error(
        `  refused   : the dev server (pid ${state.server.pid}) owns ${APP_DIR}/${state.server.sessionDir}; deleting it behind a live server corrupts the running session`,
      );
      log.error("             stop it, or re-run with `--stop-server` to stop that exact pid and then prune");
      return 1;
    }
  }

  const summary = await pruneCaches({ cacheRoot: root, log });
  const after = await freeBytes(root);
  log.log(`  reclaimed : ${human(summary.bytes)} across ${summary.removed.length} target(s)`);
  log.log(`  free space: ${human(after)}`);
  return summary.refused.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  process.exitCode = await cli(process.argv.slice(2));
}
