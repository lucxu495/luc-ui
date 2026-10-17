/**
 * Focused smoke check for the chart routes.
 *
 * Loads every chart page in headless Chromium, waits for the engines to paint,
 * reports console/page errors, and confirms each page produced at least one
 * canvas with non-zero size. Run before the full visual QA pass.
 */

import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "../qa/base-url.mjs";

const BASE_URL = resolveBaseUrl();
/** Pages with no chart engine: they only assert that they render cleanly. */
const TEXT_ONLY = new Set(["/charts/architecture"]);

const ROUTES = [
  "/charts",
  "/charts/timeseries",
  "/charts/comparison",
  "/charts/distribution",
  "/charts/relationship",
  "/charts/matrix",
  "/charts/composition",
  "/charts/flow",
  "/charts/radial",
  "/charts/composed",
  "/charts/research",
  "/charts/financial",
  "/charts/sync",
  "/charts/interaction",
  "/charts/performance",
  "/charts/architecture",
];

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
let failures = 0;

for (const route of ROUTES) {
  const page = await context.newPage();
  const problems = [];
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));

  await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1600);
  const canvases = await page.evaluate(() =>
    [...document.querySelectorAll("canvas")].map((canvas) => ({
      width: canvas.width,
      height: canvas.height,
    })),
  );
  const painted = canvases.filter((canvas) => canvas.width > 20 && canvas.height > 20);
  const ok = (painted.length > 0 || TEXT_ONLY.has(route)) && problems.length === 0;
  if (!ok) failures += 1;
  console.log(
    `${ok ? "PASS" : "FAIL"}  ${route}  canvases=${painted.length}/${canvases.length}${
      problems.length ? `  problems=${JSON.stringify(problems.slice(0, 4))}` : ""
    }`,
  );
  await page.close();
}

await browser.close();
process.exitCode = failures > 0 ? 1 : 0;
