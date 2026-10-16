/**
 * Every registered route, at a phone width, with no sideways scroll.
 *
 * Why a second overflow check when three already exist:
 *
 *   - `geometry.mjs` measures the document at six review widths, on **nine**
 *     routes — one per page shape. It is a shape check, not a coverage check.
 *   - `behaviour.mjs` measures **seven** routes at 720px, as a 200%-zoom proxy.
 *   - `sidebar-continuity.mjs` measures the Components tree only.
 *
 * So 151 registered routes are visited at desktop width by `route-health.mjs`,
 * which asserts they answer and render, and only a handful are ever asked
 * whether they fit a phone. The failure this leaves room for is the one a reader
 * notices immediately: one card, one long identifier, one chart label or one
 * `<pre>` wider than the window makes *every* page on the site draggable
 * sideways, and nothing in the suite would have said so.
 *
 * This runs the whole registered set at 390×844 and, when a route overflows,
 * names the widest element responsible rather than only reporting the pixel
 * count — a number with no element attached is a number nobody can act on.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3000 node qa/mobile-overflow.mjs
 *   … --workers=3          parallel tabs
 *   … --json               machine-readable
 *   … --routes=buttons,charts-catalog
 *
 * Provider routes are skipped: their widget is a third party's document, and
 * `route-health` already records that separately.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { parseOptions } from "./config.mjs";
import { ROUTES, isProviderRoute, selectRoutes } from "./routes.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../artifacts/qa/mobile-overflow");
const BASE = (process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

/** iPhone-class viewport: the narrowest width the Showcase is reviewed at. */
const VIEWPORT = { width: 390, height: 844 };

/**
 * Measure, and blame.
 *
 * `documentElement.scrollWidth` is what a reader experiences, so that is the
 * verdict. To explain it, walk every element and keep those whose right edge
 * passes the viewport or whose left edge is off-screen — then report the widest
 * one that has no wider ancestor, which is the element someone has to change
 * rather than one of the boxes that merely contains it.
 */
const MEASURE = () => {
  const html = document.documentElement;
  const viewport = html.clientWidth;
  const result = { scrollWidth: html.scrollWidth, clientWidth: viewport, culprits: [] };
  if (result.scrollWidth <= viewport + 1) return result;

  /*
   * Two shapes of overflow, and the first version of this probe only caught one.
   *
   *   - a box that is *wider* than the viewport (a specimen fixed at 998px);
   *   - a box that is the right width but whose *content* is wider and is not
   *     clipped (a `<code>` line, a grid of token names) — no element rect is
   *     ever wider than the viewport here, which is why `/foundations/colors`
   *     reported "+19px" with an empty culprit list until this was added.
   */
  const offenders = [];
  const seen = new Set();
  for (const element of html.querySelectorAll("*")) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) continue;
    const right = rect.right + window.scrollX;
    const left = rect.left + window.scrollX;
    /* An element inside a scroller that is *meant* to scroll is the scroller's
     * business: mark the scroller, not the content it carries. */
    const style = getComputedStyle(element);
    const clips = style.overflowX !== "visible";
    const byRect = right > viewport + 1 || left < -1;
    /*
     * For the content case, keep only the *innermost* carrier: when a block's
     * content is wider than it, every ancestor's `scrollWidth` is that same
     * number, and reporting the `<body>` ("body.scrollWidth = 1246") tells a
     * reader nothing. The element whose own scrollWidth exceeds its parent's is
     * the one holding the wide thing.
     */
    const parent = element.parentElement;
    const byContent =
      !clips &&
      element.scrollWidth > element.clientWidth + 1 &&
      element.scrollWidth > (parent?.scrollWidth ?? 0);
    if (!byRect && !byContent) continue;
    const key = describe(element);
    if (seen.has(key)) continue;
    seen.add(key);
    offenders.push({
      selector: key,
      right: Math.round(right),
      width: Math.round(rect.width),
      contentWidth: element.scrollWidth,
      text: (element.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60),
      depth: depthOf(element),
      via: byRect ? "box" : "content",
    });
  }
  /*
   * Most overflow first, then the *shallowest* element that has it.
   *
   * Shallowest because a wide specimen makes every box inside it wide too, and
   * the element someone has to change is the outermost one whose own box is
   * wrong — the frame that should have shrunk or scrolled, not the table three
   * levels down that merely is what it is.
   */
  offenders.sort(
    (a, b) => Math.max(b.width, b.contentWidth) - Math.max(a.width, a.contentWidth) || a.depth - b.depth,
  );
  result.culprits = offenders.slice(0, 3);
  return result;

  function depthOf(element) {
    let depth = 0;
    let node = element;
    while (node.parentElement) {
      depth += 1;
      node = node.parentElement;
    }
    return depth;
  }

  function describe(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : "";
    const cls = typeof element.className === "string" && element.className
      ? `.${element.className.trim().split(/\s+/).slice(0, 3).join(".")}`
      : "";
    return `${tag}${id}${cls}`;
  }
};

