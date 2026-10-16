/**
 * QA server: ensure the Showcase is running, then run a QA tier against it.
 *
 * Why this exists
 * ---------------
 * The old workflow was "build image → start container → hope it is ready → run
 * QA", repeated by hand. Two things went wrong every time:
 *
 *   - the host `next build` fails in this sandbox (Turbopack's PostCSS worker
 *     cannot bind a port), and a cold failure cost 25 minutes before it was
 *     noticed;
 *   - a Docker rebuild costs ~2m20s, and it was done whether or not anything the
 *     image copies had changed.
 *
 * So: the production build happens in Docker only, a content hash decides
 * whether a rebuild is needed at all, the rebuild is bounded, and the command
 * does not return until the container answers HTTP — loopback only.
 *
 *   node scripts/qa-server.mjs --ensure-only
 *   node scripts/qa-server.mjs --mode=changed
 *   node scripts/qa-server.mjs --mode=full
 *   node scripts/qa-server.mjs --mode=providers --provider-mode=live
 *   node scripts/qa-server.mjs --rebuild --mode=behaviour
 */

import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const markerPath = path.join(root, "artifacts/qa/server-build.json");
const port = process.env.LUC_UI_SHOWCASE_PORT ?? "3000";
const baseUrl = process.env.LUC_QA_BASE_URL ?? `http://127.0.0.1:${port}`;
const BUILD_TIMEOUT_MS = Number.parseInt(process.env.LUC_QA_BUILD_TIMEOUT_MS ?? "600000", 10);
const HEALTH_TIMEOUT_MS = Number.parseInt(process.env.LUC_QA_HEALTH_TIMEOUT_MS ?? "120000", 10);

/** Everything the image copies that can change the rendered Showcase. */
const HASH_ROOTS = [
  "packages/ui/src",
  "packages/ui/package.json",
  "packages/ui/tsdown.config.mjs",
  "apps/showcase/app",
  "apps/showcase/components",
  "apps/showcase/lib",
  "apps/showcase/package.json",
  "apps/showcase/middleware.ts",
  "apps/showcase/next.config.ts",
  "apps/showcase/postcss.config.mjs",
  "apps/showcase/tsconfig.json",
  "apps/showcase/globals.css",
  // Workspace-level inputs. They live at this repository's root, which is the
  // pnpm workspace root (`HASH_ROOTS` is resolved against that same root).
  "package.json",
  "pnpm-workspace.yaml",
  "pnpm-lock.yaml",
  ".npmrc",
  "Dockerfile",
  "docker-compose.yml",
];

/**
 * Every file under `target` that can change what the image renders.
 *
 * Exported for `preview-inputs.test.mjs`, which is the reason the generated-file
 * clause below is not just a comment: a `*.tsbuildinfo` written into a source
 * directory used to be hashed, so running `tsc` alone marked the preview stale.
 */
export async function walk(target) {
  const info = await stat(target).catch(() => undefined);
  if (!info) return [];
  if (info.isFile()) return [target];
  const entries = await readdir(target, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    /*
     * `tsconfig.lab.tsbuildinfo` is the reason for the last clause: TypeScript
     * writes it beside the source it compiled, Git ignores it, and it is not an
     * input to the image — but it sat inside `apps/showcase/app/…`, so it was
     * hashed, and running `tsc` alone was enough to make the preview look stale.
     * Measured on 2026-10-14: the working tree hashed 1007 files and the
     * `git archive` snapshot of the same commit hashed 1006, the difference
     * being that one generated file.
     */
    if (
      entry.name === "node_modules" ||
      entry.name === ".next" ||
      entry.name === "dist" ||
      entry.name.endsWith(".tsbuildinfo")
    ) {
      continue;
    }
    files.push(...(await walk(path.join(target, entry.name))));
  }
  return files;
}

async function contentHash() {
  const hash = createHash("sha256");
  const files = [];
  for (const relative of HASH_ROOTS) files.push(...(await walk(path.join(root, relative))));
  files.sort();
  for (const file of files) {
    hash.update(path.relative(root, file));
    hash.update(await readFile(file));
  }
  return { hash: hash.digest("hex"), files: files.length };
}

