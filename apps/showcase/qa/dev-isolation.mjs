/**
 * CONCURRENCY-001 — two development sessions over one source tree.
 *
 * What went wrong, measured rather than assumed (2026-10-13):
 *
 *   1. `next dev` *does* guard its own output directory — but only with a lock
 *      file at `<distDir>/dev/lock`, and only while the pid in it is alive. A
 *      lock whose process is gone does not block a new server.
 *   2. That lock lives **inside** the directory the disk guard prunes. Delete
 *      `.next/dev` behind a live server — which is what an emergency cache
 *      cleanup does, and why the guard grew its own live-server refusal — and
 *      the next `next dev` on the same `distDir` starts with nothing in its way.
 *   3. Two servers then share one Turbopack cache, one `static/chunks` tree and
 *      one set of manifests. Each compiles its own graph and overwrites the
 *      other's files, so the first server starts answering from a graph that no
 *      longer matches the directory. Observed on 2026-10-13, before this probe
 *      existed: the first server served `/components/button` as `200`,
 *      214 597 bytes, 49 chunks. After the second server started on the same
 *      directory, the same URL on the first server returned a **404 carrying a
 *      99 188-byte not-found page** (48 chunks) while the second returned `200`,
 *      214 597 bytes. The chunk sets did not agree — the first page pulled
 *      `luc-ui_apps_showcase_18x7jxu._.js`, the second
 *      `luc-ui_apps_showcase_0ir-jga._.js`. Seconds later the first process was
 *      gone, with nothing in its own log to say why.
 *
 * The fix is Next's own supported mechanism: an explicitly configured `distDir`.
 * `LUC_NEXT_DIST_DIR` selects it (`pnpm dev:a` / `pnpm dev:b`), defaulting to
 * `.next`, so every existing command is unchanged.
 *
 * This probe asserts both halves, and it is the reason the claim is in the docs
 * rather than in a summary:
 *
 *   --mode=isolation  (default) two sessions, two output directories → both
 *                     serve the same route, each satisfying *its own* module
 *                     graph, and a source edit reaches both without disturbing
 *                     either. A real failure here is a non-zero exit.
 *   --mode=collision  the historical setup, reproduced on purpose: one output
 *                     directory, the lock moved aside, a second server started.
 *                     Exits 0 only when the corruption is *demonstrated*; if the
 *                     first server survives untouched the probe exits 2, because
 *                     then this file's premise is wrong and the documentation
 *                     has to change with it.
 *   --mode=both       isolation, then collision, reusing the same two sessions.
 *
 * Both modes use throwaway `.next-qa-*` directories and remove them afterwards,
 * so the canonical `.next`, the Docker preview and any live server of the
 * owner's are never involved.
 *
 *   node qa/dev-isolation.mjs
 *   node qa/dev-isolation.mjs --mode=collision --keep
 */

import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { cacheTargetsFor, discoverSessionDirs } from "../../../scripts/cache-prune.mjs";

const execFileAsync = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.resolve(here, "..");
const lucUiRoot = path.resolve(appDir, "../..");
const nextBin = path.join(appDir, "node_modules/.bin/next");

const argv = process.argv.slice(2);
const mode = argv.find((value) => value.startsWith("--mode="))?.slice("--mode=".length) ?? "isolation";
const keep = argv.includes("--keep");
/**
 * Probe routes: the shell, and one deep page from each of two areas. All are
 * canonical (no alias redirect) so the status assertions stay meaningful.
 */
const ROUTES = ["/", "/components/buttons", "/charts/line-chart"];
const READY_TIMEOUT_MS = 120_000;
const failures = [];
const sessions = [];

const log = (line) => console.log(line);

/**
 * Start one dev session.
 *
 * @param {{name: string, distDir: string, port: number}} spec
 */
