/**
 * Phase 7C — the unit contract between a chart's data and its axis format.
 *
 * `@luc/ui` never converts. A `{ kind: "percent" }` format means the numbers it
 * is handed are **already percentage-scaled**, so `0.16` renders as "0.2 %" and
 * a risk axis spanning 0.4 % … 42 % prints "0 %" at every tick. That failure
 * does not throw, does not fail axe, and does not produce a blank canvas — it
 * produces a chart that is present, styled and *lying about its own data*.
 * Phase 7 found five of them.
 *
 * This audit is static on purpose. It compiles the Showcase's deterministic
 * fixtures and the real library formatter, builds the six ticks the axis would
 * render, and asserts two things per entry:
 *
 *   distinct  the formatted ticks are not all the same string
 *   scaled    a `percent` axis is fed percentage numbers, not ratios
 *
 * It compiles TypeScript with the `typescript` package the Showcase already
 * depends on — no bundler, no new dependency.
 *
 *   node qa/chart-units.mjs
 */

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const here = path.dirname(fileURLToPath(import.meta.url));
const showcaseRoot = path.resolve(here, "..");
const packageRoot = path.resolve(showcaseRoot, "../..");
const uiRoot = path.resolve(packageRoot, "packages/ui");

const TEMP = path.join(packageRoot, "artifacts/qa/units");

/** Transpile a TypeScript module to plain ESM so Node can import it. */
async function compile(sourcePath, name) {
  const source = await readFile(sourcePath, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      isolatedModules: true,
      verbatimModuleSyntax: false,
    },
    fileName: sourcePath,
  });
  const file = path.join(TEMP, `${name}.mjs`);
  await writeFile(file, outputText);
  return import(pathToFileURL(file).href);
}

/** Six ticks across a range, formatted the way an axis formats them. */
function axisTicks(values, format, formatNumber) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const ticks = Array.from({ length: 6 }, (_, index) => min + ((max - min) * index) / 5);
  return ticks.map((tick) => formatNumber(tick, format));
}

async function main() {
  await rm(TEMP, { recursive: true, force: true });
  await mkdir(TEMP, { recursive: true });

  const format = await compile(path.join(uiRoot, "src/utils/format.ts"), "format");
  const mock = await compile(path.join(showcaseRoot, "lib/mock-data.ts"), "mock-data");
  const packs = await compile(path.join(showcaseRoot, "lib/chart-packs-data.ts"), "chart-packs-data");

  const { formatNumber } = format;
  const ROWS = mock.marketSeries({ days: 900 });
  const BINS = mock.histogramBins();
  const YEAR = Array.from({ length: 12 }, (_, year) =>
    Array.from({ length: 12 }, (_, month) =>
      year === 0 && month === 2 ? 68 : Math.sin((year * 12 + month) / 5) * 14 + (year % 3 === 0 ? 2 : -1),
    ),
  ).flat();

  /*
   * One row per formatted axis the Showcase renders. `scaled` is only asserted
   * for `percent`: it is the format where a ratio input is silently wrong by
   * two orders of magnitude.
   */
  const ENTRIES = [
    {
      id: "charts-statistical · ECDF x",
      route: "/charts/statistical",
      format: { kind: "percent", decimals: 1 },
      values: [...packs.comparisonSamples.baseline, ...packs.comparisonSamples.candidate].map((point) => point.x),
    },
    {
      id: "charts-distribution · histogram x",
      route: "/charts/distribution",
      format: { kind: "percent", decimals: 2 },
      values: BINS.flatMap((bin) => [bin.from, bin.to]),
    },
    {
      id: "charts-quantitative · frontier risk",
      route: "/charts/quantitative",
      format: { kind: "percent", decimals: 0 },
      values: [...packs.frontierAssets.map((asset) => asset.risk), ...packs.frontierCurve.map((point) => point.risk)],
    },
    {
      id: "charts-quantitative · frontier return",
      route: "/charts/quantitative",
      format: { kind: "percent", decimals: 0 },
      values: [
        ...packs.frontierAssets.map((asset) => asset.expectedReturn),
        ...packs.frontierCurve.map((point) => point.expectedReturn),
      ],
    },
    {
      id: "charts-quantitative · volatility smile",
      route: "/charts/quantitative",
      format: { kind: "number", decimals: 1, suffix: "%" },
      values: packs.volatilitySlices.flatMap((slice) => slice.points.map((point) => point.impliedVol)),
    },
    {
      id: "charts-scientific · ternary shares",
      route: "/charts/scientific",
      format: { kind: "percent", decimals: 0 },
      values: packs.ternaryPoints.flatMap((point) => [point.a, point.b, point.c]),
    },
    {
      id: "charts-sizing · calendar cells",
      route: "/charts/sizing",
      format: { kind: "percent", decimals: 1, signed: true },
      values: YEAR,
    },
    {
      id: "charts-research · realised volatility",
      route: "/charts/research",
      format: { kind: "percent", decimals: 1 },
      values: ROWS.map((row) => row.rv30),
    },
    {
      id: "charts-workflow · bullet measures",
      route: "/charts/workflow",
      format: { kind: "percent", decimals: 0 },
      values: packs.bulletRows.map((row) => row.value),
    },
    {
      id: "charts-matrix · quarterly returns",
      route: "/charts/matrix",
      format: { kind: "percent", decimals: 1 },
      values: [44, 7, -12, 57, 68, -12, 2, 48, 3, 31, 6, -10, -22, -14],
    },
    {
      id: "charts-radial · radar profile",
      route: "/charts/radial",
      format: { kind: "percent" },
      values: mock.radarData().series.flatMap((series) => series.values),
    },
  ];

  let failures = 0;
  console.log("LUC UI chart unit contract (data ⇄ axis format)");
  for (const entry of ENTRIES) {
    const labels = axisTicks(entry.values, entry.format, formatNumber);
    const distinct = new Set(labels).size;
    const maxAbs = Math.max(...entry.values.map((value) => Math.abs(value)));
    const reasons = [];
    if (distinct < 3) reasons.push(`only ${distinct} distinct tick label(s): ${JSON.stringify(labels)}`);
    if (entry.format.kind === "percent" && maxAbs < 0.5) {
      reasons.push(`percent axis fed ratio-scaled data (max |value| = ${maxAbs})`);
    }
    if (reasons.length) failures += 1;
    console.log(`  ${reasons.length ? "FAIL" : "PASS"}  ${entry.id.padEnd(42)} ${labels[0]} … ${labels[5]}`);
    for (const reason of reasons) console.log(`        ${reason}`);
  }
  console.log(`\n${ENTRIES.length - failures}/${ENTRIES.length} chart unit contracts hold`);
  process.exitCode = failures > 0 ? 1 : 0;
}

await main();
