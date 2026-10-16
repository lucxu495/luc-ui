/**
 * Quick chart screenshots for visual inspection (not the full QA pass).
 *   LUC_QA_BASE_URL=http://localhost:3100 node scripts/chart-shots.mjs
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(here, "../../../artifacts/chart-review");
const BASE_URL = process.env.LUC_QA_BASE_URL ?? "http://localhost:3100";
const DESKTOP = { width: 1440, height: 1000 };

const SHOTS = [
  { name: "overview-dark", route: "/charts" },
  { name: "timeseries-dark", route: "/charts/timeseries" },
  { name: "comparison-dark", route: "/charts/comparison" },
  { name: "matrix-dark", route: "/charts/matrix" },
  { name: "financial-dark", route: "/charts/financial" },
  { name: "sync-dark", route: "/charts/sync" },
  { name: "radial-dark", route: "/charts/radial" },
  { name: "composition-dark", route: "/charts/composition" },
  { name: "overview-light", route: "/charts", light: true },
  { name: "financial-light", route: "/charts/financial", light: true },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
const page = await context.newPage();

for (const shot of SHOTS) {
  await page.goto(`${BASE_URL}${shot.route}`, { waitUntil: "domcontentloaded" });
  if (shot.light) {
    await page.getByLabel("Light theme").click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
  } else {
    await page.getByLabel("Dark theme").click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "dark");
  }
  await page.waitForTimeout(1800);
  await page.screenshot({ path: path.join(outDir, `${shot.name}.png`), fullPage: false });
  console.log(`captured ${shot.name}`);
}

await browser.close();
