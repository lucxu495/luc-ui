/**
 * The preview build hash has to cover every input the image compiles.
 *
 * Why this exists: `qa-server.mjs` decides whether the review image can be
 * reused from a content hash over `HASH_ROOTS`. On 2026-10-14 that list omitted
 * `packages/ui/src` — and that package is imported as *source*
 * (`exports: { ".": "./src/index.ts" }`), so three commits of Visuals work left
 * the hash unmoved and `--ensure-only` answered "image current". Every QA tier
 * would then have measured a preview built without them, which is the exact
 * failure the immutable-snapshot workflow exists to prevent.
 *
 * The contract is checked against the workspace rather than against a written
 * list, so a new package that the Showcase imports as source is caught the day it
 * is added.
 */

import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

import { walk } from "./qa-server.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

/** The roots `qa-server.mjs` hashes, read out of its source. */
async function hashRoots() {
  const source = await readFile(path.join(here, "qa-server.mjs"), "utf8");
  const start = source.indexOf("const HASH_ROOTS = [");
  const end = source.indexOf("];", start);
  assert.ok(start > 0 && end > start, "HASH_ROOTS not found in qa-server.mjs");
  return new Set(
    [...source.slice(start, end).matchAll(/^\s*"([^"]+)",$/gm)].map((match) => match[1]),
  );
}

/** Workspace packages the Showcase depends on, by their directory name. */
async function workspaceDependencies() {
  const manifest = JSON.parse(await readFile(path.join(root, "apps/showcase/package.json"), "utf8"));
  return Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })
    .filter(([, spec]) => String(spec).startsWith("workspace:"))
    .map(([name]) => name.replace(/^@luc\//, ""));
}

/** Where a package's entry points actually live, relative to the repository root. */
async function entryTargets(packageDir) {
  const manifest = JSON.parse(
    await readFile(path.join(root, "packages", packageDir, "package.json"), "utf8"),
  );
  const exports = manifest.exports ?? {};
  const values = Object.values(exports).filter((value) => typeof value === "string");
  return values;
}

describe("preview build inputs", () => {
  it("hashes the source of every workspace package the Showcase compiles", async () => {
    const roots = await hashRoots();
    const packages = await workspaceDependencies();
    assert.ok(packages.length > 0, "expected at least one workspace dependency");

    const missing = [];
    for (const name of packages) {
      const targets = await entryTargets(name);
      if (!targets.some((target) => target.includes("/src/"))) continue;
      const expected = `packages/${name}/src`;
      if (!roots.has(expected)) missing.push(expected);
    }
    assert.deepEqual(missing, [], `qa-server.mjs does not hash ${missing.join(", ")}`);
  });

  it("hashes the Showcase files that decide what a route renders", async () => {
    const roots = await hashRoots();
    for (const required of [
      "apps/showcase/app",
      "apps/showcase/components",
      "apps/showcase/lib",
      "apps/showcase/middleware.ts",
      "apps/showcase/next.config.ts",
    ]) {
      assert.ok(roots.has(required), `${required} is not hashed by qa-server.mjs`);
    }
  });

  it("notices a package that is compiled from source", async () => {
    /*
     * Negative control: the rule above only means something if a workspace
     * package genuinely resolves into `src/`, which is what makes a missing hash
     * root a defect rather than a stylistic preference.
     *
     * Phase 2 moved `@luc/visuals` out of this repository, so `@luc/ui` is the
     * one workspace package the Showcase still compiles from source — which makes
     * this assertion more load-bearing, not less.
     */
    const targets = await entryTargets("ui");
    assert.ok(
      targets.some((target) => target === "./src/index.ts"),
      `expected @luc/ui to resolve to source, got ${targets.join(", ")}`,
    );
  });

  it("hashes source, and not the build output written beside it", async () => {
    const scratch = await mkdtemp(path.join(tmpdir(), "luc-preview-inputs-"));
    try {
      await writeFile(path.join(scratch, "page.tsx"), "export default null;\n");
      await writeFile(path.join(scratch, "tsconfig.lab.tsbuildinfo"), '{ "version": 1 }\n');
      await writeFile(path.join(scratch, "styles.css"), "body {}\n");
      const walked = (await walk(scratch)).map((file) => path.basename(file)).sort();
      assert.deepEqual(walked, ["page.tsx", "styles.css"]);
      // The file is still there — the walk skips it, nothing deletes it.
      assert.ok((await stat(path.join(scratch, "tsconfig.lab.tsbuildinfo"))).isFile());
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });
});
