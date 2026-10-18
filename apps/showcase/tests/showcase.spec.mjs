/**
 * QA-004 — visual baselines for the Showcase's own product surfaces.
 *
 * The existing `visual.spec.mjs` covers the *library's* lanes (foundations, the
 * core controls, the primitives, the shell) and its snapshots are
 * `*-chromium-linux.png` — captured in Linux CI. This file covers what the user
 * asked to be able to look at: the product surfaces a reader moves through. It
 * has a reviewed baseline for both Darwin and Linux; Playwright's
 * `-chromium-<host>` suffix keeps the sets side by side and ADR-036 forbids
 * diffing one host's capture against the other's baseline.
 *
 * Ten states, not three hundred (`QA-004`'s acceptance criterion is ≤ 12): one per
 * surface named in the action item, dark theme, 1440×1000, animations disabled,
 * and each one waits for the readiness marker the browser gates use so a baseline
 * is never captured mid-hydration. Geometry and semantics are asserted by the
 * behaviour gates; these catch the thing those cannot — a layout, colour or
 * spacing regression that still passes every assertion.
 *
 *   pnpm qa:baseline:update   # regenerate (review the diff before committing)
 *   pnpm qa:baseline          # assert
 */

import { expect, test } from "@playwright/test";
import { missingHostedBaseline } from "./baseline-host.mjs";

const SETTLE_MS = 350;

/** Open a surface and settle it the way every other gate does. */
async function open(page, path) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
    timeout: 30_000,
  });
  /* The sidebar's persisted state and the theme's are local storage, and the
   * backdoor of a previous test must not leak into a baseline. */
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(SETTLE_MS);
}

function requireHostedBaseline(testInfo, name) {
  const reason = missingHostedBaseline(testInfo, name);
  if (reason) test.skip(true, reason);
}

async function assertSurface(page, testInfo, path, name, { fullPage = true } = {}) {
  await open(page, path);
  requireHostedBaseline(testInfo, `${name}.png`);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage });
}

test.describe("Showcase surfaces", () => {
  test("home: the landing page", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/", "showcase-home");
  });

  test("docs: the sidebar", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/docs", "showcase-docs");
  });

  test("components: the catalogue", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/components", "showcase-components-catalog");
  });

  test("components: a detail page", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/components/buttons", "showcase-components-detail");
  });

  test("explore: the filter", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/explore", "showcase-explore");
  });

  test("build: blocks", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/blocks", "showcase-build-blocks");
  });

  test("charts: a chart page", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/charts/line-chart", "showcase-chart-line");
  });

  test("motion: the gallery", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/motion", "showcase-motion-gallery");
  });

  test("motion: CardStack", async ({ page }, testInfo) => {
    await assertSurface(page, testInfo, "/motion/card-stack", "showcase-card-stack");
  });

  test("motion: MorphingDialog open", async ({ page }, testInfo) => {
    await open(page, "/motion/morphing-dialog");
    requireHostedBaseline(testInfo, "showcase-morphing-dialog-open.png");
    /* The settled dialog, not the trigger: the state the audit's C-03 was about. */
    await page.locator('[data-slot="morphing-dialog-trigger"]').first().click();
    await page.waitForTimeout(700);
    await expect(page).toHaveScreenshot("showcase-morphing-dialog-open.png");
  });
});
