/*
 * A one-route hydration probe.
 *
 * `qa-server.mjs` aborts the whole sweep when its preflight route does not
 * hydrate, which is the right behaviour and a terrible debugging experience: it
 * prints one sentence and nothing about *why*. This script loads a single route,
 * waits for the shell marker and prints every console message, page error and
 * failed request it saw. Not part of the QA suite; run it by hand.
 *
 *   node qa/probe.mjs /charts/statistical
 */

import { chromium } from "@playwright/test";

const route = process.argv[2] ?? "/";
const baseUrl = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000";
const prefix = process.env.LUC_PROBE_PREFIX ?? "";

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  /* Light is where the shadow ladder is actually visible; dark reads depth as
     luminance plus a hairline, so a dark comparison hides most of the change. */
  colorScheme: process.env.LUC_PROBE_SCHEME ?? "dark",
});
const page = await context.newPage();

const started = Date.now();
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    console.log(`[console:${message.type()}] ${message.text().slice(0, 400)}`);
  }
});
page.on("pageerror", (error) => console.log(`[pageerror] ${String(error).slice(0, 600)}`));
page.on("requestfailed", (request) =>
  console.log(`[requestfailed] ${request.url()} — ${request.failure()?.errorText}`),
);
page.on("response", (response) => {
  if (response.status() >= 400) console.log(`[http ${response.status()}] ${response.url()}`);
});

await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
try {
  await page.waitForSelector("html[data-luc-hydrated]", { timeout: 25_000 });
  console.log(`hydrated in ${Date.now() - started}ms`);
} catch {
  console.log(`NOT hydrated after ${Date.now() - started}ms`);
}

/*
 * The Showcase keeps the chosen theme in storage, so `prefers-color-scheme` alone
 * does not switch it. Click the shell's own light control instead — that is the
 * same path a human reviewer takes, which is the point of a comparison shot.
 */
const scheme = process.env.LUC_PROBE_SCHEME ?? "dark";
if (scheme === "light") {
  const control = page.getByRole("button", { name: /light theme/i }).first();
  if (await control.count()) {
    await control.click();
    await page.waitForTimeout(500);
  }
}

const charts = await page.locator("canvas").count();
console.log(`canvas elements: ${charts}`);
/*
 * Chart engines are armed by proximity, so a screenshot without scrolling shows
 * whatever happened to be in the first viewport. Walk the page first — the same
 * thing `qa-server.mjs` does before it captures a route.
 */
if (process.env.LUC_PROBE_SCROLL === "1") {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo({ top: y, behavior: "instant" });
      await new Promise((resolve) => setTimeout(resolve, 220));
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  });
  await page.waitForTimeout(1200);
  console.log(`canvas elements after scroll: ${await page.locator("canvas").count()}`);
}
await page.screenshot({
  path: `artifacts/qa/probe${prefix}${route.replace(/\//g, "-")}.png`,
  fullPage: process.env.LUC_PROBE_SCROLL === "1",
});
await browser.close();
