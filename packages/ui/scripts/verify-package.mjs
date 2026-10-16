/**
 * @luc/ui package validation.
 *
 * Runs against the real artifact, not the repository manifest:
 *
 *   1. every declared export path exists, in source and in `dist`;
 *   2. the source surface and the published surface declare the same subpaths,
 *      so a new entry point cannot be added to one and forgotten in the other;
 *   3. `publint` lints the packed tarball;
 *   4. the tarball contains `dist` and `README.md` and nothing from `src`;
 *   5. the built package is measured so size regressions are visible.
 */

import { execFile } from "node:child_process";
import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { publint } from "publint";
import { ensurePack } from "./lib/pack.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, "..");
const pkg = JSON.parse(await readFile(path.join(pkgDir, "package.json"), "utf8"));

const failures = [];
const notes = [];

function fail(message) {
  failures.push(message);
}

function targets(entry) {
  return typeof entry === "string" ? [entry] : Object.values(entry);
}

async function exists(relative) {
  try {
    await access(path.join(pkgDir, relative));
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------- 1 + 2
const sourceExports = pkg.exports ?? {};
const publishedExports = pkg.publishConfig?.exports ?? {};

const ignore = new Set([".", "./package.json"]);
const sourceKeys = Object.keys(sourceExports).filter((key) => !ignore.has(key));
const publishedKeys = Object.keys(publishedExports).filter((key) => !ignore.has(key));

for (const key of sourceKeys) {
  if (!publishedKeys.includes(key)) fail(`exports declares "${key}" but publishConfig.exports does not`);
}
for (const key of publishedKeys) {
  if (!sourceKeys.includes(key)) fail(`publishConfig.exports declares "${key}" but exports does not`);
}

for (const [key, entry] of Object.entries(sourceExports)) {
  for (const target of targets(entry)) {
    if (target === "./package.json") continue;
    if (!(await exists(target))) fail(`exports["${key}"] points at a missing file: ${target}`);
  }
  if (!key.endsWith(".css") && typeof entry === "string" && entry.startsWith("./src/")) {
    const hasTypes = Object.prototype.hasOwnProperty.call(publishedExports, key);
    if (!hasTypes) fail(`exports["${key}"] is a module entry with no published counterpart`);
  }
}

for (const [key, entry] of Object.entries(publishedExports)) {
  for (const target of targets(entry)) {
    if (target === "./package.json") continue;
    if (!(await exists(target))) fail(`publishConfig.exports["${key}"] points at a missing file: ${target}`);
  }
}

// ------------------------------------------------------------------- 3
const lint = await publint({ pkgDir, pack: "pnpm", level: "warning" });
for (const message of lint.messages) {
  const line = `publint ${message.type}: ${message.code} ${JSON.stringify(message.args)}`;
  if (message.type === "error") fail(line);
  else notes.push(line);
}

// ------------------------------------------------------------------- 4
{
  const tarball = await ensurePack(pkgDir);
  const list = await run("tar", ["-tzf", tarball]);
  const entries = list.stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!entries.some((entry) => entry.startsWith("package/dist/"))) fail("tarball has no dist/");
  if (entries.some((entry) => entry.startsWith("package/src/"))) fail("tarball leaks src/");
  if (!entries.includes("package/README.md")) notes.push("tarball has no README.md");
  if (!entries.includes("package/package.json")) fail("tarball has no package.json");

  const manifest = JSON.parse(
    (await run("tar", ["-xzOf", tarball, "package/package.json"])).stdout,
  );
  if (manifest.exports?.["."] !== "./dist/index.js" && manifest.exports?.["."]?.default !== "./dist/index.js") {
    fail(`packed manifest does not publish dist: ${JSON.stringify(manifest.exports?.["."])}`);
  }
  if (manifest.files && manifest.files.includes("src")) fail("packed manifest still lists src in files");
  notes.push(`tarball ${path.basename(tarball)} · ${entries.length} files · ${await size(tarball)}`);
}

// ------------------------------------------------------------------- 5
async function size(file) {
  const info = await stat(file);
  return `${(Number(info.size) / 1024).toFixed(1)} KB`;
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const distFiles = await walk(path.join(pkgDir, "dist"));
const jsFiles = distFiles.filter((file) => file.endsWith(".js"));
const dtsFiles = distFiles.filter((file) => file.endsWith(".d.ts"));
let jsBytes = 0;
for (const file of jsFiles) jsBytes += Buffer.byteLength(await readFile(file));
const perEntry = [];
for (const [key, entry] of Object.entries(publishedExports)) {
  const target = typeof entry === "string" ? entry : entry.default;
  if (!target?.endsWith(".js")) continue;
  perEntry.push(`${key} ${(Buffer.byteLength(await readFile(path.join(pkgDir, target))) / 1024).toFixed(1)} KB`);
}
notes.push(
  `dist: ${jsFiles.length} modules, ${dtsFiles.length} declaration files, ${(jsBytes / 1024).toFixed(1)} KB JS total`,
);
notes.push(`entry points (own module only): ${perEntry.slice(0, 4).join(" · ")} …`);
notes.push(`gzip of all emitted JS: ${(gzipSync(Buffer.concat(await Promise.all(jsFiles.map((f) => readFile(f))))).length / 1024).toFixed(1)} KB`);

console.log("LUC UI — package verification");
for (const note of notes) console.log(`  ${note}`);
if (failures.length > 0) {
  console.error(`\n  ${failures.length} problem(s):`);
  for (const problem of failures) console.error(`   ✗ ${problem}`);
  process.exitCode = 1;
} else {
  console.log("  ✓ exports, tarball and package metadata agree");
}
