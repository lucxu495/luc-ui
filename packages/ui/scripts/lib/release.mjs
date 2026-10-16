/**
 * Shared release-artifact plumbing.
 *
 * `release-artifact.mjs` (the CLI a maintainer runs) and `git-consumer.mjs`
 * (the proof that a git consumer gets the same bytes) both need the same thing:
 * the packed `@luc/ui`, unpacked, with the manifest reduced to what a git
 * consumer may see. Keeping that in one place is what makes the second a check
 * of the first rather than a second implementation of it.
 *
 * Why a packed tarball is the source of the release tree: `pnpm pack` applies
 * `publishConfig`, which is the only mechanism that turns `exports` → `src`
 * (what the repository develops against) into `exports` → `dist` (what a
 * consumer installs). npm and pnpm apply it when they *pack*; neither applies
 * it when they *fetch a git dependency*. Packing here and shipping the result
 * is therefore the difference between a release that installs built JavaScript
 * and one that installs a TypeScript source tree.
 */

import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import ts from "typescript";
import { ensurePack } from "./pack.mjs";

const run = promisify(execFile);

/**
 * Fields a git consumer must not see.
 *
 * `scripts` is the important one: npm and pnpm run `prepare` on a fetched git
 * tree, so a release that carried the build scripts would either invite an
 * install-time build for a package that is already built, or fail outright —
 * pnpm 10 refuses to run them until the consumer allow-lists the *resolved*
 * git URL. `devDependencies` are unreachable without those scripts,
 * `publishConfig` has already been applied by the pack, and `packageManager`
 * names the toolchain of a repository the consumer never installs.
 */
export const OMIT_FIELDS = ["scripts", "devDependencies", "publishConfig", "packageManager"];

/** Fields whose value defines the installed package. Compared against the pack. */
export const RUNTIME_FIELDS = [
  "name",
  "version",
  "type",
  "sideEffects",
  "exports",
  "files",
  "dependencies",
  "peerDependencies",
  "peerDependenciesMeta",
  "license",
];

/** Files that must be in the release tree for a consumer to be able to use it. */
export const REQUIRED_FILES = [
  "dist/index.js",
  "dist/index.d.ts",
  "dist/styles/index.css",
  "dist/tokens/tokens.css",
  "package.json",
];

export async function walk(dir, base = dir) {
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full, base)));
    else out.push(path.relative(base, full));
  }
  return out;
}

/**
 * A declaration file with the members of every union type sorted.
 *
 * The dts bundler does not emit union members in a stable order: two builds of
 * the same source can print `"outline" | "neutral" | …` and
 * `"neutral" | … | "outline"`, which is the same type and a different byte
 * sequence. Comparing declarations through this form keeps the check able to
 * see a real change (a renamed prop, a removed member, a changed comment)
 * without failing on a reordering that means nothing.
 *
 * Parsed with the real TypeScript compiler rather than a regular expression,
 * because a union type can be nested, generic and annotated.
 */
export function canonicalDeclarations(source, fileName) {
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);

  /** Replace each child range in `text`, whose offsets are absolute. */
  const splice = (text, origin, edits) => {
    let out = text;
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      out = out.slice(0, edit.start - origin) + edit.text + out.slice(edit.end - origin);
    }
    return out;
  };

  const normalised = new Map();
  const visit = (node) => {
    const start = node.getStart(sourceFile);
    const end = node.getEnd();
    const edits = [];
    ts.forEachChild(node, (child) => {
      const child_ = visit(child);
      if (child_.text !== child_.original) edits.push(child_);
    });
    let text = splice(source.slice(start, end), start, edits);
    if (ts.isUnionTypeNode(node)) {
      const members = node.types.map((member) => normalised.get(member).text);
      // Set, because `A | A` is `A`: a duplicate from a reordered build is not
      // a difference either.
      text = [...new Set(members)].sort().join(" | ");
    }
    const result = { start, end, original: source.slice(start, end), text };
    normalised.set(node, result);
    return result;
  };

  // The source file itself is not a type, so its own text is rebuilt from the
  // edits its children made — every character this function is not about stays
  // exactly as the bundler emitted it.
  const root = visit(sourceFile);
  return root.text;
}

const isDeclaration = (file) => file.endsWith(".d.ts");

/**
 * Differences between two release trees, as human-readable lines.
 *
 * Everything is byte-compared except `.d.ts`, which is compared through
 * `canonicalDeclarations`. `RELEASE.json` is excluded: it records the commit
 * its own tree was built from, so two trees built from different commits can
 * never agree on it.
 */
