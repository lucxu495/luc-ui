/**
 * Batch D — the chart catalogue draws pictures, not names.
 *
 * The user's complaint about `/charts/catalog` was that a reader could learn
 * that a Sankey exists and not what one looks like. The fix renders every public
 * row with the chart component that row names, at `CHART_THUMBNAIL_HEIGHT`,
 * armed as the reader scrolls towards it.
 *
 * Three things can go wrong with that and none of them show up in a DOM
 * assertion, so this checks the *picture*:
 *
 *   1. **Blank.** A chart whose engine never arms, or whose fixture arrived
 *      empty, still renders a correctly sized, correctly labelled box. So each
 *      thumbnail is screenshotted, decoded back through the browser, and asked
 *      how many distinct colours it holds. One colour is an empty box.
 *   2. **Identical.** Eighty rows that all draw the same generic line is the
 *      failure the fix was meant to remove. `line`, `rolling-measure` and
 *      `segmented-bars` legitimately share a plot with another row, so the bar is
 *      set at 90% distinct rather than 100%.
 *   3. **Different every time.** A thumbnail that renders at whatever size the
 *      card happens to be makes the catalogue uneven, so the rendered heights
 *      must be one number.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/chart-thumbnails.mjs
 *   LUC_QA_ROUTE=/zh/charts/catalog node qa/chart-thumbnails.mjs
 *
 * Exits non-zero when a row is blank, when too many pictures repeat, or when the
 * page logs a console error, so it can be wired into a gate.
 */

import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(APP, "../../artifacts/screenshots/showcase-transformation");
const BASE = resolveBaseUrl();
const ROUTES = (process.env.LUC_QA_ROUTES ?? "/charts/catalog,/zh/charts/catalog").split(",");
const VIEWPORT = { width: 1440, height: 900 };

/** Below this many distinct colours a picture is a box, not a chart. */
const MIN_COLOURS = 3;
/** Rows that share a plot with another row are allowed; a wall of them is not. */
const MIN_DISTINCT_RATIO = 0.9;

const IDS = () =>
  [...document.querySelectorAll("[data-chart-thumbnail]")].map((host) => ({
    id: host.getAttribute("data-chart-thumbnail"),
    height: Math.round(host.getBoundingClientRect().height),
  }));

/**
 * How many distinct colours a picture holds.
 *
 * `image.decode()` + a canvas read is the only honest test that spans both
 * drawing layers: an `svg` renderer and a `canvas` renderer fail in completely
 * different ways and look the same to `querySelector`.
 */
const COUNT_COLOURS = async (base64) => {
  const image = new Image();
  image.src = `data:image/png;base64,${base64}`;
  await image.decode();
  const surface = document.createElement("canvas");
  surface.width = image.width;
  surface.height = image.height;
  const context = surface.getContext("2d");
  context.drawImage(image, 0, 0);
  const data = context.getImageData(0, 0, surface.width, surface.height).data;
  const colours = new Set();
  for (let index = 0; index < data.length; index += 4) {
    colours.add((data[index] << 16) | (data[index + 1] << 8) | data[index + 2]);
  }
  return colours.size;
};

async function check(browser, route) {
  const context = await browser.newContext({ viewport: VIEWPORT });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(String(error).slice(0, 200)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 200));
  });

  const problems = [];
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 60000 });

  /* Scroll the page the way a reader would, so every observer fires. */
  const total = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < total; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(150);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);

  const hosts = await page.evaluate(IDS);
  const rows = [];
  for (const host of hosts) {
    const locator = page.locator(`[data-chart-thumbnail="${host.id}"]`).first();
    try {
      const buffer = await locator.screenshot({ timeout: 20000 });
      const colours = await page.evaluate(COUNT_COLOURS, buffer.toString("base64"));
      rows.push({
        ...host,
        colours,
        picture: createHash("sha1").update(buffer).digest("hex").slice(0, 12),
      });
    } catch (error) {
      rows.push({ ...host, colours: 0, picture: "none", error: String(error).slice(0, 160) });
    }
  }

  const blank = rows.filter((row) => row.colours < MIN_COLOURS);
  const drawn = rows.filter((row) => row.colours >= MIN_COLOURS);
  const distinct = new Set(drawn.map((row) => row.picture)).size;
  const heights = [...new Set(rows.map((row) => row.height))];

  if (rows.length === 0) problems.push("no thumbnails rendered at all");
  if (blank.length > 0) problems.push(`${blank.length} blank: ${blank.map((row) => row.id).join(", ")}`);
  if (drawn.length > 0 && distinct / drawn.length < MIN_DISTINCT_RATIO) {
    problems.push(`only ${distinct} distinct pictures across ${drawn.length} rows`);
  }
  if (heights.length !== 1) problems.push(`uneven thumbnail heights: ${heights.join(", ")}`);
  for (const message of consoleErrors) problems.push(`console: ${message}`);

  await mkdir(EVIDENCE, { recursive: true });
  await page.screenshot({
    path: path.join(EVIDENCE, `chart-thumbnails-${route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.png`),
  });
  await context.close();

  console.log(
    `${problems.length === 0 ? "PASS" : "FAIL"} ${route} — ${rows.length} thumbnails, ` +
      `${distinct} distinct, ${blank.length} blank, heights ${JSON.stringify(heights)}`,
  );
  for (const problem of problems) console.log(`     - ${problem}`);
  return { route, rows, problems };
}

async function main() {
  const browser = await chromium.launch();
  const results = [];
  for (const route of ROUTES) results.push(await check(browser, route.trim()));
  await browser.close();
  await writeFile(
    path.join(EVIDENCE, "chart-thumbnails.json"),
    `${JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2)}\n`,
  );
  const failed = results.filter((result) => result.problems.length > 0);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
