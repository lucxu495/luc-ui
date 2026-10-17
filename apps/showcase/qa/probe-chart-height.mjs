/**
 * A one-off probe from the Phase 9 Hardening audit: what actually carries the
 * chart's height in the rendered page, so the Playground check can measure the
 * drawing rather than a nested wrapper.
 *
 *   node qa/probe-chart-height.mjs
 */

import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { DESKTOP } from "./constants.mjs";
import { navigateAndReady } from "./readiness.mjs";

const base = resolveBaseUrl();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: DESKTOP });
await navigateAndReady(page, `${base}/charts/ecdf-chart`);

const boxes = await page.evaluate(() =>
  Array.from(document.querySelectorAll("div[style*='height'], canvas")).map((node, index) => ({
    index,
    tag: node.tagName.toLowerCase(),
    style: node.getAttribute("style")?.slice(0, 40) ?? "",
    height: Math.round(node.getBoundingClientRect().height),
    width: Math.round(node.getBoundingClientRect().width),
  })),
);
console.log(JSON.stringify(boxes, null, 1));
await browser.close();
