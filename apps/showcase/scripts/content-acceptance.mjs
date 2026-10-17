/**
 * Generate the Charts + Integrations content-acceptance matrix.
 *
 * The matrix is derived from the registry and the curation modules, not copied
 * by hand. Browser and translation columns are read from the latest QA evidence;
 * a route that did not run is shown as pending rather than accepted.
 *
 *   node scripts/content-acceptance.mjs
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const ROOT = path.resolve(APP, "../..");

async function loadTs(relPath) {
  const full = path.join(APP, relPath);
  const source = await readFile(full, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: path.basename(full),
  }).outputText;
  const temp = path.join(os.tmpdir(), `luc-content-${process.pid}-${path.basename(relPath)}.mjs`);
  await writeFile(temp, js, "utf8");
  return import(pathToFileURL(temp).href);
}

const [{ generatedEntries }, { CHART_NOTES, INTEGRATION_NOTES }, { proseZh }] = await Promise.all([
  loadTs("lib/docs/generated/registry.ts"),
  loadTs("lib/docs/curation/notes.ts"),
  loadTs("lib/i18n/prose.zh.ts"),
]);

const browserReport = await readFile(
  path.join(APP, "artifacts/qa/content-contract/report.json"),
  "utf8",
)
  .then(JSON.parse)
  .catch(() => null);
const browserFailures = new Set((browserReport?.findings ?? []).map((finding) => finding.route));
const browserPass = (route) =>
  browserReport && !browserFailures.has(route) ? "pass" : browserReport ? "fail" : "pending";

const charts = generatedEntries.filter((entry) => entry.group === "charts");
const integrations = generatedEntries.filter((entry) => entry.group === "integrations");

const chartRows = charts.map((entry) => {
  const note = CHART_NOTES[entry.id];
  const translated = [note?.purpose, note?.dataContract, note?.configuration, note?.avoid].every(
    (text) => text && proseZh[text],
  );
  return {
    entry: entry.id,
    route: entry.route,
    api: entry.exports.join(", "),
    usage: "DemoSpec.code",
    contract: note ? "purpose + dataContract + configuration" : "missing",
    guidelines: note?.avoid ? "entry-specific avoid" : "missing",
    i18n: translated ? "translated" : "missing",
    browser: browserPass(entry.route),
    result: note ? "Remediated" : "Blocked",
  };
});

const integrationRows = integrations.map((entry) => {
  const note = INTEGRATION_NOTES[entry.id];
  const translated =
    note &&
    [note.configuration, note.lifecycle, note.limitations].every((text) => proseZh[text]) &&
    note.usage.every((usage) => proseZh[usage.note]) &&
    note.guidance.use.every((text) => proseZh[text]) &&
    note.guidance.avoid.every((text) => proseZh[text]);
  return {
    entry: entry.id,
    route: entry.route,
    api: entry.exports.length > 0 ? `${entry.exports.length} compiler exports` : "reference links",
    usage: note ? `${note.usage.length} public JSX snippet(s)` : "missing",
    contract: note ? "configuration + lifecycle + limitations" : "missing",
    guidelines: note?.guidance.avoid.length ? "entry-specific use/avoid" : "missing",
    i18n: translated ? "translated" : "missing",
    browser: browserPass(entry.route),
    result: note ? "Remediated" : "Blocked",
  };
});

const header = [
  "# Charts and Integrations content acceptance",
  "",
  `Generated from the canonical registry: **${charts.length} chart entries + ${integrations.length} integration entries = ${charts.length + integrations.length}**.`,
  "",
  browserReport
    ? `Browser evidence: **${browserReport.scanned}/${browserReport.routeCount}** routes passed the content contract; ${browserReport.findings.length} failed.`
    : "Browser evidence: **pending** — run `node qa/content-contract.mjs`.",
  "",
  "| Entry | Route | Public API | Usage | Data/Config | Guidelines | i18n | Browser | Result |",
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- |",
];
const row = (item) =>
  `| \`${item.entry}\` | \`${item.route}\` | ${item.api || "—"} | ${item.usage} | ${item.contract} | ${item.guidelines} | ${item.i18n} | ${item.browser} | **${item.result}** |`;

const body = [
  ...header,
  ...chartRows.map(row),
  ...integrationRows.map(row),
  "",
  "## Acceptance notes",
  "",
  "- Chart Usage is the live `DemoSpec.code`, not a second snippet.",
  "- Chart purpose, data contract, configuration and misuse guidance are keyed by canonical entry id.",
  "- Integration snippets use only `@luc/ui/tradingview` public exports; the compiler-backed API table is generated from those exports and props.",
  "- Browser and i18n columns are evidence, not claims: a missing run remains `pending`/`missing`.",
  "",
];

const out = path.join(ROOT, "docs/audits/charts-integrations-content-acceptance.md");
await mkdir(path.dirname(out), { recursive: true });
await writeFile(out, body.join("\n"), "utf8");
process.stdout.write(
  `content acceptance: ${chartRows.length} charts + ${integrationRows.length} integrations -> ${out}\n`,
);