export async function compareTrees(a, b) {
  const differences = [];
  const left = (await walk(a)).filter((file) => file !== "RELEASE.json");
  const right = (await walk(b)).filter((file) => file !== "RELEASE.json");
  const rightSet = new Set(right);
  const leftSet = new Set(left);

  for (const file of left) if (!rightSet.has(file)) differences.push(`only in the staged tree: ${file}`);
  for (const file of right) if (!leftSet.has(file)) differences.push(`only in a fresh build: ${file}`);

  for (const file of left) {
    if (!rightSet.has(file)) continue;
    const [staged, fresh] = await Promise.all([
      readFile(path.join(a, file), "utf8"),
      readFile(path.join(b, file), "utf8"),
    ]);
    if (staged === fresh) continue;
    if (isDeclaration(file) && canonicalDeclarations(staged, file) === canonicalDeclarations(fresh, file)) {
      differences.push(`reordered only: ${file}`);
      continue;
    }
    differences.push(`differs: ${file}`);
  }
  return differences;
}

/**
 * Unpack the packed artifact into `dir` and reduce it to the release tree.
 *
 * `--strip-components=1` drops the tarball's own `package/` prefix, so what
 * lands in `dir` is the directory a consumer ends up with.
 */
export async function materialiseRelease(dir, { pkgDir, repoRoot, sourceCommit = null }) {
  const tarball = await ensurePack(pkgDir);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await run("tar", ["-xzf", tarball, "-C", dir, "--strip-components=1"]);

  const packedPath = path.join(dir, "package.json");
  const packed = JSON.parse(await readFile(packedPath, "utf8"));
  const manifest = structuredClone(packed);
  for (const field of OMIT_FIELDS) delete manifest[field];
  await writeFile(packedPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const files = await walk(dir);
  const commit =
    sourceCommit ??
    (await run("git", ["rev-parse", "HEAD"], { cwd: repoRoot }).then(
      (result) => result.stdout.trim(),
      () => null,
    ));

  const provenance = {
    name: manifest.name,
    version: manifest.version,
    generator: "packages/ui/scripts/release-artifact.mjs",
    source: {
      repository: "https://github.com/lucxu495/luc-ui",
      commit,
      path: "packages/ui",
      note: "Generated from this commit by `pnpm --filter @luc/ui release:build`. Do not edit by hand.",
    },
    artifact: {
      tarball: path.basename(tarball),
      files: files.length,
      manifestSha256: createHash("sha256")
        .update(await readFile(packedPath))
        .digest("hex"),
      /*
       * Recorded because it is the one thing a maintainer will otherwise
       * discover by surprise: the bundler emits the members of a union type in
       * an order that changes between builds. JavaScript, CSS and the manifest
       * are byte-reproducible; declarations are compared with union members
       * sorted (`compareTrees`). See docs/RELEASES.md.
       */
      reproducible:
        "JavaScript, CSS and package.json are byte-identical across builds; declaration union member order is not stable.",
    },
  };
  await writeFile(path.join(dir, "RELEASE.json"), `${JSON.stringify(provenance, null, 2)}\n`, "utf8");

  return { tarball, packed, manifest, provenance, files: [...files, "RELEASE.json"] };
}

/**
 * Assert that the release tree describes the same package the tarball does.
 *
 * This is the check that would catch the failure the design exists to prevent:
 * a lost `publishConfig`, a renamed entry, or a manifest that quietly stopped
 * publishing `dist`.
 */
export function assertReleaseMatchesPack(release) {
  for (const field of RUNTIME_FIELDS) {
    const packed = JSON.stringify(release.packed[field]);
    const manifest = JSON.stringify(release.manifest[field]);
    if (packed !== manifest) {
      throw new Error(`packed manifest field "${field}" changed under the release: ${packed} → ${manifest}`);
    }
  }
  if (release.manifest.exports?.["."]?.default !== "./dist/index.js") {
    throw new Error(`release manifest does not export dist: ${JSON.stringify(release.manifest.exports?.["."])}`);
  }
  for (const required of REQUIRED_FILES) {
    if (!release.files.includes(required)) throw new Error(`release artifact is missing ${required}`);
  }
  const leaked = release.files.filter((file) => file.startsWith("src/"));
  if (leaked.length > 0) throw new Error(`release artifact leaks source: ${leaked.slice(0, 3).join(", ")}`);
}
