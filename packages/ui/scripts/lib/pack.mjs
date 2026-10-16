/**
 * Shared `pnpm pack` cache.
 *
 * `verify-package.mjs` and `verify-types.mjs` both need the *packed* artifact —
 * that is what makes them describe what a consumer installs rather than the
 * repository layout. Both used to run their own `pnpm pack` into a fresh temp
 * directory, so every verification paid for it twice.
 *
 * The tarball is cached by a content hash of `package.json` plus every file the
 * manifest's `files` array publishes: same inputs ⇒ same tarball ⇒ reuse. The
 * cache lives under `luc-ui/artifacts/pack`, which `qa:clean` removes and
 * `.gitignore` ignores.
 *
 * The hash covers `files` rather than `dist/` alone, which it used to. That was
 * wrong in a quiet way: `README.md` and `LICENSE` are published and are not in
 * `dist/`, so editing the README and re-packing returned the *cached* tarball
 * built from the previous one — `release:check` caught it as a difference
 * between the staged release tree and a fresh build, three steps away from the
 * cause.
 */

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

async function hashDirectory(dir, hash) {
  const entries = (await readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    hash.update(entry.name);
    if (entry.isDirectory()) await hashDirectory(full, hash);
    else hash.update(await readFile(full));
  }
}

async function packageHash(pkgDir) {
  const hash = createHash("sha256");
  const manifest = JSON.parse(await readFile(path.join(pkgDir, "package.json"), "utf8"));
  hash.update(JSON.stringify(manifest));
  const declared = manifest.files ?? ["dist"];
  for (const entry of [...declared].sort()) {
    const full = path.join(pkgDir, entry);
    const info = await stat(full).catch(() => undefined);
    if (!info) continue;
    hash.update(entry);
    if (info.isDirectory()) await hashDirectory(full, hash);
    else hash.update(await readFile(full));
  }
  return hash.digest("hex").slice(0, 16);
}

/**
 * Return the path to a tarball for the current `dist`, packing only when the
 * cached one does not match.
 */
export async function ensurePack(pkgDir) {
  const outDir = path.resolve(pkgDir, "../../artifacts/pack");
  const hash = await packageHash(pkgDir);
  const cached = path.join(outDir, `luc-ui-${hash}.tgz`);

  if (await stat(cached).catch(() => undefined)) return cached;

  await mkdir(outDir, { recursive: true });
  // Only one tarball per content hash is kept; stale ones cannot be reused and
  // would otherwise accumulate one per verification run.
  for (const entry of await readdir(outDir)) {
    if (entry.endsWith(".tgz") && path.join(outDir, entry) !== cached) {
      await rm(path.join(outDir, entry), { force: true });
    }
  }

  const { stdout } = await run("pnpm", ["pack", "--pack-destination", outDir], { cwd: pkgDir, maxBuffer: 8 * 1024 * 1024 });
  const produced = stdout.trim().split("\n").at(-1);
  await rename(produced, cached);
  return cached;
}
