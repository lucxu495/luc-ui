/**
 * QA-004 — visual baselines for the Showcase's own product surfaces.
 *
 * The existing `visual.spec.mjs` covers the *library's* lanes (foundations, the
 * core controls, the primitives, the shell) and its snapshots are
 * `*-chromium-linux.png` — captured in Linux CI. This file covers what the user
 * asked to be able to look at: the product surfaces a reader moves through, and
 * its baselines are captured on the machine that runs it — Playwright names them
 * `*-chromium-darwin.png`, so the two sets coexist and neither is diffed against
 * the other, which is `ADR-036`'s actual rule ("never diff Linux headless against
 * Mac baselines").
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

async function assertSurface(page, path, name, { fullPage = true } = {}) {
  await open(page, path);
  await expect(page).toHaveScreenshot(`${name}.png`, { fullPage });
}

test.describe("Showcase surfaces", () => {
  test("home: the landing page", async ({ page }) => {
    await assertSurface(page, "/", "showcase-home");
  });

  test("docs: the sidebar", async ({ page }) => {
    await assertSurface(page, "/docs", "showcase-docs");
  });

  test("components: the catalogue", async ({ page }) => {
    await assertSurface(page, "/components", "showcase-components-catalog");
  });

  test("components: a detail page", async ({ page }) => {
    await assertSurface(page, "/components/buttons", "showcase-components-detail");
  });

  test("explore: the filter", async ({ page }) => {
    await assertSurface(page, "/explore", "showcase-explore");
  });

  test("build: blocks", async ({ page }) => {
    await assertSurface(page, "/blocks", "showcase-build-blocks");
  });

  test("charts: a chart page", async ({ page }) => {
    await assertSurface(page, "/charts/line-chart", "showcase-chart-line");
  });

  test("motion: the gallery", async ({ page }) => {
    await assertSurface(page, "/motion", "showcase-motion-gallery");
  });

  test("motion: CardStack", async ({ page }) => {
    await assertSurface(page, "/motion/card-stack", "showcase-card-stack");
  });

  test("motion: MorphingDialog open", async ({ page }) => {
    await open(page, "/motion/morphing-dialog");
    /* The settled dialog, not the trigger: the state the audit's C-03 was about. */
    await page.locator('[data-slot="morphing-dialog-trigger"]').first().click();
    await page.waitForTimeout(700);
    await expect(page).toHaveScreenshot("showcase-morphing-dialog-open.png");
  });
});
