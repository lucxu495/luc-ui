/**
 * Verify the chart catalogue, and print the count it actually implies.
 *
 * A catalogue is the easiest document in a library to inflate: rename a prop,
 * add a cosmetic variant, and the marketing number grows while the capability
 * does not. This script removes the temptation by checking the registry in
 * `components/charts/chart-catalog-data.ts` against the package's real exports:
 *
 *   1. every `symbol` must exist as an export of `@luc/ui/charts`;
 *   2. every entry `id` must be unique;
 *   3. no symbol may be claimed twice by two entries in the same group;
 *   4. the counts are printed by category, so "78 public types" can only mean
 *      what the table below says it means.
 *
 *   node apps/showcase/scripts/chart-catalog.mjs            # report
 *   node apps/showcase/scripts/chart-catalog.mjs --json     # machine-readable
 *   node apps/showcase/scripts/chart-catalog.mjs --exports  # resolved export list
 *
 * Exit code 1 on a broken claim, so `pnpm verify` fails rather than shipping a
 * catalogue that promises an import nobody can make.
 */

import { readFile, readdir, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const run = promisify(execFile);

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const uiRoot = path.resolve(appRoot, "../../packages/ui");
const registryPath = path.join(appRoot, "components/charts/chart-catalog-data.ts");
const chartsSource = path.join(uiRoot, "src/charts");

/**
 * Load the registry.
 *
 * It is a `.ts` module with no runtime imports, so transpiling it in memory and
 * importing the result keeps one source of truth — the same file the page and
 * the Next build read. A generated JSON copy would be a second thing to forget.
 */
async function loadRegistry() {
  const source = await readFile(registryPath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: "chart-catalog-data.ts",
  }).outputText;
  const target = path.join(os.tmpdir(), `luc-chart-catalog-${process.pid}.mjs`);
  await writeFile(target, js, "utf8");
  const loaded = await import(`file://${target}`);
  return { loaded, source };
}

/** Every symbol the charts entry point actually exports. */
async function loadChartExports() {
  const exports = new Set();
  const walk = async (dir) => {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "adapters") continue; // internal by contract
        await walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name) || entry.name.includes(".test.")) continue;
      const source = await readFile(full, "utf8");
      const sf = ts.createSourceFile(full, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      for (const statement of sf.statements) {
        if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
          continue;
        }
        if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
          if (statement.name) exports.add(statement.name.text);
        } else if (ts.isVariableStatement(statement)) {
          for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name)) exports.add(declaration.name.text);
          }
        } else if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
          exports.add(statement.name.text); // a type is a legitimate symbol claim
        }
      }
    }
  };
  await walk(chartsSource);
  return exports;
}

const { loaded: registry, source } = await loadRegistry();
const { chartGroups, chartVariants, publicChartSymbols, chartStatusCounts, alternateEngineEntries } = registry;

/** Entries by kind: a plot type, a variant of one, or a composition of two. */
function byKind(groups, kind) {
  return groups.flatMap((group) =>
    group.entries.filter((entry) => entry.status === "public" && entry.kind === kind),
  );
}
const exported = await loadChartExports();

const problems = [];
const seenIds = new Set();
const publicSymbols = publicChartSymbols(chartGroups);
const publicEntries = chartGroups.flatMap((group) => group.entries).filter((entry) => entry.status === "public");

for (const group of chartGroups) {
  for (const entry of group.entries) {
    if (seenIds.has(entry.id)) problems.push(`duplicate entry id: ${entry.id}`);
    seenIds.add(entry.id);
    for (const symbol of entry.symbol.split(/·|\+/).map((part) => part.trim())) {
      if (symbol === "—" || !symbol) continue;
      if (!exported.has(symbol)) {
        problems.push(`${group.id}/${entry.id}: \`${symbol}\` is not exported by @luc/ui/charts`);
      }
    }
    if (entry.status === "public" && entry.symbol === "—") {
      problems.push(`${group.id}/${entry.id}: public entry with no public symbol`);
    }
    if ((entry.status === "planned" || entry.status === "blocked") && /^[A-Z]/.test(entry.symbol)) {
      // A planned or blocked row must not name a component: the symbol check
      // above would then demand an export that does not exist.
      problems.push(`${group.id}/${entry.id}: a ${entry.status} entry names a component symbol`);
    }
    if (!["plot", "variant", "composite"].includes(entry.kind)) {
      problems.push(`${group.id}/${entry.id}: unknown kind \`${entry.kind}\``);
    }
    if (entry.kind === "composite" && !entry.symbol.includes("+")) {
      problems.push(`${group.id}/${entry.id}: a composite entry must name two components with \`+\``);
    }
  }
}

