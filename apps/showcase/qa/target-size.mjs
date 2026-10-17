/**
 * WCAG 2.2 target-size, at phone width, in a context where axe evaluates it.
 *
 * Why this probe exists, and why it is separate from the mobile axe pass:
 *
 * `qa/a11y.mjs` runs axe with `wcag22aa` on every mobile route. That pass is
 * emulating a phone (`isMobile: true, hasTouch: true`) so its screenshots and
 * hover behaviour are honest — and axe, in that context, reports **no**
 * `target-size` violations at all. Not "none found": the rule does not evaluate.
 * Measured on `/date-time/date-range` on 2026-10-17: 1 violation in a plain
 * 390 × 844 context, 0 with `hasTouch: true`, for the same geometry.
 *
 * That is how a serious finding — a date segment whose interactive box was 16 px
 * wide — stayed invisible while the general report read "0 violations across 556
 * scans". The rule is a geometry rule; it needs a context that measures geometry.
 *
 * So this runs the same routes at the same width without touch emulation, with
 * only `target-size` enabled. It is deliberately cheap (one rule, no screenshots)
 * and it is wired into `pnpm qa:product`, so the class cannot disappear again.
 *
 *   node qa/target-size.mjs
 *   node qa/target-size.mjs --routes=date-time-date-range
 *   node qa/target-size.mjs --json
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { resolveBaseUrl } from "./base-url.mjs";
import { ROUTES, isProviderRoute, selectRoutes } from "./routes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../artifacts/qa/target-size");
const BASE = resolveBaseUrl();
const VIEWPORT = { width: 390, height: 844 };

const args = new Set(process.argv.slice(2));
const requested = (process.argv.find((value) => value.startsWith("--routes=")) ?? "").slice("--routes=".length);
const routes = requested
  ? selectRoutes(requested.split(",").filter(Boolean))
  : ROUTES.filter((route) => route.mobile && !isProviderRoute(route));

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: VIEWPORT });
const page = await context.newPage();
const findings = [];
let scanned = 0;

for (const route of routes) {
  try {
    await page.goto(`${BASE}${route.path}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20_000 })
      .catch(() => {});
    const results = await new AxeBuilder({ page }).withRules(["target-size"]).analyze();
    scanned += 1;
    for (const violation of results.violations.filter((entry) => entry.id === "target-size")) {
      for (const node of violation.nodes) {
        const geometry = await page
          .evaluate((target) => {
            const element = document.querySelector(target);
            if (!element) return null;
            const box = element.getBoundingClientRect();
            return { width: Math.round(box.width), height: Math.round(box.height), tag: element.tagName.toLowerCase() };
          }, node.target[0])
          .catch(() => null);
        findings.push({
          route: route.path,
          target: node.target.join(" "),
          geometry,
          message: node.any?.[0]?.message ?? "",
        });
      }
    }
  } catch (error) {
    findings.push({ route: route.path, error: String(error?.message ?? error).slice(0, 160) });
  }
}

await browser.close();
await mkdir(OUT, { recursive: true });
await writeFile(
  path.join(OUT, "report.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE, viewport: VIEWPORT, scanned, findings }, null, 2)}\n`,
  "utf8",
);

if (args.has("--json")) {
  console.log(JSON.stringify({ scanned, findings }, null, 2));
} else {
  console.log(`target-size · ${scanned} route(s) at 390px (no touch emulation) · ${findings.length} finding(s)`);
  for (const finding of findings) {
    if (finding.error) {
      console.log(`  ${finding.route} — could not be scanned: ${finding.error}`);
      continue;
    }
    const size = finding.geometry ? `${finding.geometry.tag} ${finding.geometry.width}×${finding.geometry.height}` : "geometry unknown";
    console.log(`  ${finding.route} — ${finding.target} (${size})`);
    if (finding.message) console.log(`      ${finding.message}`);
  }
  console.log(`  report: ${path.relative(process.cwd(), path.join(OUT, "report.json"))}`);
}

process.exitCode = findings.length > 0 ? 1 : 0;
