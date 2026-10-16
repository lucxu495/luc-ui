/**
 * The prose inside the chart registry.
 *
 * `chart-catalog-data.ts` is data, not JSX: the translator-facing strings are
 * property values (`name`, `description`, `note`) rather than text nodes, so
 * the JSX extractor in `i18n-prose.mjs` cannot see them. They are still prose —
 * they render on `/charts/catalog` — so they are collected here, from the same
 * module the page imports, and dropped into the coverage and worklist scripts.
 *
 * Identifiers are deliberately not collected: a `symbol`, an `id` and an
 * `engine` are code.
 */

import { readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { normalize } from "./i18n-prose.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, "..");
const registryPath = path.join(appRoot, "components/charts/chart-catalog-data.ts");

export async function loadCatalogProse() {
  const source = await readFile(registryPath, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: "chart-catalog-data.ts",
  }).outputText;
  const target = path.join(os.tmpdir(), `luc-catalog-strings-${process.pid}.mjs`);
  await writeFile(target, js, "utf8");
  const { chartGroups, chartVariants } = await import(`file://${target}`);

  const strings = [];
  const text = (value) => {
    if (typeof value === "string" && value.trim()) strings.push(normalize(value));
  };
  for (const group of chartGroups) {
    text(group.title);
    text(group.description);
    for (const entry of group.entries) {
      text(entry.name);
      text(entry.note);
    }
  }
  for (const variant of chartVariants) {
    text(variant.name);
    text(variant.note);
  }
  return { strings, chartGroups, chartVariants };
}

/**
 * How many documented entries each group holds, read from the registry.
 *
 * `"group": "components"` appears on entries *and* on the family rows that
 * describe them, so counting occurrences of the string over-reports by exactly the
 * number of families (13 components, 9 charts, 5 motion). Counting the entry array
 * with the AST is the only figure that matches what the pages derive.
 */
