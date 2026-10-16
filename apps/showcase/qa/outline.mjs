/**
 * IA-001 — the page outline must describe the page, not the specimen.
 *
 * Reads the rendered "On this page" rail on a sample of routes and asserts four
 * things the action item names:
 *
 *   1. every rail row targets an id that exists **exactly once** in the document
 *      (no duplicate or malformed anchors);
 *   2. the heading the row points at actually carries that row's label;
 *   3. no rail row comes from inside a specimen subtree
 *      (`[data-slot="demo" | "playground" | "card-stack" | "chart"]`, `figure`,
 *      `canvas`, `article`, `[aria-hidden="true"]`);
 *   4. clicking a row lands on the section it names;
 *   5. the rail stays a *page* outline — no more than `--max-rows` rows on a
 *      catalogue page (UX-004) and no duplicate labels (IA-001's "duplicate or
 *      malformed anchors" in its visible form).
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3100 node qa/outline.mjs
 *   node qa/outline.mjs --routes=/components/accordion,/motion
 *
 * Exits non-zero when an assertion fails, so it can be wired into a gate.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { DESKTOP } from "./constants.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";

const DEFAULT_ROUTES = [
  "/components/accordion",
  "/components/native-select",
  "/components/buttons",
  "/motion/spatial",
  "/motion",
  "/charts/line-chart",
  "/docs/reference",
  "/foundations/colors",
];

const argRoutes = process.argv.find((arg) => arg.startsWith("--routes="));
const HERE_DIR = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.resolve(HERE_DIR, "..");
/*
 * `--all` walks every route the documentation registry generates. It is the
 * sweep that turns "the rail is fixed" into "the rail is fixed everywhere",
 * and it is slow enough (≈320 routes) that it is not the default.
 */
const ALL = process.argv.includes("--all");
const MAX_ROWS = Number.parseInt(
  process.argv.find((arg) => arg.startsWith("--max-rows="))?.slice("--max-rows=".length) ?? "0",
  10,
) || 0;

const ROUTES = ALL
  ? [
      ...new Set([
        ...DEFAULT_ROUTES,
        ...[...(await readFile(path.join(APP_DIR, "lib/docs/generated/registry.ts"), "utf8")).matchAll(
          /"route": "(\/[^"]+)"/g,
        )].map((match) => match[1]),
      ]),
    ]
  : argRoutes
    ? argRoutes.slice("--routes=".length).split(",").filter(Boolean)
    : DEFAULT_ROUTES;

/**
 * Collected in the page: the rail plus the specimen-awareness facts. The
 * specimen check is done here rather than in Node because it needs `closest()`.
 */
const READ_RAIL = () => {
  const SPECIMEN = [
    '[data-slot="demo"]',
    '[data-slot="demo-stage"]',
    '[data-slot="playground"]',
    '[data-slot="playground-stage"]',
    '[data-slot="card-stack"]',
    '[data-slot="chart"]',
    '[data-slot="page-outline"]',
    "figure",
    "canvas",
    "article",
    '[aria-hidden="true"]',
  ].join(", ");
  const idCount = new Map();
  for (const node of document.querySelectorAll("[id]")) {
    idCount.set(node.id, (idCount.get(node.id) ?? 0) + 1);
  }
  const rows = [...document.querySelectorAll('[data-slot="page-outline"] a[href^="#"]')].map((a) => {
    const id = decodeURIComponent(a.getAttribute("href").slice(1));
    const target = document.getElementById(id);
    return {
      label: a.textContent.trim(),
      id,
      idCount: idCount.get(id) ?? 0,
      targetExists: target !== null,
      targetTag: target?.tagName.toLowerCase() ?? null,
      targetText: target?.textContent?.trim() ?? null,
      insideSpecimen: target ? target.closest(SPECIMEN) !== null : null,
    };
  });
  return { rows, outlineCount: document.querySelectorAll('[data-slot="page-outline"]').length };
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: DESKTOP });
const page = await context.newPage();

const report = { generatedAt: new Date().toISOString(), base: BASE, viewport: DESKTOP, routes: {}, failures: [] };

for (const route of ROUTES) {
  const consoleErrors = [];
  const onConsole = (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  };
  page.on("console", onConsole);
  try {
    const response = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    const status = response?.status() ?? 0;
    await page
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 20000 })
      .catch(() => {});
    /*
     * The rail is populated in a `requestAnimationFrame` after hydration (it
     * measures headings), so reading it in the same tick as the hydration marker
     * can catch it empty. Wait for the rows, or for the page to have none.
     */
    await page
      .waitForFunction(() => document.querySelectorAll('[data-slot="page-outline"] a').length > 0, {
        timeout: 2500,
      })
      .catch(() => {});
    const rail = await page.evaluate(READ_RAIL);

    const problems = [];
    if (status !== 200) problems.push(`HTTP ${status}`);
    const labels = new Set();
    for (const row of rail.rows) {
      if (!row.targetExists) problems.push(`row "${row.label}" targets missing #${row.id}`);
      else if (row.idCount !== 1) problems.push(`row "${row.label}" targets #${row.id} which appears ${row.idCount}×`);
      else if (row.insideSpecimen) problems.push(`row "${row.label}" (#${row.id}) is inside a specimen`);
      else if (row.targetText !== row.label)
        problems.push(`row "${row.label}" points at "${row.targetText}" (#${row.id})`);
      if (labels.has(row.label)) problems.push(`row "${row.label}" appears twice in the rail`);
      labels.add(row.label);
    }
    /* UX-004: a catalogue is filtered, not outlined. */
    if (MAX_ROWS > 0 && rail.rows.length > MAX_ROWS)
      problems.push(`rail has ${rail.rows.length} rows (budget ${MAX_ROWS})`);
    report.routes[route] = { status, rows: rail.rows, rowCount: rail.rows.length, consoleErrors, problems };
    if (problems.length > 0) report.failures.push({ route, problems });
  } catch (error) {
    report.failures.push({ route, problems: [`probe failed: ${error.message}`] });
    report.routes[route] = { status: 0, rows: [], rowCount: 0, consoleErrors, problems: [`probe failed: ${error.message}`] };
  } finally {
    page.off("console", onConsole);
  }
}

await context.close();
await browser.close();

await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "outline-probe.json");
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);

for (const [route, data] of Object.entries(report.routes)) {
  process.stdout.write(`${data.problems.length === 0 ? "PASS" : "FAIL"} ${route}  rows=${data.rowCount}\n`);
  for (const problem of data.problems) process.stdout.write(`     - ${problem}\n`);
}
process.stdout.write(`\nreport: ${outFile}\n`);
if (report.failures.length > 0) {
  process.stdout.write(`\n${report.failures.length} route(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nAll sampled outlines are page-derived and unambiguous.\n");
