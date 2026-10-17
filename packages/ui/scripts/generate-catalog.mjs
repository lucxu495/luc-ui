/** Generate the public catalog from package exports and TypeScript, then check docs examples. */
import assert from "node:assert/strict";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import {
  assertNoAbsolutePaths,
  normalizeSignature,
  runPathFixtures,
} from "./lib/catalog-signature.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uiRoot = path.resolve(root, "../..");

/*
 * Fail before generation if the path rewrite stops being deterministic. This
 * runs for `catalog:generate`, `catalog:check` and `--self-test`, so the
 * standing `verify:package` gate covers it.
 */
const fixtureCount = runPathFixtures(uiRoot);

const pkg = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const annotations = JSON.parse(await readFile(path.join(root, "scripts/catalog-annotations.json"), "utf8"));
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsed.fileNames, parsed.options);
const checker = program.getTypeChecker();

function entryExports(entry, target) {
  const file = program.getSourceFile(path.resolve(root, target));
  if (!file) throw new Error(`No TypeScript source for ${entry}: ${target}`);
  const module = checker.getSymbolAtLocation(file);
  if (!module) throw new Error(`No module symbol for ${entry}: ${target}`);
  return checker.getExportsOfModule(module).map((exported) => {
    const actual = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    const declaration = actual.valueDeclaration ?? actual.declarations?.[0];
    const kind = actual.flags & ts.SymbolFlags.Value ? "value" : "type";
    let signature = "";
    if (declaration) {
      const type = kind === "value"
        ? checker.getTypeOfSymbolAtLocation(actual, declaration)
        : checker.getDeclaredTypeOfSymbol(actual);
      // Normalize *before* truncating: an absolute pnpm path changes the
      // string length, so truncating first would make the cut itself
      // machine-dependent.
      signature = normalizeSignature(
        checker.typeToString(type, declaration, ts.TypeFormatFlags.NoTruncation).replace(/\s+/g, " "),
        { uiRoot },
      );
      if (signature.length > 320) signature = `${signature.slice(0, 317)}...`;
    }
    return {
      name: exported.name,
      kind,
      signature,
      source: declaration ? path.relative(uiRoot, declaration.getSourceFile().fileName).replaceAll(path.sep, "/") : target,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

const sourceKeys = Object.keys(pkg.exports).sort();
const packedKeys = Object.keys(pkg.publishConfig.exports).sort();
function validateExportParity(source, packed) {
  assert.deepEqual(source, packed, "source and packed export paths differ");
}
validateExportParity(sourceKeys, packedKeys);
for (const key of Object.keys(annotations)) assert(sourceKeys.includes(key), `annotation has no export: ${key}`);
for (const [key, annotation] of Object.entries(annotations)) {
  if (!annotation.showcase) continue;
  const routeFile = path.join(uiRoot, "apps/showcase/app", annotation.showcase, "page.tsx");
  assert(await stat(routeFile).catch(() => null), `${key}: missing Showcase page ${routeFile}`);
}

const entries = {};
for (const key of sourceKeys) {
  const target = pkg.exports[key];
  const packed = pkg.publishConfig.exports[key];
  const item = {
    import: key === "." ? "@luc/ui" : `@luc/ui/${key.slice(2)}`,
    source: target,
    packed,
    status: "public",
    recommended: Boolean(annotations[key]?.use),
    ...annotations[key],
  };
  if (target.endsWith(".ts") || target.endsWith(".tsx")) item.exports = entryExports(key, target);
  entries[key] = item;
}
const catalog = { generatedFrom: ["packages/ui/package.json", "packages/ui/src public barrels", "packages/ui/scripts/catalog-annotations.json"], entries };
assertNoAbsolutePaths(catalog);
const json = `${JSON.stringify(catalog, null, 2)}\n`;

const rows = sourceKeys.filter((key) => key !== "." && key !== "./package.json").map((key) => {
  const item = entries[key];
  const values = item.exports?.filter((symbol) => symbol.kind === "value").map((symbol) => symbol.name).join(", ") ?? (key.endsWith(".css") ? "CSS" : "Package metadata");
  const route = item.showcase ? `[Example](${`../apps/showcase/app${item.showcase}/page.tsx`})` : "—";
  return `| \`${item.import}\` | ${item.category ?? "Utility"} | ${values} | ${route} |`;
});
/*
 * The preamble names what generates, what *verifies* and where the machine
 * readable half lives. The middle clause is not decoration: `COMPONENT_INVENTORY.md`
 * and the tests that guard it both point a reader at "the checked artefact", and
 * a preamble that does not say which command does the checking leaves the claim
 * unverifiable from the file itself.
 */
const markdown = `# Luc UI component catalog\n\nGenerated by \`packages/ui/scripts/generate-catalog.mjs\` — **the source of truth for what the package exports**, checked by \`pnpm --filter @luc/ui catalog:check\`, which fails when this file and the package barrels disagree. Do not edit this list by hand. The [machine-readable catalog](./component-catalog.json) includes every exported value and type, its TypeScript signature, declaring source file, and packed target. The [developer guide](./DEVELOPER_GUIDE.md) explains composition and setup. Exact supported names come from the public barrels; a source file alone is not a public import path. Rows show *publicly reachable* symbols, including low-level helpers. The annotated entries below are recommended composition starting points; internal files without a declared export path are unsupported imports.\n\n| Import | Category | Exported runtime symbols | Showcase |\n| --- | --- | --- | --- |\n${rows.join("\n")}\n\n## Annotated usage\n\n${sourceKeys.filter((key) => annotations[key]?.use).map((key) => `### \`${entries[key].import}\`\n\n- Use: ${entries[key].use}\n- Avoid: ${entries[key].avoid}\n- Accessibility: ${entries[key].a11y}\n`).join("\n")}\n`;

function validateImports(content, label) {
  const failures = [];
  const imports = /\bimport\s+(?:type\s+)?(?:\{([^}]+)\}|[^"']+?)\s+from\s+["'](@luc\/ui(?:\/[\w./-]+)?)["']|\bimport\s+["'](@luc\/ui(?:\/[\w./-]+)?)["']/g;
  for (const match of content.matchAll(imports)) {
    const specifier = match[2] ?? match[3];
    const key = specifier === "@luc/ui" ? "." : `./${specifier.slice("@luc/ui/".length)}`;
    if (!entries[key]) { failures.push(`${label}: unknown import ${specifier}`); continue; }
    if (match[1] && entries[key].exports) {
      const names = new Set(entries[key].exports.map((symbol) => symbol.name));
      for (const part of match[1].split(",")) {
        const name = part.trim().replace(/^type\s+/, "").split(/\s+as\s+/)[0];
        if (name && !names.has(name)) failures.push(`${label}: ${name} is not exported by ${specifier}`);
      }
    }
  }
  return failures;
}

function validateListedPaths(content, label) {
  const failures = [];
  for (const line of content.split("\n")) {
    if (!line.startsWith("|")) continue;
    for (const match of line.matchAll(/`(@luc\/ui(?:\/[\w./-]+)?)`/g)) {
      const specifier = match[1];
      const key = specifier === "@luc/ui" ? "." : `./${specifier.slice("@luc/ui/".length)}`;
      if (!entries[key]) failures.push(`${label}: unknown listed path ${specifier}`);
    }
  }
  return failures;
}

const guides = (await readdir(path.join(uiRoot, "docs")))
  .filter((name) => name.endsWith("_GUIDE.md"))
  .map((name) => `docs/${name}`);
const docs = ["README.md", "packages/ui/README.md", "docs/PUBLIC_API.md", "docs/COMPONENT_INVENTORY.md", "docs/DEVELOPER_GUIDE.md", "skills/luc-ui/SKILL.md", ...guides];
const failures = [];
for (const doc of docs) {
  const content = await readFile(path.join(uiRoot, doc), "utf8").catch(() => "");
  failures.push(...validateImports(content, doc));
  if (doc === "docs/PUBLIC_API.md" || doc === "docs/COMPONENT_INVENTORY.md") {
    failures.push(...validateListedPaths(content, doc));
  }
}

const mode = process.argv[2];
if (mode === "--self-test") {
  assert(validateImports('import { NotAnExport } from "@luc/ui/components/button";', "fixture").length === 1);
  assert(validateImports('import { Button } from "@luc/ui/not-real";', "fixture").length === 1);
  assert(validateListedPaths('| Example | `@luc/ui/not-real` |', "fixture").length === 1);
  assert.throws(() => validateExportParity([...sourceKeys, "./not-real"], packedKeys));
  assert.equal(
    normalizeSignature(
      '({ ...props }: Props) => import("/Users/luc/luc-quant/node_modules/.pnpm/@types+react@19.3.0/node_modules/@types/react/index").JSX.Element',
      { uiRoot },
    ),
    '({ ...props }: Props) => import("@types/react").JSX.Element',
    "signature normalization fixture",
  );
  assert.throws(
    () => assertNoAbsolutePaths({ entries: { ".": { exports: [{ name: "Leaky", signature: 'import("/home/luc/x")' }] } } }),
    /machine-specific absolute paths/,
    "absolute-path guard fixture",
  );
  console.log(
    `catalog: deliberate symbol, documented path, and export-map mismatches detected; ${fixtureCount} path fixtures pass`,
  );
} else if (mode === "--check") {
  const existingJson = await readFile(path.join(uiRoot, "docs/component-catalog.json"), "utf8").catch(() => "");
  const existingMarkdown = await readFile(path.join(uiRoot, "docs/COMPONENT_CATALOG.md"), "utf8").catch(() => "");
  if (existingJson !== json) failures.push("docs/component-catalog.json is stale");
  if (existingMarkdown !== markdown) failures.push("docs/COMPONENT_CATALOG.md is stale");
  if (failures.length) { console.error(failures.join("\n")); process.exitCode = 1; }
  else console.log(`catalog: ${sourceKeys.length} public paths, all documented imports resolve, ${fixtureCount} path fixtures pass`);
} else if (!mode) {
  if (failures.length) throw new Error(failures.join("\n"));
  await writeFile(path.join(uiRoot, "docs/component-catalog.json"), json);
  await writeFile(path.join(uiRoot, "docs/COMPONENT_CATALOG.md"), markdown);
  console.log(`catalog: generated ${sourceKeys.length} public paths, ${fixtureCount} path fixtures pass`);
} else throw new Error(`Unknown option: ${mode}`);
