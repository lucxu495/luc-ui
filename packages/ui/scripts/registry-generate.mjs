/**
 * Generate a source registry: LUC UI components as installable source.
 *
 * Two distribution mechanisms, and this is the second one. The package
 * (`dist/`) is what most consumers install. A *source registry* is the other
 * half of the conversation: the component file itself, plus everything it
 * imports, dropped into the consumer's tree so they can read and edit it.
 *
 * The rule that makes it honest: **the item is derived, never retyped.** This
 * script walks the real import graph of the real `packages/ui/src` module,
 * follows relative imports to their transitive closure, rewrites them to the
 * consumer's alias, and records the external packages with the versions this
 * repository actually pins. A hand-maintained second copy of a component is a
 * copy that drifts, which is the failure mode shadcn's registry model is most
 * often accused of.
 *
 *   node packages/ui/scripts/registry-generate.mjs            # write
 *   node packages/ui/scripts/registry-generate.mjs --check    # fail if stale
 *
 * Output:
 *   packages/ui/registry/registry.json          the manifest
 *   packages/ui/registry/items/<name>/**        the transformed files
 *
 * Scope note: this is a proof of concept with a small, deliberately chosen item
 * set. Files are copied for *two* items plus the shared utility item, and
 * `registry-verify.mjs` compiles them in a clean fixture. Items that would
 * require a plugin, a Tailwind preset or a provider tree are out of scope and
 * are listed as such rather than shipped broken.
 */

import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "..");
const srcRoot = path.join(packageRoot, "src");
const outRoot = path.join(packageRoot, "registry");
const itemsRoot = path.join(outRoot, "items");

const check = process.argv.includes("--check");

/** Where extracted files land in a consuming project. */
const TARGET_ROOT = "components/luc-ui";
const ALIAS = "@/components/luc-ui";

const packageJson = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
const available = {
  ...(packageJson.dependencies ?? {}),
  ...(packageJson.peerDependencies ?? {}),
};

/**
 * The registry items.
 *
 * `registryDependencies` mirrors shadcn's model: a component that imports the
 * shared `cn` helper depends on the `luc-utils` item rather than vendoring a
 * second copy, so a consumer who installs three components gets one helper.
 */
const ITEMS = [
  {
    name: "luc-utils",
    title: "LUC shared utilities",
    description:
      "The class-name merge and the media/reduced-motion hooks every LUC component is built on.",
    entry: ["utils/cn.ts", "hooks/use-reduced-motion.ts"],
    registryDependencies: [],
  },
  {
    name: "luc-badge",
    title: "Badge",
    description: "A short label for a state, a count or a category, with the Tag variant.",
    entry: ["components/badge.tsx"],
    registryDependencies: ["luc-utils"],
  },
  {
    name: "luc-spinner",
    title: "Spinner",
    description: "An indeterminate wait that stops moving when the user asks for less motion.",
    entry: ["components/spinner.tsx"],
    registryDependencies: ["luc-utils"],
  },
  {
    name: "luc-skeleton",
    title: "Skeleton",
    description: "A placeholder that reserves the shape of what is loading.",
    entry: ["components/skeleton.tsx"],
    registryDependencies: ["luc-utils"],
  },
];

/** Every `from "…"` specifier in a source file. */
function importsOf(source) {
  const specifiers = [];
  for (const match of source.matchAll(/from\s+"([^"]+)"/g)) specifiers.push(match[1]);
  for (const match of source.matchAll(/import\s+"([^"]+)"/g)) specifiers.push(match[1]);
  return specifiers;
}

