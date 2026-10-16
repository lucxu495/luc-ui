/**
 * Mobile accessibility scan.
 *
 * Every axe scan in this harness ran at a desktop viewport, with or without a
 * light theme. That is a real gap, not a technicality: two of the rules WCAG
 * 2.2 added — `target-size` (2.5.8) and its cousins — are *geometry* rules, and
 * geometry is what a 390 px viewport changes. The Phase 9.5 report carried a
 * `target-size` finding marked "mobile only" precisely because the desktop
 * matrix could not see it.
 *
 * This script is the instrument: it scans the routes that declare a mobile
 * variant (the same subset the sweep already renders at 390 px) and prints the
 * violations with the measured boxes that produced them, so a finding can be
 * judged rather than guessed at.
 *
 *   node qa/mobile-a11y.mjs                       # the responsive route subset
 *   node qa/mobile-a11y.mjs --routes=date-time-date-range
 *   node qa/mobile-a11y.mjs --viewports=390x844,768x1024
 *   node qa/mobile-a11y.mjs --all-viewports       # 390/768/1280/1440/1920
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "@playwright/test";

import { parseOptions } from "./config.mjs";
import { attachDiagnostics } from "./diagnostics.mjs";
import { navigateAndReady, readThrough, waitForStable } from "./readiness.mjs";
import { ROUTES, selectRoutes } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

const DEFAULT_VIEWPORTS = [
  { name: "390×844", width: 390, height: 844, mobile: true },
  { name: "768×1024", width: 768, height: 1024, mobile: false },
];

const ALL_VIEWPORTS = [
  ...DEFAULT_VIEWPORTS,
  { name: "1280×800", width: 1280, height: 800, mobile: false },
  { name: "1440×900", width: 1440, height: 900, mobile: false },
  { name: "1920×1080", width: 1920, height: 1080, mobile: false },
];

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

/** Small worker pool, the same shape the main sweep uses. Two is the default. */
const DEFAULT_WORKERS = 2;

function parseViewports(argv) {
  if (argv.includes("--all-viewports")) return ALL_VIEWPORTS;
  const inline = argv.find((arg) => arg.startsWith("--viewports="));
  if (!inline) return DEFAULT_VIEWPORTS;
  return inline
    .slice("--viewports=".length)
    .split(",")
    .map((entry) => {
      const [width, height] = entry.split("x").map((value) => Number.parseInt(value, 10));
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(`[mobile-a11y] --viewports expects WxH pairs, got "${entry}"`);
      }
      return { name: entry, width, height, mobile: width <= 480 };
    });
}

/**
 * The measured geometry behind a `target-size` finding.
 *
 * axe reports the node and the ratio, but the ratio alone does not say whether
 * the box is genuinely small or merely crowded by a neighbour — and those are
 * different defects with different fixes. Reading the rects makes the finding
 * reviewable.
 *
 * A target such as `.p-3` is a *class* selector, and axe reports the first node
 * it matched while `querySelector` can match a different one. So this reports
 * every candidate with its own overflow metrics and says which of them is
 * actually a scroll container — the finding is about a scroll container, and
 * that is the fact worth naming.
 */
async function measureNodes(page, node) {
  const targets = node.target.map(String);
  return page.evaluate((selectors) => {
    const results = [];
    for (const selector of selectors) {
      let matches = [];
      try {
        matches = Array.from(document.querySelectorAll(selector)).slice(0, 6);
      } catch {
        matches = [];
      }
      if (matches.length === 0) {
        results.push({ selector, missing: true });
        continue;
      }
      for (const element of matches) {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        results.push({
          selector,
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute("role") ?? element.tagName.toLowerCase(),
          slot: element.getAttribute("data-slot"),
          text: (element.textContent ?? "").trim().slice(0, 32),
          width: Math.round(rect.width * 10) / 10,
          height: Math.round(rect.height * 10) / 10,
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight,
          scrolls: element.scrollHeight > element.clientHeight + 1 || element.scrollWidth > element.clientWidth + 1,
          path: (() => {
            const parts = [];
            let current = element;
            while (current && parts.length < 4) {
              const slot = current.getAttribute?.("data-slot");
              parts.unshift(`${current.tagName.toLowerCase()}${slot ? `[${slot}]` : current.className ? `.${String(current.className).split(" ")[0]}` : ""}`);
              current = current.parentElement;
            }
            return parts.join(" < ");
          })(),
        });
      }
    }
    return results;
  }, targets);
}