async function composeRunning() {
  try {
    const { stdout } = await run("docker", ["compose", "ps", "--format", "json"], { cwd: root });
    const rows = stdout
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
    /*
     * The container name is this repository's own (`-standalone`).
     *
     * It used to be `luc-ui-showcase`, which is also the name `luc-quant`'s
     * copy of this stack uses; two repositories deriving the same Compose
     * project name from the same directory name is a name collision, not a
     * coincidence, so the standalone stack is named apart from it.
     */
    return rows.find((row) => row.Service === "showcase" || row.Name === "luc-ui-showcase-standalone");
  } catch {
    return undefined;
  }
}

async function waitForHttp(timeoutMs, { requireHealthy = false } = {}) {
  const deadline = Date.now() + timeoutMs;
  let lastError = "no response";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(5000) });
      if (response.ok) return true;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error?.message ?? String(error);
    }
    if (requireHealthy) {
      const status = await composeRunning();
      if (status && typeof status.Health === "string" && status.Health && status.Health !== "healthy") {
        lastError = `container health=${status.Health}`;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`[qa-server] ${baseUrl} did not answer within ${timeoutMs}ms (last: ${lastError})`);
}

async function readMarker() {
  try {
    return JSON.parse(await readFile(markerPath, "utf8"));
  } catch {
    return undefined;
  }
}

async function writeMarker(hash, files) {
  await mkdir(path.dirname(markerPath), { recursive: true });
  await writeFile(markerPath, JSON.stringify({ hash, files, builtAt: new Date().toISOString() }, null, 2));
}

/** Start (and, when stale, rebuild) the Showcase, then wait until it answers. */
export async function ensureServer({ force = false, quiet = false } = {}) {
  const say = (message) => {
    if (!quiet) console.log(message);
  };

  const { hash, files } = await contentHash();
  const marker = await readMarker();
  const stale = force || marker?.hash !== hash;

  if (!stale) {
    const running = await composeRunning();
    if (running && running.State === "running") {
      say(`  server      : reuse luc-ui-showcase-standalone (image current, ${files} inputs hashed)`);
      await waitForHttp(HEALTH_TIMEOUT_MS);
      return { rebuilt: false, hash };
    }
    say("  server      : starting existing image");
    await run("docker", ["compose", "up", "-d"], { cwd: root });
  } else {
    say(
      force
        ? "  server      : rebuilding image (--rebuild)"
        : `  server      : rebuilding image (${marker ? `${files} inputs changed` : "no build marker yet"})`,
    );
    try {
      await run("docker", ["compose", "up", "-d", "--build"], {
        cwd: root,
        timeout: BUILD_TIMEOUT_MS,
        maxBuffer: 32 * 1024 * 1024,
      });
    } catch (error) {
      throw new Error(
        `[qa-server] docker compose build failed or exceeded ${Math.round(BUILD_TIMEOUT_MS / 1000)}s.\n` +
          `  The host \`next build\` is not usable in this sandbox; the Docker build is the supported path.\n` +
          `  Inspect with: docker compose logs showcase\n  ${error?.message ?? error}`,
      );
    }
    await writeMarker(hash, files);
  }

  await waitForHttp(HEALTH_TIMEOUT_MS, { requireHealthy: true });
  say("  server      : healthy");
  return { rebuilt: stale, hash };
}

function readArg(argv, name) {
  const prefix = `--${name}=`;
  const inline = argv.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = argv.indexOf(`--${name}`);
  if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) return argv[index + 1];
  return undefined;
}

async function main() {
  const argv = process.argv.slice(2);
  const ensureOnly = argv.includes("--ensure-only");
  const force = argv.includes("--rebuild");
  const forwarded = argv.filter((arg) => !["--ensure-only", "--rebuild"].includes(arg));

  const { rebuilt } = await ensureServer({ force });
  if (ensureOnly) return;

  const mode = readArg(forwarded, "mode") ?? "full";
  if (!forwarded.some((arg) => arg.startsWith("--mode"))) forwarded.push(`--mode=${mode}`);

  console.log(`  qa          : mode=${mode}${rebuilt ? " (image rebuilt)" : ""}`);
  const child = spawn(process.execPath, [path.join(root, "apps/showcase/scripts/visual-qa.mjs"), ...forwarded], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, LUC_QA_BASE_URL: baseUrl },
  });
  await new Promise((resolve, reject) => {
    child.on("exit", (code) => {
      process.exitCode = code ?? 0;
      resolve();
    });
    child.on("error", reject);
  });
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  await main().catch(async (error) => {
    console.error(error?.message ?? error);
    if (String(error?.message ?? "").includes("docker compose build")) {
      await rm(markerPath, { force: true }).catch(() => {});
    }
    process.exitCode = 1;
  });
}