async function resolveRelative(fromFile, specifier) {
  const base = path.resolve(path.dirname(fromFile), specifier);
  for (const candidate of [`${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]) {
    try {
      await readFile(candidate, "utf8");
      return candidate;
    } catch {
      /* try the next shape */
    }
  }
  throw new Error(`registry-generate: could not resolve "${specifier}" from ${fromFile}`);
}

/** Follow relative imports to their closure, and collect external packages. */
async function closure(entryFiles) {
  const files = new Map();
  const external = new Set();
  const queue = [...entryFiles.map((file) => path.join(srcRoot, file))];
  while (queue.length) {
    const file = queue.shift();
    if (files.has(file)) continue;
    const source = await readFile(file, "utf8");
    files.set(file, source);
    for (const specifier of importsOf(source)) {
      if (specifier.startsWith(".")) {
        queue.push(await resolveRelative(file, specifier));
      } else if (!specifier.startsWith("node:")) {
        external.add(specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]);
      }
    }
  }
  return { files, external };
}

/** `src/utils/cn.ts` → `@/components/luc-ui/utils/cn`. */
function aliasFor(file) {
  const relative = path.relative(srcRoot, file).replace(/\.tsx?$/, "");
  return `${ALIAS}/${relative}`;
}

/** Rewrite every relative import in a file to the consumer's alias. */
function rewrite(source, file, files) {
  return source.replace(/from\s+"(\.[^"]+)"/g, (match, specifier) => {
    const resolved = path.resolve(path.dirname(file), specifier);
    const candidates = [`${resolved}.ts`, `${resolved}.tsx`, path.join(resolved, "index.ts")];
    const target = candidates.find((candidate) => files.has(candidate));
    if (!target) throw new Error(`registry-generate: ${file} imports ${specifier}, which is outside the item`);
    return `from "${aliasFor(target)}"`;
  });
}

const manifestItems = [];
const written = [];
/*
 * Which item owns which source file.
 *
 * A component that imports the shared `cn` helper depends on the `luc-utils`
 * item; it must *not* also vendor its own copy, or a consumer who installs
 * three components gets three divergent copies of the helper — the exact
 * duplication the dependency edge exists to prevent. Items are therefore
 * processed in declaration order (the shared item first) and any file already
 * owned by a declared dependency is dropped from the dependent item.
 */
const owner = new Map();

for (const item of ITEMS) {
  const { files, external } = await closure(item.entry);
  const dependencies = [...external].filter((name) => name in available).sort();
  const unknown = [...external].filter((name) => !(name in available));
  if (unknown.length) {
    throw new Error(
      `registry-generate: ${item.name} imports ${unknown.join(", ")}, which the package does not declare`,
    );
  }
  const itemFiles = [];
  for (const [file, source] of files) {
    const ownedBy = owner.get(file);
    if (ownedBy && ownedBy !== item.name) {
      if (!item.registryDependencies.includes(ownedBy)) {
        throw new Error(
          `registry-generate: ${item.name} uses ${path.relative(srcRoot, file)} owned by ${ownedBy} ` +
            `but does not declare it in registryDependencies`,
        );
      }
      continue;
    }
    owner.set(file, item.name);
    const relative = path.relative(srcRoot, file);
    const target = `${TARGET_ROOT}/${relative}`;
    const content = rewrite(source, file, files);
    const outputPath = path.join(itemsRoot, item.name, relative);
    await mkdir(path.dirname(outputPath), { recursive: true });
    await writeFile(outputPath, content, "utf8");
    written.push(path.relative(packageRoot, outputPath));
    itemFiles.push({ path: target, type: relative.endsWith(".tsx") ? "registry:component" : "registry:lib" });
  }
  manifestItems.push({
    name: item.name,
    type: "registry:ui",
    title: item.title,
    description: item.description,
    dependencies: dependencies.map((name) => `${name}@${available[name]}`),
    registryDependencies: item.registryDependencies,
    /* Source distribution does not carry the compiled stylesheet. */
    cssVars: {},
    styles: { "@luc/ui/styles.css": {} },
    files: itemFiles,
  });
}

const manifest = {
  $schema: "https://ui.shadcn.com/schema/registry.json",
  name: "luc-ui",
  homepage: "https://luc-ui.invalid",
  items: manifestItems,
};
const manifestPath = path.join(outRoot, "registry.json");
const manifestText = `${JSON.stringify(manifest, null, 2)}\n`;

/* An index of what the registry contains, for the documentation page. */
const index = {
  generatedFrom: ["packages/ui/src (import closure)", "packages/ui/package.json"],
  items: manifestItems.map((item) => ({
    name: item.name,
    title: item.title,
    description: item.description,
    files: item.files.length,
    dependencies: item.dependencies,
    registryDependencies: item.registryDependencies,
  })),
};
const indexPath = path.join(outRoot, "index.json");
const indexText = `${JSON.stringify(index, null, 2)}\n`;

if (check) {
  const current = await readFile(manifestPath, "utf8").catch(() => null);
  const currentIndex = await readFile(indexPath, "utf8").catch(() => null);
  if (current !== manifestText || currentIndex !== indexText) {
    console.error("registry-generate: packages/ui/registry is stale");
    console.error("Run: node packages/ui/scripts/registry-generate.mjs");
    process.exit(1);
  }
  console.log(`registry: up to date (${manifestItems.length} items)`);
  process.exit(0);
}

await writeFile(manifestPath, manifestText, "utf8");
await writeFile(indexPath, indexText, "utf8");
console.log(`registry: ${manifestItems.length} items, ${written.length} files`);
for (const item of manifestItems) {
  console.log(`  ${item.name.padEnd(14)} ${item.files.length} file(s)  deps: ${item.dependencies.join(", ") || "none"}`);
}

/* Keep the item directory in step with the manifest: a deleted item must not
   leave orphaned source behind, which is how a registry starts shipping files
   nobody declared. */
const expected = new Set(ITEMS.map((item) => item.name));
for (const entry of await readdir(itemsRoot, { withFileTypes: true }).catch(() => [])) {
  if (entry.isDirectory() && !expected.has(entry.name)) {
    await rm(path.join(itemsRoot, entry.name), { recursive: true, force: true });
    console.log(`  removed stale item directory: ${entry.name}`);
  }
}
