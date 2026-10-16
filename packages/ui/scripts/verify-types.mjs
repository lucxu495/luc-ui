/**
 * @luc/ui type-resolution validation.
 *
 * Runs `attw` (Are The Types Wrong) against the *packed* artifact, so the check
 * describes what a consumer installs rather than the repository layout.
 *
 * The package is intentionally ESM-only, so the `esm-only` profile is the
 * honest one: a Node 10 resolver cannot see `exports` subpaths at all, and a
 * CommonJS `require()` of an ESM module is a documented, expected limitation
 * (`import()` works). Both are reported as ignored rather than hidden — the
 * table below still prints them.
 *
 * The two CSS entry points are excluded: `attw` resolves module types, and a
 * `.css` file has none. Their existence is asserted by `verify-package.mjs`.
 */

import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { ensurePack } from "./lib/pack.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, "..");
const attwBin = path.join(pkgDir, "node_modules/.bin/attw");

try {
  const tarball = await ensurePack(pkgDir);

  const { stdout: attwOut, stderr: attwErr } = await run(
    attwBin,
    [tarball, "--profile", "esm-only", "--exclude-entrypoints", "./styles.css", "./tokens.css", "--format", "table", "--no-emoji"],
    { cwd: pkgDir },
  );
  const report = `${attwOut}${attwErr}`.trim();
  if (report) console.log(report);
  console.log("\n  ✓ every module entry point resolves for ESM and bundler consumers");
} catch (error) {
  console.error("LUC UI — type resolution");
  console.error(error.stdout ?? error.message);
  process.exitCode = 1;
}
