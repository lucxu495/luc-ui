/**
 * The API tables must not reach a browser bundle — measured, not asserted.
 *
 * Why this needs a probe rather than a comment. `lib/docs/generated/api.ts` is
 * ~650 KB of compiler output: every public signature and every prop of every
 * documented entry. It is legitimate on the server — it is what the API tables
 * are *made of* — and unacceptable in a page: it would be the largest single
 * thing the Showcase ships, for text a reader opens one page to read.
 *
 * The architecture already keeps it out (`registry.ts` is server-only, the
 * browser reads the compact `generated/nav.ts` projection), and Components V2
 * then *added* API sections to twenty pages that had none, through a server
 * component that hands the rendered table down as a node. "It should be fine
 * because of how it is imported" is exactly the assumption that rots: one
 * convenience `import { apiFor }` in a client component and 650 KB appears in
 * every page bundle, with nothing to notice it.
 *
 * So this reads the built output and looks for the payload itself. It takes
 * byte windows from the middle of `api.ts` — deliberately *not* from the header
 * comment or the export names, which are short and could appear for other
 * reasons — and searches every client chunk for them. The windows are also
 * searched in `.next/server`, which is the positive control: if the sample
 * matches nothing on either side, the sampler is broken and a clean result
 * means nothing.
 *
 *   node qa/api-delivery.mjs                 # needs a built .next
 *   node qa/api-delivery.mjs --require-build # fail rather than report "no build"
 *   node qa/api-delivery.mjs --chunks=DIR --server=DIR
 *                                            # scan an arbitrary build, e.g. the
 *                                            # one copied out of the preview image
 */

import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const APP = path.resolve(HERE, "..");
export const API_SOURCE = path.join(APP, "lib/docs/generated/api.ts");

/**
 * Deterministic windows from the middle of the file.
 *
 * Evenly spaced rather than random, so the same source always produces the same
 * sample and a failure can be reproduced by hand. The first and last tenths are
 * skipped: the head is the generated banner and the tail is the closing
 * `satisfies`, and neither is payload.
 */
export function sampleWindows(source, { count = 48, size = 64 } = {}) {
  const usable = source.trim();
  const start = Math.floor(usable.length * 0.1);
  const end = Math.floor(usable.length * 0.9);
  const span = end - start;
  const step = Math.floor(span / count);
  if (step < size) throw new Error("api.ts is too small to sample");

  const seen = new Set();
  const windows = [];
  for (let index = start; index + size < end; index += step) {
    const window = usable.slice(index, index + size);
    /* A window with no letters would match almost any minified bundle. */
    if (!/[A-Za-z]{6}/.test(window)) continue;
    if (seen.has(window)) continue;
    seen.add(window);
    windows.push(window);
  }
  return windows;
}

/** Which windows appear in this text. */
export function windowsIn(text, windows) {
  return windows.filter((window) => text.includes(window));
}

async function jsFiles(root) {
  const found = [];
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith(".js")) found.push(full);
    }
  };
  if (await stat(root).catch(() => undefined)) await walk(root);
  return found;
}

export async function scan({ apiSource = API_SOURCE, clientRoot, serverRoot } = {}) {
  const source = await readFile(apiSource, "utf8");
  const windows = sampleWindows(source);

  const clientFiles = clientRoot ? await jsFiles(clientRoot) : [];
  const serverFiles = serverRoot ? await jsFiles(serverRoot) : [];

  const clientHits = [];
  let clientBytes = 0;
  for (const file of clientFiles) {
    const text = await readFile(file, "utf8");
    clientBytes += Buffer.byteLength(text);
    const hits = windowsIn(text, windows);
    for (const window of hits) clientHits.push({ file: path.relative(APP, file), window });
  }

  /* Positive control: the server chunks are supposed to contain the payload, so
   * finding nothing there means the sample is not sampling what we think. */
  let serverHits = 0;
  for (const file of serverFiles) serverHits += windowsIn(await readFile(file, "utf8"), windows).length;

  return {
    apiBytes: Buffer.byteLength(source),
    windows: windows.length,
    clientFiles: clientFiles.length,
    clientBytes,
    clientHits,
    serverHits,
  };
}

async function cli() {
  const requireBuild = process.argv.includes("--require-build");
  /*
   * The defaults are a local build. The flags exist so the *shipped* artifacts
   * can be measured instead — the strongest evidence available is the bundle a
   * container is actually serving, not a rebuild of the same source.
   */
  const flag = (name, fallback) => {
    const found = process.argv.find((argument) => argument.startsWith(`--${name}=`));
    return found ? path.resolve(found.slice(name.length + 3)) : fallback;
  };
  const clientRoot = flag("chunks", path.join(APP, ".next/static/chunks"));
  const serverRoot = flag("server", path.join(APP, ".next/server"));

  const result = await scan({ clientRoot, serverRoot });
  const built = result.clientFiles > 0;

  console.log("LUC UI Showcase — API payload delivery");
  console.log(`  client root          : ${path.relative(APP, clientRoot) || clientRoot}`);
  console.log(`  generated api.ts     : ${(result.apiBytes / 1024).toFixed(1)} KB`);
  console.log(`  sampled windows      : ${result.windows} × 64 B`);
  console.log(`  client chunks        : ${built ? `${result.clientFiles} (${(result.clientBytes / 1024).toFixed(0)} KB)` : "no build"}`);
  console.log(`  windows in client    : ${result.clientHits.length}`);
  console.log(`  windows in server    : ${result.serverHits} (positive control)`);

  if (!built) {
    console.log(
      requireBuild
        ? "\n  ✗ no built .next — run `pnpm --filter @luc/showcase build` first"
        : "\n  no built .next; skipped (pass --require-build to make this an error)",
    );
    if (requireBuild) process.exitCode = 1;
    return;
  }

  const problems = [];
  for (const hit of result.clientHits.slice(0, 5)) {
    problems.push(`${hit.file} carries API payload: ${JSON.stringify(hit.window.slice(0, 40))}…`);
  }
  if (result.serverHits === 0) {
    problems.push("no sampled window found in .next/server — the sample is not sampling the payload");
  }

  if (problems.length > 0) {
    console.error(`\n  ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`   ✗ ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("\n  ✓ the API tables are rendered on the server and never shipped to a browser");
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await cli();