async function main() {
  const argv = process.argv.slice(2);
  const options = parseOptions(argv);
  const viewports = parseViewports(argv);
  const requested = options.slugs.length > 0 ? options.slugs : null;
  const routes = requested
    ? selectRoutes(requested)
    : ROUTES.filter((route) => route.mobile);
  const workers = options.workers ?? DEFAULT_WORKERS;

  const browser = await chromium.launch();
  const outDir = path.join(packageRoot, "artifacts/qa/mobile-a11y");
  await mkdir(outDir, { recursive: true });

  const findings = [];
  let scans = 0;
  const startedAt = performance.now();

  const pairs = viewports.flatMap((viewport) => routes.map((route) => ({ viewport, route })));
  let cursor = 0;

  const worker = async () => {
    while (cursor < pairs.length) {
      const { viewport, route } = pairs[cursor];
      cursor += 1;
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.mobile,
        hasTouch: viewport.mobile,
      });
      const page = await context.newPage();
      const problems = [];
      attachDiagnostics(page, `${route.slug}@${viewport.name}`, {
        counters: { axeScans: 0 },
        axe: [],
        record: (kind, message) => problems.push(`${kind}: ${message}`),
      });
      try {
        await navigateAndReady(page, `${options.baseUrl}${route.path}`);
        await readThrough(page, { stepDelayMs: 20, tailMs: 80, endMs: 40 });
        await waitForStable(page, { settleMs: 120 });
        const analysis = await new AxeBuilder({ page })
          .withTags(TAGS)
          .exclude(".tradingview-widget-container")
          .exclude("[data-luc-qa-provider-stub]")
          .analyze();
        scans += 1;
        for (const violation of analysis.violations) {
          const nodes = [];
          for (const node of violation.nodes.slice(0, 6)) {
            nodes.push({
              target: node.target.join(" "),
              summary: node.failureSummary?.split("\n").slice(0, 3).join(" ") ?? "",
              measured: await measureNodes(page, node),
            });
          }
          findings.push({
            route: route.slug,
            path: route.path,
            viewport: viewport.name,
            id: violation.id,
            impact: violation.impact,
            help: violation.help,
            nodeCount: violation.nodes.length,
            nodes,
          });
        }
      } catch (error) {
        findings.push({
          route: route.slug,
          viewport: viewport.name,
          id: "harness-error",
          impact: "serious",
          help: String(error).split("\n")[0],
          nodeCount: 1,
          nodes: [],
        });
      } finally {
        if (problems.length > 0) {
          for (const problem of problems) {
            findings.push({
              route: route.slug,
              viewport: viewport.name,
              id: "console",
              impact: "serious",
              help: problem,
              nodeCount: 1,
              nodes: [],
            });
          }
        }
        await context.close();
      }
    }
  };

  console.log(
    `mobile-a11y · ${routes.length} route(s) × ${viewports.length} viewport(s) = ${pairs.length} scan(s) · ${workers} worker(s)`,
  );
  await Promise.all(Array.from({ length: Math.max(1, Math.min(workers, pairs.length)) }, () => worker()));

  await browser.close();

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: options.baseUrl,
    viewports: viewports.map((viewport) => viewport.name),
    routes: routes.map((route) => route.slug),
    scans,
    durationMs: Math.round(performance.now() - startedAt),
    findings,
  };
  await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));

  if (findings.length === 0) {
    console.log(
      `mobile-a11y · ${scans} scan(s) · ${routes.length} route(s) × ${viewports.length} viewport(s) · 0 findings`,
    );
  } else {
    console.log(
      `mobile-a11y · ${scans} scan(s) · ${findings.length} finding(s) → ${path.relative(packageRoot, outDir)}/report.json`,
    );
    const grouped = new Map();
    for (const finding of findings) {
      const key = `${finding.id} (${finding.impact}) @ ${finding.viewport}`;
      grouped.set(key, [...(grouped.get(key) ?? []), finding]);
    }
    for (const [key, group] of grouped) {
      const routes = [...new Set(group.map((finding) => finding.route))];
      console.log(`  ${key} — ${group.length} node(s) across ${routes.length} route(s)`);
      for (const finding of group.slice(0, 4)) {
        console.log(`      ${finding.route}: ${finding.help}`);
        for (const node of finding.nodes.slice(0, 3)) {
          const boxes = node.measured
            .map((entry) =>
              entry.missing
                ? `${entry.selector} (not found)`
                : `${entry.scrolls ? "SCROLLS " : ""}${entry.role}"${entry.text}" ${entry.width}×${entry.height} ` +
                  `[${entry.overflowX}/${entry.overflowY} content ${entry.scrollWidth}×${entry.scrollHeight}] ${entry.path}`,
            )
            .join("\n        | ");
          console.log(`        ${node.target} → ${boxes}`);
        }
      }
    }
  }
  process.exitCode = findings.length > 0 ? 1 : 0;
}

await main();
