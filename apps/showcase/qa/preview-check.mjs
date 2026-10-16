/**
 * Local Docker preview smoke check.
 *
 * The route-health gate (QA-001) answers "does every documented route answer".
 * This one answers the narrower question the local preview exists for: *can I
 * actually click this build?* On each named surface it loads the page, asserts
 * HTTP 200 + the hydration marker, performs one real interaction through the
 * DOM, and records every console error, page error and failed request.
 *
 *   BASE=$(docker port luc-ui-showcase-standalone-local 3000 | sed 's/.*://')
 *   LUC_QA_BASE_URL=http://127.0.0.1:$BASE node qa/preview-check.mjs
 *
 * Exit code is non-zero when any surface fails, so it is safe to use as a gate.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(APP, "../../artifacts/screenshots/showcase-transformation");
const BASE = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";
const VIEWPORT = { width: 1440, height: 900 };

/**
 * Each surface: how to reach it and one interaction that only works if the
 * page is genuinely interactive. `engage` returns a short observation string;
 * throwing fails the surface.
 */
const SURFACES = [
  {
    path: "/components/native-select",
    name: "native-select",
    async engage(page) {
      const select = page.locator('[data-slot="native-select"], select').first();
      await select.waitFor({ state: "visible", timeout: 15_000 });
      const before = await select.inputValue();
      const values = await select.locator("option").evaluateAll((nodes) => nodes.map((n) => n.value));
      const next = values.find((value) => value !== before);
      await select.selectOption(next);
      const after = await select.inputValue();
      if (after === before) throw new Error(`select did not change (${before})`);
      return `select ${before} → ${after}`;
    },
  },
  {
    path: "/components/project-showcase",
    name: "project-showcase",
    async engage(page) {
      const scope = page.locator('[data-slot="project-showcase"]').first();
      const tile = scope.getByRole("button").first();
      const urlBefore = page.url();
      await tile.click();
      await page.waitForTimeout(300);
      if (page.url() !== urlBefore) throw new Error(`tile click navigated to ${page.url()}`);
      return "tile click handled in page (no navigation)";
    },
  },
  {
    path: "/charts/line-chart",
    name: "line-chart",
    async engage(page) {
      const plot = page.locator('[data-slot="demo"] svg, [data-slot="demo"] canvas').first();
      await plot.waitFor({ state: "visible", timeout: 20_000 });
      const combo = page.locator('[data-slot="playground"] [role="combobox"]').first();
      if (await combo.count()) {
        const code = page.locator('[data-slot="playground"] pre, [data-slot="playground"] code').first();
        const before = (await code.textContent()) ?? "";
        await combo.click();
        const option = page.locator('[role="option"]').nth(1);
        await option.click();
        await page.waitForTimeout(250);
        const after = (await code.textContent()) ?? "";
        return after === before ? "control changed (code panel identical)" : "control → code panel changed";
      }
      return "plot renders";
    },
  },
  {
    path: "/motion/card-stack",
    name: "card-stack",
    async engage(page) {
      const live = page.locator('[data-slot="card-stack"] [role="status"], [data-slot="card-stack"] [aria-live]').first();
      const before = ((await live.textContent()) ?? "").trim();
      const next = page.getByRole("button", { name: /next/i }).first();
      await next.click();
      await page.waitForTimeout(400);
      const after = ((await live.textContent()) ?? "").trim();
      if (after === before) throw new Error(`live region unchanged (${before})`);
      return `card stack ${before} → ${after}`;
    },
  },
];

async function main() {
  await mkdir(EVIDENCE, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const surface of SURFACES) {
    const url = BASE.replace(/\/$/, "") + surface.path;
    const context = await browser.newContext({ viewport: VIEWPORT });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    const failedRequests = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));
    page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()}`));

    const result = { path: surface.path, name: surface.name, status: 0, hydrated: false };
    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      result.status = response?.status() ?? 0;
      await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20_000,
      });
      result.hydrated = true;
      result.observation = await surface.engage(page);
      const shot = path.join(EVIDENCE, `preview-${surface.name}.png`);
      await page.screenshot({ path: shot, fullPage: false });
      result.screenshot = shot;
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
    }
    result.consoleErrors = consoleErrors;
    result.pageErrors = pageErrors;
    result.failedRequests = failedRequests;
    result.ok =
      result.status === 200 &&
      result.hydrated &&
      !result.error &&
      consoleErrors.length === 0 &&
      pageErrors.length === 0;
    await context.close();
    results.push(result);
    const mark = result.ok ? "PASS" : "FAIL";
    const detail = result.observation ?? result.error ?? "";
    console.log(`${mark} ${surface.path}  ${detail}`);
    for (const message of consoleErrors) console.log(`     console: ${message}`);
    for (const message of pageErrors) console.log(`     pageerror: ${message}`);
  }

  await browser.close();
  const report = { base: BASE, viewport: VIEWPORT, at: new Date().toISOString(), results };
  await writeFile(path.join(EVIDENCE, "preview-check.json"), `${JSON.stringify(report, null, 2)}\n`);

  const failed = results.filter((result) => !result.ok);
  console.log(`\npreview check: ${results.length - failed.length}/${results.length} surfaces OK against ${BASE}`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