const options = parseOptions(process.argv.slice(2), process.env);
const requested = options.slugs.length > 0 ? selectRoutes(options.slugs) : ROUTES;
const routes = requested.filter((route) => !isProviderRoute(route));

/* A `--routes=` that matches nothing is a typo, not a clean sweep: `selectRoutes`
 * filters by slug and returns an empty list for a name it does not know, which
 * would print "0 scans · 0 findings" and exit 0. */
if (routes.length === 0) {
  console.error(
    `mobile-overflow: no route matched${options.slugs.length ? ` ${options.slugs.join(",")}` : ""}. ` +
      "Slugs come from qa/routes.mjs; run without --routes for every registered route.",
  );
  process.exit(2);
}
const workers = Math.max(1, Math.min(options.workers ?? 3, 6));
const json = process.argv.includes("--json");

const browser = await chromium.launch();
await mkdir(OUT, { recursive: true });

const findings = [];
let cursor = 0;
let measured = 0;
const startedAt = performance.now();

const worker = async () => {
  const context = await browser.newContext({ viewport: VIEWPORT, reducedMotion: "reduce" });
  const page = await context.newPage();
  while (cursor < routes.length) {
    const route = routes[cursor];
    cursor += 1;
    for (const locale of ["", "/zh"]) {
      const url = `${BASE}${locale}${route.path === "/" ? "" : route.path}`;
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
        await page
          .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20_000 })
          .catch(() => {});
        await page.waitForTimeout(250);
        const result = await page.evaluate(MEASURE);
        measured += 1;
        if (result.scrollWidth > result.clientWidth + 1) {
          findings.push({
            route: `${locale}${route.path === "/" ? "/" : route.path}`,
            slug: route.slug,
            overflowPx: result.scrollWidth - result.clientWidth,
            culprits: result.culprits,
          });
        }
      } catch (error) {
        findings.push({
          route: `${locale}${route.path}`,
          slug: route.slug,
          error: String(error?.message ?? error).slice(0, 200),
          culprits: [],
        });
      }
    }
  }
  await context.close();
};

await Promise.all(Array.from({ length: workers }, worker));
await browser.close();

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  viewport: VIEWPORT,
  routes: routes.length,
  locales: 2,
  measured,
  durationMs: Math.round(performance.now() - startedAt),
  findings,
};
await writeFile(path.join(OUT, "report.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`mobile-overflow · ${routes.length} route(s) × 2 locale(s) = ${measured} scan(s) · ${workers} worker(s)`);
  console.log(`mobile-overflow · ${findings.length} page(s) scroll sideways at ${VIEWPORT.width}px`);
  for (const finding of findings.slice(0, 25)) {
    console.log(`  ${finding.route} — +${finding.overflowPx}px`);
    for (const culprit of finding.culprits ?? []) {
      console.log(`      ${culprit.selector} [${culprit.width}px wide, right=${culprit.right}] ${culprit.text}`);
    }
    if (finding.error) console.log(`      error: ${finding.error}`);
  }
  console.log(`  report: artifacts/qa/mobile-overflow/report.json`);
}

process.exitCode = findings.length > 0 ? 1 : 0;
