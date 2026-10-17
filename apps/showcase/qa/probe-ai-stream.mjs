/**
 * A one-off probe from the Phase 9 Hardening audit.
 *
 * The `/components/ai` page streams a canned answer on mount, and the full sweep
 * reported the stream stuck at 67 characters. This samples the same element
 * every 400 ms for eight seconds, which is what turns "it stopped" into "it
 * advanced 3 characters per tick until here, then stopped".
 *
 *   node qa/probe-ai-stream.mjs
 */

import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { DESKTOP } from "./constants.mjs";
import { navigateAndReady } from "./readiness.mjs";

const base = resolveBaseUrl();
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: DESKTOP });
page.on("pageerror", (error) => console.log("pageerror:", error.message));
page.on("console", (message) => {
  if (message.type() === "error") console.log("console.error:", message.text());
});

await navigateAndReady(page, `${base}/components/ai`);

const body = page.locator('[data-slot="chat-message"][data-role="assistant"]').first();
const samples = [];
for (let index = 0; index < 20; index += 1) {
  samples.push((await body.innerText()).length);
  await page.waitForTimeout(400);
}
console.log("lengths:", samples.join(" "));
console.log("playground panels:", await page.locator("[data-language='tsx']").count());
await browser.close();