async function startSession(spec) {
  const child = spawn(nextBin, ["dev", "--port", String(spec.port)], {
    cwd: appDir,
    env: { ...process.env, LUC_NEXT_DIST_DIR: spec.distDir, FORCE_COLOR: "0" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const session = { ...spec, child, output: "", pid: child.pid };
  child.stdout.on("data", (chunk) => (session.output += chunk.toString()));
  child.stderr.on("data", (chunk) => (session.output += chunk.toString()));
  session.exited = new Promise((resolve) => child.on("exit", (code, signal) => resolve({ code, signal })));
  sessions.push(session);
  return session;
}

/** Wait until a session answers, or fail with its own log. */
async function waitReady(session, route = "/") {
  const deadline = Date.now() + READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (await answered(session, route)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  failures.push(`${session.name}: never answered on ${route}`);
  log(session.output.trim());
  return false;
}

/** One request; `undefined` when the server is not answering yet. */
async function answered(session, route) {
  try {
    const res = await fetch(`http://localhost:${session.port}${route}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
    });
    await res.arrayBuffer();
    return res.status;
  } catch {
    return undefined;
  }
}

/** The dev-server lock the session owns, if Next has written it. */
async function sessionLock(session) {
  const lockPath = path.join(appDir, session.distDir, "dev/lock");
  const raw = await readFile(lockPath, "utf8").catch(() => undefined);
  return raw ? { path: lockPath, ...JSON.parse(raw) } : undefined;
}

/**
 * Fetch a route and then every chunk its HTML points at.
 *
 * The chunk sweep is the part that catches cross-contamination: when two
 * servers share one directory, a page keeps referring to chunk files the other
 * server has since replaced, and those requests come back 404 — the DOM mounts
 * an HTML shell with no working client, which is exactly the "stale module"
 * report this work started from.
 */
async function inspectPage(session, route) {
  const res = await fetch(`http://localhost:${session.port}${route}`, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get("location");
    failures.push(`${session.name} ${route}: unexpected redirect to ${location}`);
    return { status: res.status, bytes: 0, chunks: [], missing: [], sha: "" };
  }
  const html = await res.text();
  const chunks = [
    ...new Set([...html.matchAll(/\/_next\/static\/(?:chunks|development)\/[^"'\\ )]+/g)].map((match) => match[0])),
  ];
  const missing = [];
  for (const chunk of chunks) {
    const chunkRes = await fetch(`http://localhost:${session.port}${chunk}`);
    if (!chunkRes.ok) missing.push(`${chunkRes.status} ${chunk}`);
  }
  return {
    status: res.status,
    bytes: html.length,
    chunks,
    missing,
    sha: createHash("sha1").update(html).digest("hex").slice(0, 12),
  };
}

// ── isolation: two sessions, two output directories ────────────────────────

async function isolation() {
  log("=== CONCURRENCY-001 — isolation ===");
  const a = await startSession({ name: "session A", distDir: ".next-qa-a", port: 3400 });
  const b = await startSession({ name: "session B", distDir: ".next-qa-b", port: 3401 });
  if (!(await waitReady(a)) || !(await waitReady(b))) return;

  for (const session of [a, b]) {
    const lock = await sessionLock(session);
    const owned = lock?.port === session.port;
    log(
      `${owned ? "PASS" : "FAIL"} ${session.name} holds its own lock at ${path.relative(lucUiRoot, path.join(appDir, session.distDir))}/dev/lock (pid ${lock?.pid}, port ${lock?.port})`,
    );
    if (!owned) failures.push(`${session.name}: lock does not name its own port ${session.port}`);
  }

  for (const route of ROUTES) {
    for (const session of [a, b]) {
      const page = await inspectPage(session, route);
      const ok = page.status >= 200 && page.status < 400 && page.missing.length === 0;
      log(
        `${ok ? "PASS" : "FAIL"} ${session.name} ${route} → ${page.status}, ${page.bytes}B, ${page.chunks.length} chunks, ${page.missing.length} missing (${page.sha})`,
      );
      for (const missing of page.missing.slice(0, 5)) log(`       MISSING ${missing}`);
      if (!ok) failures.push(`${session.name} ${route}: status ${page.status}, ${page.missing.length} missing chunk(s)`);
    }
  }

  /* A source edit must reach both sessions without either losing its graph. */
  const shared = path.join(appDir, "app/globals.css");
  const original = await readFile(shared, "utf8");
  const marker = `\n/* CONCURRENCY-001 probe: ${Date.now()} */\n`;
  try {
    await writeFile(shared, original + marker);
    await new Promise((resolve) => setTimeout(resolve, 6000));
    for (const session of [a, b]) {
      const page = await inspectPage(session, "/components/buttons");
      const ok = page.status === 200 && page.missing.length === 0;
      log(`${ok ? "PASS" : "FAIL"} ${session.name} after a shared source edit → ${page.status}, ${page.missing.length} missing`);
      if (!ok) failures.push(`${session.name}: broken after a shared source edit`);
    }
  } finally {
    await writeFile(shared, original);
  }
}

// ── collision: one output directory, the lock moved aside ───────────────────

async function collision() {
  log("");
  log("=== CONCURRENCY-001 — the historical collision, reproduced ===");
  const first = await startSession({ name: "first", distDir: ".next-qa-c", port: 3402 });
  if (!(await waitReady(first))) return;
  const baselines = new Map();
  for (const route of ROUTES) {
    const page = await inspectPage(first, route);
    baselines.set(route, page);
    log(`   first server baseline ${route} → ${page.status}, ${page.chunks.length} chunks (${page.sha})`);
    if (page.status !== 200) {
      failures.push(`collision: the first server did not serve ${route}`);
      return;
    }
  }

  /* Exactly what a cache cleanup behind a live server leaves: no lock. */
  const lock = await sessionLock(first);
  if (lock) await rename(lock.path, `${lock.path}.probe-backup`);
  log(`   lock moved aside: ${path.relative(lucUiRoot, lock?.path ?? "?")} (the server keeps running)`);

  const second = await startSession({ name: "second", distDir: ".next-qa-c", port: 3403 });
  if (!(await waitReady(second))) return;
  /* Pressure: the second server compiles the same routes into the same tree. */
  for (const route of ROUTES) {
    const page = await inspectPage(second, route);
    log(`   second server (same distDir) ${route} → ${page.status}, ${page.chunks.length} chunks (${page.sha})`);
  }

  /*
   * Give the first server time to answer from the overwritten directory.
   *
   * The evidence required is structural, not cosmetic: the response status, a
   * chunk that no longer resolves, or a chunk set whose file names changed —
   * which is what a foreign module graph looks like from outside. A bare HTML
   * hash difference would be too weak a claim, since dev HTML can carry
   * per-request noise.
   */
  const chunkKey = (page) => [...page.chunks].sort().join(",");
  let damaged;
  const baselineRoute = "/components/buttons";
  const before = baselines.get(baselineRoute);
  for (let attempt = 0; attempt < 12 && !damaged; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    for (const route of ROUTES) {
      const status = await answered(first, route);
      if (status === undefined) {
        damaged = { kind: "gone", route, status };
        break;
      }
      const baseline = baselines.get(route);
      if (status !== baseline.status) {
        damaged = { kind: "status", route, status, baseline };
        break;
      }
      const page = await inspectPage(first, route);
      if (page.missing.length > 0) {
        damaged = { kind: "missing", route, status, page };
        break;
      }
      if (chunkKey(page) !== chunkKey(baseline)) {
        damaged = { kind: "chunks", route, status, page, baseline };
        break;
      }
    }
  }

  if (damaged) {
    const detail =
      damaged.kind === "gone"
        ? `the first process stopped answering ${damaged.route}`
        : damaged.kind === "status"
          ? `${damaged.route} changed from ${damaged.baseline.status} to ${damaged.status}`
          : damaged.kind === "missing"
            ? `${damaged.route} still references ${damaged.page.missing.length} chunk(s) that no longer resolve (${damaged.page.missing[0]})`
            : `the chunk files ${damaged.route} asks for changed — it now pulls ${[...damaged.page.chunks]
                .filter((chunk) => !damaged.baseline.chunks.includes(chunk))
                .slice(0, 2)
                .join(", ")} from the second server's compilation`;
    log(`PASS reproduced: the first server no longer matches the directory it shares — ${detail}`);
  } else {
    log("FAIL not reproduced: the first server still serves the route identically from a shared distDir");
    log("     the premise of this probe and of docs/DEV_MODE.md §7 needs revisiting");
    process.exitCode = 2;
  }
}

// ── shutdown ────────────────────────────────────────────────────────────────

async function stopAll() {
  for (const session of sessions) {
    if (session.child.exitCode !== null || session.child.signalCode !== null) continue;
    session.child.kill("SIGTERM");
    const exited = await Promise.race([
      session.exited.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 8000)),
    ]);
    if (!exited) session.child.kill("SIGKILL");
  }
}

/**
 * Remove the throwaway sessions, and only those.
 *
 * The whole `.next-qa-*` directory goes, not just its caches: an empty session
 * directory left behind is a session the disk guard keeps reporting, which
 * would be the probe leaving litter in the thing it is testing.
 */
async function cleanup() {
  if (keep) {
    log("--keep: leaving the .next-qa-* directories in place");
    return;
  }
  const present = await discoverSessionDirs(lucUiRoot);
  const scratch = present.filter((dir) => dir.startsWith(".next-qa-"));
  for (const relative of cacheTargetsFor(scratch)) {
    const target = path.join(lucUiRoot, relative);
    if (await stat(target).catch(() => undefined)) await rm(target, { recursive: true, force: true });
  }
  for (const dir of scratch) {
    const target = path.join(appDir, dir);
    if (await stat(target).catch(() => undefined)) await rm(target, { recursive: true, force: true });
  }
  if (scratch.length > 0) log(`removed probe sessions: ${scratch.join(", ")}`);
}

/**
 * A session directory has to be invisible to every tool, not just to Git.
 *
 * Learned the hard way: the day `LUC_NEXT_DIST_DIR` landed, `pnpm lint` went
 * from clean to **2322 problems (1370 errors)**, because ESLint ignored the
 * default output directory and nothing else — every Turbopack chunk written into
 * a session directory was being linted as source. `tsc` was next in line: its
 * `**​/*.ts` include matches a session's generated `dev/types` file unless the
 * directory is excluded.
 *
 * This is a source contract rather than a browser assertion, deliberately: the
 * failure is a missing pattern in three files, and a test that reads those files
 * is the cheapest thing that fails when someone adds a fourth session scheme and
 * forgets one of them.
 */
async function assertToolchainIgnores() {
  const checks = [
    ["luc-ui/.gitignore", path.join(lucUiRoot, ".gitignore"), ".next-*/"],
    ["apps/showcase/eslint.config.mjs", path.join(appDir, "eslint.config.mjs"), ".next-*"],
    ["apps/showcase/tsconfig.json", path.join(appDir, "tsconfig.json"), ".next-*"],
  ];
  for (const [label, file, pattern] of checks) {
    const text = await readFile(file, "utf8").catch(() => "");
    const ok = text.includes(pattern);
    log(`${ok ? "PASS" : "FAIL"} ${label} keeps session output out of the toolchain (needs "${pattern}")`);
    if (!ok) failures.push(`${label} does not ignore session output ("${pattern}")`);
  }
  /* And Git must agree in practice, not only in the pattern. */
  const { stdout } = await execFileAsync("git", ["status", "--porcelain", "--", appDir]).catch(() => ({ stdout: "" }));
  const leaked = stdout
    .split("\n")
    .filter((line) => /\.next-/.test(line))
    .map((line) => line.trim());
  log(`${leaked.length === 0 ? "PASS" : "FAIL"} no session file shows up as an untracked change`);
  for (const line of leaked.slice(0, 5)) log(`       ${line}`);
  if (leaked.length > 0) failures.push(`${leaked.length} session file(s) are visible to Git`);
}

try {
  if (mode !== "collision") await assertToolchainIgnores();
  if (mode === "isolation" || mode === "both") await isolation();
  if (mode === "collision" || mode === "both") await collision();
} catch (error) {
  failures.push(`${error?.stack ?? error}`);
} finally {
  await stopAll();
  await cleanup();
}

if (failures.length > 0) {
  log("");
  for (const failure of failures) console.error(`FAILURE: ${failure}`);
  process.exitCode = 1;
} else if (process.exitCode !== 2) {
  log("");
  log("dev-isolation: OK");
}
