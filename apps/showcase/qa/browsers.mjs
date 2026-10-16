/**
 * Phase 7E — cross-browser verification.
 *
 * Every previous phase validated in Chromium only. Chromium is not the whole
 * web: `:has()` support, `backdrop-filter`, container queries, scroll snapping,
 * pointer capture, canvas pixel behaviour and Popover positioning all differ,
 * and several of them are load-bearing in this library.
 *
 * This pass runs the *same* structural probe and the *same* axe scan in every
 * engine Playwright can actually launch on this host, over a representative
 * route set: one per component family, the spatial/motion surfaces, the chart
 * families, and both locales. It reports per-engine results and states plainly
 * which engines were unavailable and why.
 *
 *   node qa/browsers.mjs
 *   node qa/browsers.mjs --browsers=chromium,firefox
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "@playwright/test";

import { DESKTOP, MOBILE } from "./constants.mjs";
import { parseOptions } from "./config.mjs";
import { runAxe } from "./a11y.mjs";
import { attachDiagnostics } from "./diagnostics.mjs";
import { inPage } from "./inspect.mjs";
import { navigateAndReady, readThrough } from "./readiness.mjs";
import { selectRoutes } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

/** One route per family, plus the two locales and the narrow viewport. */
const REPRESENTATIVE = [
  "home",
  "foundations-spatial",
  "buttons",
  "inputs",
  "selection",
  "components-select",
  "components-combobox",
  "components-sheet",
  "dialog",
  "tabs",
  "components-tree-view",
  "components-board",
  "components-media",
  "components-ai",
  "components-notifications",
  "components-color-picker",
  "components-carousel",
  "components-accordion",
  "data-table",
  "patterns-workspace",
  "motion-spatial",
  "charts-timeseries",
  "charts-statistical",
  "charts-financial",
  "charts-surfaces",
  "charts-geospatial",
  /*
   * The reference experiences are the newest layout grammar in the library, and
   * the portfolio is the most transform-heavy page in it — the two things most
   * likely to differ between engines. They are in the cross-browser sample on
   * purpose rather than only in the Chromium sweep.
   */
  "experiences",
  "experiences-portfolio",
  "experiences-saas",
  "experiences-science",
];

const ENGINES = { chromium, firefox, webkit };

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const requested = (process.argv.find((entry) => entry.startsWith("--browsers="))?.slice(11) ?? "chromium,firefox,webkit")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  const routes = selectRoutes(REPRESENTATIVE);
  const mobileRoutes = selectRoutes(["home", "components-media", "charts-statistical"]);

  const outDir = path.join(packageRoot, "artifacts/qa/browsers");
  await mkdir(outDir, { recursive: true });

  const results = [];
  for (const engineName of requested) {
    const engine = ENGINES[engineName];
    if (!engine) {
      results.push({ engine: engineName, status: "unknown-engine" });
      continue;
    }
    let browser;
    try {
      browser = await engine.launch();
    } catch (error) {
      const message = String(error).split("\n").slice(0, 3).join(" ");
      console.log(`  ${engineName.padEnd(9)} UNAVAILABLE — ${message}`);
      results.push({ engine: engineName, status: "unavailable", reason: message });
      continue;
    }

    const perEngine = { engine: engineName, status: "ran", routes: [], consoleErrors: 0 };
    for (const route of [...routes, ...mobileRoutes]) {
      const mobile = mobileRoutes.includes(route);
      const context = await browser.newContext({ viewport: mobile ? MOBILE : DESKTOP });
      const page = await context.newPage();
      const problems = [];
      const recorder = {
        counters: { axeScans: 0, axeErrors: 0 },
        axe: [],
        record: (kind, message) => problems.push(`${kind}: ${message}`),
      };
      attachDiagnostics(page, route.slug, recorder);
      const entry = { slug: route.slug, viewport: mobile ? "mobile" : "desktop", hOverflow: 0, clip: 0, tiny: 0, axe: [] };
      try {
        await navigateAndReady(page, `${options.baseUrl}${route.path}`);
        await readThrough(page, { stepDelayMs: 30, tailMs: 100, endMs: 60 });
        const probe = await page.evaluate(inPage);
        entry.hOverflow = probe.hOverflow;
        entry.clip = probe.clip.length;
        entry.tiny = probe.tiny.length;
        await runAxe(page, route.slug, recorder);
        for (const scan of recorder.axe) {
          for (const violation of scan.violations) {
            if (violation.impact === "serious" || violation.impact === "critical") {
              entry.axe.push(`${violation.id}(${violation.impact})`);
            }
          }
        }
      } catch (error) {
        entry.error = String(error).split("\n")[0];
      } finally {
        entry.console = problems;
        perEngine.consoleErrors += problems.length;
        perEngine.routes.push(entry);
        await context.close();
      }
    }
    const failures = perEngine.routes.filter(
      (route) => route.error || route.axe?.length || route.console?.length || route.hOverflow > 1,
    );
    perEngine.failures = failures.length;
    console.log(
      `  ${engineName.padEnd(9)} routes=${perEngine.routes.length} harness-axe-scans=${
        perEngine.routes.length
      } failures=${failures.length}${
        failures.length
          ? ` → ${failures
              .map((route) => `${route.slug}[${route.error ?? route.axe?.join("|") ?? route.console?.join("|") ?? `overflow ${route.hOverflow}`}]`)
              .join(", ")}`
          : ""
      }`,
    );
    results.push(perEngine);
    await browser.close();
  }

  await writeFile(path.join(outDir, "cross-browser.json"), JSON.stringify(results, null, 2));
  const unavailable = results.filter((entry) => entry.status !== "ran");
  const failed = results.filter((entry) => entry.status === "ran" && entry.failures > 0);
  console.log(
    `\nengines ran=${results.length - unavailable.length} unavailable=${unavailable.length} failing=${failed.length} → ${path.relative(packageRoot, outDir)}/cross-browser.json`,
  );
  process.exitCode = failed.length > 0 ? 1 : 0;
}

await main();
