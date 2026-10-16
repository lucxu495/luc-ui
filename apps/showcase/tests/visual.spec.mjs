/**
 * Visual-regression baselines.
 *
 * Fourteen states, chosen to be *representative and stable* rather than
 * exhaustive: the token foundations, the core control, the form-input lane, the
 * four V1.0 primitives, the data lane, the application shell, the workspace, and
 * one provider page under the deterministic stub. Charts are excluded on
 * purpose — canvas output is the one surface whose pixels legitimately differ
 * between machines, and the chart behaviour checks already assert the mark
 * counts that matter.
 *
 * Every state waits for the same readiness contract the QA sweep uses
 * (`data-luc-hydrated`), so a baseline is never captured mid-hydration.
 */

import { expect, test } from "@playwright/test";
import { existsSync } from "node:fs";
import { installProviderStubOnContext } from "../qa/provider.mjs";
import { readThrough } from "../qa/readiness.mjs";

const SETTLE_MS = 300;

/*
 * Baselines are per-host (ADR-036), and this suite's committed set is the
 * Linux one. On a Mac there is no `-chromium-darwin` snapshot to diff against,
 * so the assertion cannot mean anything: Playwright either writes an unreviewed
 * baseline into the repository ("A snapshot doesn't exist … writing actual") or
 * fails for a reason that is not a defect. Neither is a QA result.
 *
 * `skipHosted` makes that explicit instead: the run reports a skip naming the
 * missing host, the Linux run still asserts, and nothing is written. The
 * Showcase's own set (`tests/showcase.spec.mjs`) *is* captured on this machine,
 * which is where Mac coverage comes from.
 */
const HOST = process.platform === "darwin" ? "darwin" : "linux";
const skipHosted = (testInfo, name) =>
  !existsSync(testInfo.snapshotPath(name)) &&
  `no ${HOST} baseline for ${name} — this set is captured on Linux (ADR-036: never diff across hosts)`;

/** Skip the current test, with a reason, when this host has no baseline for it. */
function requireHostedBaseline(testInfo, name) {
  const reason = skipHosted(testInfo, name);
  if (reason) test.skip(true, reason);
}

async function open(page, path_) {
  await page.goto(path_, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20_000 });
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

/** Dark theme, full page. */
async function assertDark(page, testInfo, path_, name) {
  requireHostedBaseline(testInfo, `${name}-dark.png`);
  await open(page, path_);
  await expect(page).toHaveScreenshot(`${name}-dark.png`, { fullPage: true });
}

test.describe("LUC UI visual baselines", () => {
  test("foundations: colours", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/foundations/colors", "foundations-colors");
  });

  test("foundations: typography", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/foundations/typography", "foundations-typography");
  });

  test("core: buttons", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/buttons", "buttons");
  });

  test("core: inputs", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/inputs", "inputs");
  });

  test("primitive: slider", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/slider", "components-slider");
  });

  test("primitive: menus", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/menus", "components-menus");
  });

  test("primitive: alert", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/alert", "components-alert");
  });

  test("primitive: empty state", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/components/empty-state", "components-empty-state");
  });

  test("data: metrics", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/data/metrics", "data-metrics");
  });

  test("forms: overview", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/forms", "forms-overview");
  });

  test("application: shell", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/application", "application-shell");
  });

  test("application: workspace", async ({ page }, testInfo) => {
    await assertDark(page, testInfo, "/application/workspace", "application-workspace");
  });

  test("providers: deterministic wrapper frame", async ({ browser }, testInfo) => {
    requireHostedBaseline(testInfo, "tradingview-charts-dark.png");
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await installProviderStubOnContext(context);
    const page = await context.newPage();
    try {
      await open(page, "/integrations/tradingview/charts");
      /*
       * Provider widgets are lazy: nothing below the fold is requested until it
       * is scrolled near the viewport, so the read-through has to happen before
       * the readiness assertion — the same order the QA sweep uses.
       */
      await readThrough(page, { stepDelayMs: 90 });
      await page.waitForFunction(
        () =>
          Array.from(document.querySelectorAll("[data-luc-tv-status]")).every((node) => {
            const status = node.getAttribute("data-luc-tv-status");
            return status === "ready" || status === "error";
          }),
        null,
        { timeout: 20_000 },
      );
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(200);
      await expect(page).toHaveScreenshot("tradingview-charts-dark.png", { fullPage: true });
    } finally {
      await context.close();
    }
  });

  test("light: foundations colours", async ({ page }, testInfo) => {
    requireHostedBaseline(testInfo, "foundations-colors-light.png");
    await open(page, "/foundations/colors");
    await page.getByLabel("Light theme", { exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light", null, { timeout: 5_000 });
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("foundations-colors-light.png", { fullPage: true });
  });

  test("light: alert", async ({ page }, testInfo) => {
    requireHostedBaseline(testInfo, "components-alert-light.png");
    await open(page, "/components/alert");
    await page.getByLabel("Light theme", { exact: true }).click();
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light", null, { timeout: 5_000 });
    await page.waitForTimeout(SETTLE_MS);
    await expect(page).toHaveScreenshot("components-alert-light.png", { fullPage: true });
  });
});
