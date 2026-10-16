/**
 * MOT-002/003/004 — what the Motion surfaces must actually do.
 *
 * Four assertions, all behavioural:
 *
 *  1. **Every gallery tile shows the component** (MOT-004). A catalogue of
 *     twenty-six names with five pictures is a list, not a gallery.
 *  2. **Replay restarts a timed specimen** (MOT-003). Asserted by node identity,
 *     not by a screenshot: after the click the element that was on screen has to
 *     be *gone*, which is what "started again" means for a one-shot animation.
 *  3. **The reduced-motion control flattens motion** (MOT-003). The header
 *     switch writes `data-motion="reduced"` on `<html>`, the same attribute
 *     `useReducedMotion()` reads — so the marquee's own transform must stop
 *     changing while it is set, and start again when it is cleared.
 *  4. **No specimen is a picture of a control** — nothing here asserts an
 *     interaction the component does not have.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3100 node qa/motion.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = (process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const report = { checkedAt: new Date().toISOString(), base: BASE, failures: [] };
const problems = [];

async function open(route) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
}

try {
  await open("/motion");

  /* --- 1. every tile shows the component (MOT-004) ----------------------- */
  const tiles = await page.evaluate(() => {
    const cards = [...document.querySelectorAll("main [data-slot='card']")];
    return cards
      .map((card) => {
        const heading = card.querySelector("h3");
        if (!heading) return null;
        /* A specimen is a real rendered component: anything with a LUC slot or a
         * canvas/svg inside the tile counts, an empty tile does not. */
        const host = heading.parentElement?.parentElement;
        const specimen = host?.querySelector("[data-slot], canvas, svg");
        const source = card.outerHTML;
        return { name: heading.textContent?.trim() ?? "?", hasSpecimen: Boolean(specimen) && source.includes("min-h-20") };
      })
      .filter((entry) => entry !== null);
  });
  report.tiles = tiles;
  const withoutSpecimen = tiles.filter((tile) => !tile.hasSpecimen).map((tile) => tile.name);
  if (tiles.length < 20) problems.push(`only ${tiles.length} tiles found on /motion`);
  if (withoutSpecimen.length > 0) {
    problems.push(`${withoutSpecimen.length} tile(s) without a specimen: ${withoutSpecimen.join(", ")}`);
  }

  /* --- 2. replay remounts a timed specimen (MOT-003) --------------------- */
  const replay = page.getByRole("button", { name: /replay/i }).first();
  if ((await replay.count()) === 0) {
    problems.push("no Replay control on /motion");
  } else {
    const before = await page.locator('[data-slot="marquee"]').first().elementHandle();
    await replay.click();
    await page.waitForTimeout(400);
    const stillThere = before ? await before.evaluate((node) => node.isConnected) : null;
    report.replay = { stillThere };
    if (stillThere !== false) problems.push("Replay did not remount the timed specimens");
  }

  /* --- 3. reduced motion really flattens the timed specimens ------------ */
  const marqueeTransform = () =>
    page
      .locator('[data-slot="marquee"]')
      .first()
      .evaluate((node) => {
        const copy = node.querySelector('[data-slot="marquee-copy"]');
        return copy ? getComputedStyle(copy).transform : getComputedStyle(node).transform;
      });

  const moving = await marqueeTransform();
  await page.waitForTimeout(500);
  const stillMoving = await marqueeTransform();
  report.motion = { moving, stillMoving };
  if (moving === stillMoving) problems.push("the marquee is not moving at all under default motion");

  const reduced = page.locator('[aria-label]').filter({ hasText: "Reduced" }).first();
  const reducedButton = page.getByRole("radio", { name: /reduced/i }).first();
  if ((await reducedButton.count()) === 0 && (await reduced.count()) === 0) {
    problems.push("no reduced-motion control in the header");
  } else {
    await (await reducedButton.count() ? reducedButton : reduced).click();
    await page.waitForTimeout(300);
    const attribute = await page.evaluate(() => document.documentElement.dataset.motion ?? null);
    const a = await marqueeTransform();
    await page.waitForTimeout(500);
    const b = await marqueeTransform();
    report.reducedMotion = { attribute, a, b };
    if (attribute !== "reduced") problems.push(`the header control did not set data-motion (got ${attribute})`);
    if (a !== b) problems.push("the marquee kept moving with reduced motion selected");
  }

  await page.screenshot({ path: path.join(EVIDENCE, "motion-gallery.png"), fullPage: false });

  /* --- 4. MorphingDialog settles as a centred, readable dialog (WP-2) ---- */
  for (const [label, surfaceViewport] of [
    ["desktop", { width: 1440, height: 900 }],
    ["mobile", { width: 390, height: 844 }],
    ["short", { width: 1280, height: 640 }],
  ]) {
    await page.setViewportSize(surfaceViewport);
    await open("/motion/morphing-dialog");
    const trigger = page.locator('[data-slot="demo"] [data-slot="morphing-dialog-trigger"]').first();
    if ((await trigger.count()) === 0) {
      problems.push(`${label}: no morphing-dialog trigger in the live demo`);
      continue;
    }
    await trigger.click();
    await page.waitForTimeout(900);
    const settled = await page.evaluate(() => {
      const panel = document.querySelector('[data-slot="morphing-dialog-panel"]');
      const frame = document.querySelector('[data-slot="morphing-dialog"]');
      if (!panel || !frame) return null;
      const box = (node) => {
        const rect = node.getBoundingClientRect();
        return { top: Math.round(rect.top), left: Math.round(rect.left), width: Math.round(rect.width), height: Math.round(rect.height) };
      };
      const background = getComputedStyle(panel).backgroundColor;
      return {
        panel: box(panel),
        frame: box(frame),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        background,
        opaque: !/rgba?\([^)]*,\s*0(\.0+)?\)$/.test(background.replace(/\s/g, "")) && background !== "transparent",
        radius: getComputedStyle(panel).borderRadius,
        closeName: panel.querySelector("[aria-label]")?.getAttribute("aria-label") ?? null,
      };
    });
    if (!settled) {
      problems.push(`${label}: the dialog did not render`);
      continue;
    }
    const { panel, frame, viewport } = settled;
    const centreDelta = {
      x: Math.round(panel.left + panel.width / 2 - viewport.width / 2),
      y: Math.round(panel.top + panel.height / 2 - viewport.height / 2),
    };
    const inside =
      panel.top >= -1 &&
      panel.left >= -1 &&
      panel.top + panel.height <= viewport.height + 1 &&
      panel.left + panel.width <= viewport.width + 1;
    report.morphing = { ...(report.morphing ?? {}), [label]: { ...settled, centreDelta, inside } };
    /* A tolerant ceiling: a 5% offset is 72px at 1440 and 19px at 390. */
    if (Math.abs(centreDelta.x) > viewport.width * 0.05) {
      problems.push(`${label}: the dialog is ${centreDelta.x}px off centre horizontally`);
    }
    if (!inside) problems.push(`${label}: the dialog is clipped by the viewport`);
    if (!settled.opaque) problems.push(`${label}: the dialog panel has no surface (${settled.background})`);
    /*
     * The frame spans the viewport, allowing for the scrollbar.
     *
     * `position: fixed; inset: 0` covers the *layout* viewport, and a classic
     * scrollbar is outside it — so an exact width comparison reports a 1429px
     * frame for a 1440px viewport on a page that scrolls, which is correct
     * behaviour and not the defect. What the defect looked like is a frame a third
     * of the viewport wide with the panel pinned to its left edge, and both of
     * those are still caught: `>= width - 24` fails for any such column, and the
     * centred/inside assertions fail independently.
     */
    if (frame.width < viewport.width - 24 || frame.height !== viewport.height) {
      problems.push(
        `${label}: the centring frame is ${frame.width}×${frame.height}; expected the viewport (± a scrollbar) ${viewport.width}×${viewport.height}`,
      );
    }
    if (!settled.closeName) problems.push(`${label}: the dialog has no named close control`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    if (await page.locator('[data-slot="morphing-dialog-panel"]').count()) {
      problems.push(`${label}: Escape did not close the dialog`);
    }
    await page.screenshot({ path: path.join(EVIDENCE, `morphing-${label}.png`) });
  }
} catch (error) {
  problems.push(`probe failed: ${String(error.message).slice(0, 200)}`);
}

await context.close();
await browser.close();
await mkdir(EVIDENCE, { recursive: true });
report.failures = problems;
await writeFile(path.join(EVIDENCE, "motion-probe.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`${problems.length === 0 ? "PASS" : "FAIL"} /motion gallery (${report.tiles?.length ?? 0} tiles)`);
for (const problem of problems) console.log(`     - ${problem}`);
console.log(`\nreport: ${path.join(EVIDENCE, "motion-probe.json")}`);
process.exit(problems.length === 0 ? 0 : 1);
