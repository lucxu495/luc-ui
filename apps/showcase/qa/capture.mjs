/**
 * Screenshot + theme helpers.
 *
 * Two things changed from the original script:
 *
 *  - **Unique names.** Widget element captures were named
 *    `tradingview-<widget>-<theme>.png`, so the same widget rendered on two
 *    routes overwrote one another (17 collisions in a full run) and the report
 *    listed a screenshot that no longer matched a route. Names now carry the
 *    route slug, which is what makes the capture reproducible.
 *  - **Bounded theme flip.** The control is server-rendered and a click before
 *    hydration does nothing; rather than eight optimistic clicks with 600 ms
 *    sleeps, the caller has already waited for hydration, so a short retry is
 *    enough.
 */

import path from "node:path";

export function createCaptureSession({ screenshotDir, recorder }) {
  const written = new Set();

  async function screenshot(page, name, fullPage = true) {
    const file = path.join(screenshotDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage, animations: "disabled", caret: "hide" });
    if (!written.has(file)) {
      written.add(file);
      recorder.captured.push(file);
    }
    return file;
  }

  /**
   * One element screenshot per provider widget on the page.
   *
   * The identity is `(slug, theme, widget)`: unique, and stable across runs.
   * A widget that appears twice on one route is captured once.
   */
  async function captureWidgets(page, slug, theme) {
    const ids = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-widget]")).map((node) => node.getAttribute("data-widget")),
    );
    const seen = new Set();
    for (const id of ids) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const tile = page.locator(`[data-widget="${id}"]`).first();
      const file = path.join(screenshotDir, `tradingview-${slug}-${theme}-${id}.png`);
      await tile
        .screenshot({ path: file, animations: "disabled", caret: "hide" })
        .then(() => {
          if (!written.has(file)) {
            written.add(file);
            recorder.captured.push(file);
          }
        })
        .catch(() => {});
    }
  }

  return { screenshot, captureWidgets, written };
}

/**
 * Flip the theme through the real control.
 *
 * The page has already hydrated by the time this is called, so the retry loop
 * exists only to absorb the React commit, not to wait out a missing bundle.
 */
export async function applyTheme(page, next, recorder, slug = "unknown") {
  const label = next === "light" ? "Light theme" : "Dark theme";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await page
      .getByLabel(label, { exact: true })
      .click({ timeout: 4000 })
      .catch(() => {});
    const applied = await page
      .evaluate((target) => document.documentElement.dataset.theme === target, next)
      .catch(() => false);
    if (applied) return true;
    await page.waitForTimeout(250);
  }
  recorder?.counters && (recorder.counters.themeMisses += 1);
  recorder?.record?.("theme", `${slug}: ${next} theme did not apply`);
  return false;
}