// A symbol may legitimately appear in two groups (a plot and its workflow use);
// within one group it must not be claimed twice by two different ids.
for (const group of chartGroups) {
  const byCode = new Map();
  for (const entry of group.entries) {
    // A composite entry names the two components it composes; that is a
    // deliberate second mention, not a duplicate claim.
    if (entry.kind === "composite") continue;
    for (const symbol of entry.symbol.split(/·|\+/).map((part) => part.trim())) {
      if (!/^[A-Z]/.test(symbol)) continue;
      const previous = byCode.get(symbol);
      if (previous && previous !== entry.id) {
        problems.push(`${group.id}: \`${symbol}\` is claimed by both ${previous} and ${entry.id}`);
      }
      byCode.set(symbol, entry.id);
    }
  }
}

const counts = chartStatusCounts(chartGroups);
const plotTypes = byKind(chartGroups, "plot");
const variantsInGroups = byKind(chartGroups, "variant");
const composites = byKind(chartGroups, "composite");
const report = {
  generatedAt: new Date().toISOString(),
  groups: chartGroups.length,
  entries: chartGroups.flatMap((group) => group.entries).length,
  status: counts,
  publicPlotTypes: plotTypes.length,
  publicVariants: variantsInGroups.length,
  publicComposites: composites.length,
  publicComponents: publicSymbols.length,
  alternateEngineEntries: alternateEngineEntries(chartGroups).map((entry) => ({
    id: entry.id,
    engine: entry.engine,
    symbol: entry.symbol,
  })),
  rendererImplementations: [...new Set(publicEntries.map((entry) => entry.engine))].sort(),
  variants: chartVariants.length,
  plannedCapabilities: chartGroups
    .flatMap((group) => group.entries)
    .filter((entry) => entry.status === "planned" || entry.status === "blocked")
    .map((entry) => `${entry.id} (${entry.status})`),
  publicSymbols,
  problems,
};

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else if (process.argv.includes("--exports")) {
  console.log([...exported].sort().join("\n"));
} else {
  console.log("LUC UI chart catalogue — verified against @luc/ui/charts");
  console.log(`  groups                : ${report.groups}`);
  console.log(`  documentation entries : ${report.entries}`);
  console.log(
    `  status                : public ${counts.public} · engine ${counts.engine} · planned ${counts.planned} · blocked ${counts.blocked}`,
  );
  console.log(
    `  distinct public plots : ${report.publicPlotTypes} (plus ${report.publicVariants} variant(s) and ${report.publicComposites} composition)`,
  );
  console.log(`  distinct public components: ${report.publicComponents}`);
  console.log(`  renderer adapters used: ${report.rendererImplementations.join(", ")}`);
  console.log(`  variants (not types)  : ${report.variants}`);
  console.log(`  planned/blocked       : ${report.plannedCapabilities.join(", ") || "none"}`);
  console.log(`  registry              : ${path.relative(process.cwd(), registryPath)} (${source.split("\n").length} lines)`);
  if (report.alternateEngineEntries.length > 0) {
    console.log("  non-default renderers :");
    for (const entry of report.alternateEngineEntries) {
      console.log(`      ${entry.id} → ${entry.engine} (${entry.symbol})`);
    }
  }
}

if (problems.length > 0) {
  console.error(`\n  ${problems.length} catalogue claim(s) do not hold:`);
  for (const problem of problems) console.error(`    ${problem}`);
  process.exitCode = 1;
}

void run;
