/**
 * QA-001 — the documented-route health gate.
 *
 * The link crawl that produced the transformation audit found two documented
 * routes returning HTTP 500 while every existing gate stayed green: the route
 * sweep ran, but it never asserted that a *documented* route answered. This is
 * that assertion, and it is deliberately small.
 *
 * For every route the Showcase documents — the hand-written coverage policy plus
 * every entry the documentation registry generates — it checks:
 *
 *   1. HTTP 200;
 *   2. the application hydrated (`document.documentElement.dataset.lucHydrated`);
 *   3. no console error and no uncaught page error.
 *
 * A route may be excused only by name **and** with the action-item id that owns
 * the defect, so a whitelist entry cannot outlive its reason.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3100 node qa/route-health.mjs
 *   node qa/route-health.mjs --workers=2 --limit=40
 *
 * Bounded at two workers on purpose (ADR-036): one worker holds a desktop and
 * lazily a mobile context, and this gate is meant to run beside development.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(APP, "../../artifacts/screenshots/showcase-transformation");
const BASE = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";

/**
 * Excused routes. Each entry must name the action item that owns the defect and
 * the date it was recorded; an entry without a reason is a bug, not a pass.
 */
const KNOWN_BROKEN = new Map([
  /*
   * Empty by construction: CMP-001 fixed the only two entries that were ever
   * here. When a route must be excused, add
   *   ["/components/thing", { item: "CMP-00X", since: "YYYY-MM-DD", why: "…" }]
   * and remove it when that item ships.
   */
]);

const arg = (name) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const workers = Math.min(Number.parseInt(arg("workers") ?? "2", 10) || 2, 2);
const limit = Number.parseInt(arg("limit") ?? "0", 10) || 0;

/** The coverage policy plus every documented registry route. */
async function routes() {
  const { ROUTES } = await import("./routes.mjs");
  const paths = new Set(ROUTES.map((route) => route.path));
  const registry = await readFile(path.join(APP, "lib/docs/generated/registry.ts"), "utf8").catch(() => "");
  for (const match of registry.matchAll(/"route": "(\/[^"]+)",\s*\n\s*"status": "([^"]+)"/g)) {
    if (match[2] === "reference") continue;
    paths.add(match[1]);
  }
  return [...paths].sort();
}

const all = await routes();
const targets = limit > 0 ? all.slice(0, limit) : all;

const browser = await chromium.launch();
const queue = [...targets];
const results = new Map();

async function worker() {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  for (;;) {
    const route = queue.shift();
    if (route === undefined) break;
    const consoleErrors = [];
    const pageErrors = [];
    const onConsole = (message) => {
      if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
    };
    const onPageError = (error) => pageErrors.push(String(error.message).slice(0, 200));
    page.on("console", onConsole);
    page.on("pageerror", onPageError);
    let status = 0;
    let hydrated = false;
    try {
      const response = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 45000 });
      status = response?.status() ?? 0;
      if (status === 200) {
        hydrated = await page
          .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 8000 })
          .then(() => true)
          .catch(() => false);
      }
    } catch (error) {
      status = status || -1;
      pageErrors.push(String(error.message).slice(0, 200));
    } finally {
      page.off("console", onConsole);
      page.off("pageerror", onPageError);
    }
    const excused = KNOWN_BROKEN.get(route);
    const problems = [];
    if (status !== 200) problems.push(`HTTP ${status}`);
    if (status === 200 && !hydrated) problems.push("no hydration marker");
    if (consoleErrors.length > 0) problems.push(`${consoleErrors.length} console error(s)`);
    if (pageErrors.length > 0) problems.push(`${pageErrors.length} page error(s)`);
    results.set(route, { status, hydrated, consoleErrors, pageErrors, problems, excused: excused ?? null });
  }
  await context.close();
}

const startedAt = Date.now();
await Promise.all(Array.from({ length: workers }, () => worker()));
await browser.close();

const ordered = [...results.entries()].sort(([a], [b]) => a.localeCompare(b));
const failures = ordered.filter(([, r]) => r.problems.length > 0 && r.excused === null);
const excused = ordered.filter(([, r]) => r.problems.length > 0 && r.excused !== null);

const report = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  workers,
  routeCount: targets.length,
  durationMs: Date.now() - startedAt,
  failures: Object.fromEntries(failures),
  excused: Object.fromEntries(excused),
  routes: Object.fromEntries(ordered),
};
await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "route-health.json");
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);

const seconds = (report.durationMs / 1000).toFixed(1);
process.stdout.write(`route health: ${targets.length} routes, ${seconds}s, ${workers} worker(s)\n`);
for (const [route, data] of failures) process.stdout.write(`FAIL ${route}\n     ${data.problems.join("; ")}\n`);
for (const [route, data] of excused)
  process.stdout.write(`SKIP ${route}  [${data.excused.item}] ${data.problems.join("; ")}\n`);
process.stdout.write(`\nreport: ${outFile}\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} documented route(s) failed.\n`);
  process.exit(1);
}
process.stdout.write(`\nAll ${targets.length} documented routes are healthy.\n`);
