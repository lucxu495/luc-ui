/**
 * Build the git-installable release artifact for `@luc/ui`.
 *
 * Why this exists
 * ---------------
 * `@luc/ui` is not published to a registry, and the repository root is the
 * pnpm workspace, not the package — `packages/ui` is the package. Neither of
 * the two obvious ways to consume it that way works:
 *
 *   · `github:lucxu495/luc-ui#<ref>` installs the *root* package, which is the
 *     private `luc-ui-workspace` and exports nothing;
 *   · `…&path:packages/ui` reaches the right manifest, but a git dependency is
 *     read verbatim: npm and pnpm apply `publishConfig` overrides when they
 *     *pack*, and never when they *fetch*. The consumer would therefore receive
 *     `exports` → `src/*.ts` — unbundled TypeScript — instead of the built
 *     package the repository publishes. Adding `prepare` fixes that, and buys
 *     an install-time build script that every consumer has to allow-list by
 *     resolved git URL, which is a worse contract than a directory that is
 *     already built.
 *
 * So the release is a *tree*: `pnpm pack` applied to `packages/ui` (which does
 * apply `publishConfig`, so the manifest in it is the published one), unpacked
 * verbatim, plus a `RELEASE.json` that says where it came from. That tree is
 * pushed as a commit on the `release` branch and tagged, so a consumer writes
 *
 *     "@luc/ui": "github:lucxu495/luc-ui#v1.0.1"
 *
 * and gets built JavaScript, type declarations, CSS and the runtime
 * dependencies — with no install script, nothing to allow-list, and the exact
 * commit recorded in the lockfile.
 *
 * The staging directory is `luc-ui/release/`. It is a build output on `main`
 * (`.gitignore`d there): the durable copy is the `release` branch commit.
 *
 *   pnpm --filter @luc/ui release:build   # materialise release/ from src
 *   pnpm --filter @luc/ui release:check   # rebuild and byte-compare with it
 */

import { cp, mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { assertReleaseMatchesPack, compareTrees, materialiseRelease } from "./lib/release.mjs";

const run = promisify(execFile);
const here = path.dirname(fileURLToPath(import.meta.url));
const pkgDir = path.resolve(here, "..");
const repoRoot = path.resolve(pkgDir, "../..");
const staging = path.join(repoRoot, "release");
const check = process.argv.includes("--check");

const temporary = await mkdtemp(path.join(tmpdir(), "luc-ui-release-"));

try {
  const staged = await materialiseRelease(temporary, { pkgDir, repoRoot });
  const target = path.join(staging, "package.json");
  assertReleaseMatchesPack(staged);

  if (!check) {
    await cp(temporary, staging, { recursive: true });
  } else if (await stat(target).catch(() => undefined)) {
    const all = await compareTrees(staging, temporary);
    const reordered = all.filter((line) => line.startsWith("reordered only:"));
    const differences = all.filter((line) => !line.startsWith("reordered only:"));
    if (differences.length > 0) {
      console.error(`  ${differences.length} difference(s) between release/ and a fresh build of src:`);
      for (const difference of differences.slice(0, 20)) console.error(`   ✗ ${difference}`);
      console.error("   run `pnpm --filter @luc/ui release:build` and commit the result");
      process.exitCode = 1;
    } else {
      console.log("  ✓ release/ is exactly what the current source builds");
    }
    if (reordered.length > 0) {
      console.log(
        `  · ${reordered.length} declaration file(s) reprised their union members in a different order ` +
          "(same types; see docs/RELEASES.md)",
      );
    }
  } else {
    console.log("  · no release/ staging directory — nothing to compare");
  }

  const size = (await run("du", ["-sh", check ? temporary : staging]).catch(() => null))
    ?.stdout.trim()
    .split("\t")[0];
  console.log(`LUC UI — release artifact${check ? " (check)" : ""}`);
  console.log(`  ${staged.provenance.name}@${staged.provenance.version} · ${staged.files.length} files · ${size ?? "?"}`);
  console.log(
    `  tarball ${path.basename(staged.tarball)} · manifest sha256 ${staged.provenance.artifact.manifestSha256.slice(0, 16)}…`,
  );
  console.log(`  from ${staged.provenance.source.commit?.slice(0, 12) ?? "(no git commit)"} → ${path.relative(repoRoot, staging)}/`);
  if (!check) console.log("  next: commit this tree on the `release` branch and tag it (docs/RELEASES.md)");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