export async function loadRegistryGroupCounts() {
  const registryPath = path.join(appRoot, "lib/docs/generated/registry.ts");
  const source = await readFile(registryPath, "utf8");
  const sf = ts.createSourceFile(registryPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const counts = {};
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "generatedEntries" &&
      node.initializer
    ) {
      let array = node.initializer;
      while (ts.isAsExpression(array) || ts.isSatisfiesExpression?.(array)) array = array.expression;
      if (ts.isArrayLiteralExpression(array)) {
        for (const element of array.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          for (const property of element.properties) {
            if (!ts.isPropertyAssignment(property)) continue;
            /* The generated file writes quoted keys (`"group": "motion"`), so the
             * name is a string literal, not an identifier. */
            const key =
              ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
                ? property.name.text
                : null;
            if (key === "group" && ts.isStringLiteral(property.initializer)) {
              counts[property.initializer.text] = (counts[property.initializer.text] ?? 0) + 1;
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return counts;
}

/**
 * The lead sentences the generated registry renders.
 *
 * `lib/docs/generated/registry.ts` is data produced by `docs-registry.mjs`, and
 * the page header prints `entry.summary` (through `entryLead()`), so these
 * strings are visible prose on every registry page — but no source file names
 * them, which is exactly why the coverage check used to report 100% while ~157
 * Chinese pages opened with an English sentence. Reading them here makes the
 * check measure what a reader actually sees, and turns the gap into a worklist
 * (`i18n-pending.mjs`) instead of a silent hole.
 */
export async function loadRegistryProse() {
  const registryPath = path.join(appRoot, "lib/docs/generated/registry.ts");
  const source = await readFile(registryPath, "utf8");
  /*
   * Read with the TypeScript AST, not with a regex and not by importing.
   *
   * A regex that guessed "the route next to this summary" attributed all 227
   * summaries to all 173 routes and inflated the sentence count by 40 000; and
   * transpiling to a temp module works under plain node but not inside vitest,
   * whose module runner owns `import()`. The AST has neither problem: the object
   * keys are read by name, so the attribution cannot drift and the function is
   * callable from a unit test.
   */
  const sf = ts.createSourceFile(registryPath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const arrays = new Map();
  const propertyOf = (object, name) => {
    for (const property of object.properties) {
      if (!ts.isPropertyAssignment(property)) continue;
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name) ? property.name.text : null;
      if (key === name && ts.isStringLiteral(property.initializer)) return property.initializer.text;
    }
    return undefined;
  };
  const collect = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      ["generatedEntries", "generatedGroups", "generatedFamilies"].includes(node.name.text) &&
      node.initializer &&
      node.initializer
    ) {
      /* `[...] as const satisfies readonly DocEntry[]` nests two wrappers. */
      let array = node.initializer;
      while (ts.isAsExpression(array) || ts.isSatisfiesExpression?.(array)) array = array.expression;
      const rows = [];
      if (ts.isArrayLiteralExpression(array)) {
        for (const element of array.elements) {
          if (!ts.isObjectLiteralExpression(element)) continue;
          const route = propertyOf(element, "route");
          const summary = propertyOf(element, "summary");
          if (route && summary) {
            rows.push({
              route,
              summary,
              chartName: propertyOf(element, "chartName"),
              family: propertyOf(element, "family"),
            });
          }
        }
      }
      arrays.set(node.name.text, rows);
    }
    ts.forEachChild(node, collect);
  };
  collect(sf);
  /*
   * The chart lead the page actually prints.
   *
   * `entryLead()` returns the sentence `lead.ts` holds for the chart's *family*,
   * so the string looked up in the dictionary is that family's sentence, not the
   * stored copy on the entry. Read the map from its own module rather than
   * copying it here: a second copy is a translation key that silently stops
   * matching.
   *
   * Read the whole map, not one template. DOC-003 replaced the single
   * `CHART_LEAD_TEMPLATE` with one sentence per chart family, and this function
   * still looked for the old constant name: it found nothing, `add()` skipped
   * every chart entry for want of a string, and the coverage gate quietly counted
   * 72 fewer sentences instead of failing. A loader that misses the copy it is
   * supposed to check is worse than one that throws.
   */
  const leadSource = await readFile(path.join(appRoot, "lib/docs/lead.ts"), "utf8");
  const leadFile = ts.createSourceFile("lead.ts", leadSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const CHART_LEADS = new Map();
  const findLeadMap = (node) => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "CHART_LEAD_BY_FAMILY" &&
      node.initializer &&
      ts.isObjectLiteralExpression(node.initializer)
    ) {
      for (const property of node.initializer.properties) {
        if (!ts.isPropertyAssignment(property) || !ts.isStringLiteral(property.initializer)) continue;
        const key = ts.isStringLiteral(property.name) ? property.name.text : null;
        if (key) CHART_LEADS.set(key, property.initializer.text);
      }
    }
    ts.forEachChild(node, findLeadMap);
  };
  findLeadMap(leadFile);
  if (CHART_LEADS.size === 0) {
    throw new Error(
      "chart-catalog-strings: no `CHART_LEAD_BY_FAMILY` sentences found in lib/docs/lead.ts — the coverage " +
        "gate would silently stop checking chart leads.",
    );
  }
  /** The sentence `entryLead()` prints for one entry: its family's, or general's. */
  const chartLeadFor = (entry) =>
    CHART_LEADS.get(entry.family) ?? CHART_LEADS.get("chart-general") ?? null;

  const rows = [];
  const add = (route, value) => {
    if (typeof value === "string" && value.trim()) rows.push({ route, summary: normalize(value) });
  };
  for (const entry of arrays.get("generatedEntries") ?? []) {
    add(entry.route, entry.chartName ? chartLeadFor(entry) : entry.summary);
  }
  for (const group of arrays.get("generatedGroups") ?? []) add(group.route, group.summary);
  for (const family of arrays.get("generatedFamilies") ?? []) add(family.route, family.summary);
  return rows;
}

/**
 * The prose inside the library's TradingView widget registry.
 *
 * `packages/ui/src/integrations/tradingview/core/catalog.ts` is where a widget's
 * one-sentence summary lives, and the Showcase renders it inside every tile. A
 * library that owns the *registry* cannot own its translation — a component
 * library ships no copy — so the Showcase looks each summary up by its English
 * source, and this function is how the coverage check sees them.
 */
export async function loadTradingViewProse() {
  const file = path.resolve(appRoot, "../../packages/ui/src/integrations/tradingview/core/catalog.ts");
  const source = await readFile(file, "utf8");
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const strings = [];
  const visit = (node) => {
    if (
      ts.isPropertyAssignment(node) &&
      (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) &&
      ["summary", "description", "note"].includes(ts.isIdentifier(node.name) ? node.name.text : node.name.text) &&
      ts.isStringLiteral(node.initializer)
    ) {
      strings.push(normalize(node.initializer.text));
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return strings;
}
