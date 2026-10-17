/**
 * A one-off probe kept from the Phase 9 Hardening audit.
 *
 * The full sweep reported a `pageerror` on `/charts/geospatial` that did not
 * reproduce when that route was opened on its own, which pointed at an ordering
 * effect rather than at the page: the geographic family page and the three
 * geographic chart pages all register the same fixture map, and the registry is
 * global to the tab.
 *
 *   node qa/probe-geo-sequential.mjs
 */

import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { DESKTOP } from "./constants.mjs";
import { navigateAndReady } from "./readiness.mjs";

const base = resolveBaseUrl();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: DESKTOP });
page.on("pageerror", (error) => console.log("pageerror:", error.message));

for (const route of [
  "/charts/choropleth-chart",
  "/charts/geo-scatter-chart",
  "/charts/geospatial",
  "/charts/geo-trajectory-chart",
]) {
  console.log("→", route);
  await navigateAndReady(page, `${base}${route}`);
  await page.waitForTimeout(3500);
}

await browser.close();
