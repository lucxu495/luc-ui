/*
 * READ-ONLY Card Stack + motion interaction probe (Phase B4).
 * Writes evidence only under the gitignored evidence root.
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EVIDENCE = path.resolve(HERE, "../../../../artifacts/screenshots/showcase-transformation");
const BASE = "http://127.0.0.1:3000";
await mkdir(EVIDENCE, { recursive: true });

const out = { generatedAt: new Date().toISOString(), base: BASE, steps: [] };
const log = (step, data) => {
  out.steps.push({ step, ...data });
  process.stderr.write(`${step}: ${JSON.stringify(data)}\n`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 200)}`));

await page.goto(`${BASE}/motion/card-stack`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 15000 });

const deck = page.locator('[data-slot="card-stack"]').first();
await deck.scrollIntoViewIfNeeded();

const geom = () =>
  page.evaluate(() => {
    const d = document.querySelector('[data-slot="card-stack"]');
    if (!d) return null;
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
    };
    const layers = [...d.querySelectorAll('[data-slot="card-stack-layer"]')].map((l) => ({
      position: l.getAttribute("data-position"),
      ariaHidden: l.getAttribute("aria-hidden"),
      inert: l.hasAttribute("inert"),
      pointerEvents: getComputedStyle(l).pointerEvents,
      transform: getComputedStyle(l).transform,
      zIndex: getComputedStyle(l).zIndex,
      opacity: getComputedStyle(l).opacity,
      box: box(l),
      itemBox: box(l.querySelector('[data-slot="card-stack-item"]')),
      cardBox: box(l.querySelector('[data-slot="card-stack-item"] > *')),
    }));
    const controls = d.querySelector('[data-slot="card-stack-controls"]');
    const overlay = d.querySelector('[data-slot="card-stack-overlay"]');
    const status = d.querySelector('[role="status"]');
    const deckStyle = getComputedStyle(d);
    return {
      active: d.getAttribute("data-active"),
      deck: box(d),
      deckHeightCss: deckStyle.height,
      deckOverflow: deckStyle.overflow,
      minHeight: deckStyle.minHeight,
      layers,
      controls: box(controls),
      controlsButtons: controls ? [...controls.querySelectorAll("button")].map((b) => ({ label: b.getAttribute("aria-label"), disabled: b.disabled })) : [],
      overlay: box(overlay),
      status: status ? status.textContent.trim() : null,
      focusablesInsideInactive: [...d.querySelectorAll('a[href],button,input,select,textarea')].map((el) => ({
        tag: el.tagName.toLowerCase(),
        label: (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().slice(0, 30),
        inInactive: !!el.closest('[data-position]:not([data-position="0"])'),
        tabIndex: el.tabIndex,
      })),
    };
  });

log("initial-geometry", await geom());
await page.screenshot({ path: path.join(EVIDENCE, "card-stack-initial.png") });

// --- controls: Next / Previous
const active = () => deck.getAttribute("data-active");
const before = await active();
await deck.locator('[data-slot="card-stack-controls"] button[aria-label="Next card"]').click();
await page.waitForTimeout(600);
log("after-next-click", { before, after: await active(), status: (await geom()).status });

// clicking the same card body must NOT navigate
const urlBefore = page.url();
await deck.locator('[data-position="0"] [data-slot="card-stack-item"]').click({ position: { x: 40, y: 20 } });
await page.waitForTimeout(400);
log("card-body-click", { navigated: page.url() !== urlBefore, url: page.url() });

// --- keyboard
await deck.focus();
await page.keyboard.press("ArrowLeft");
await page.waitForTimeout(500);
log("after-arrowleft", { active: await active(), status: (await geom()).status });
await page.keyboard.press("End");
await page.waitForTimeout(500);
log("after-end", { active: await active(), status: (await geom()).status });
const endGeom = await geom();
log("end-geometry", { layers: endGeom.layers, nextDisabled: endGeom.controlsButtons });

// --- drag
await page.keyboard.press("Home");
await page.waitForTimeout(400);
const deckBox = await deck.boundingBox();
await page.mouse.move(deckBox.x + deckBox.width * 0.7, deckBox.y + 40);
await page.mouse.down();
await page.mouse.move(deckBox.x + deckBox.width * 0.2, deckBox.y + 40, { steps: 12 });
await page.mouse.up();
await page.waitForTimeout(600);
log("after-drag-left", { active: await active(), status: (await geom()).status });

// --- tab order: can Tab reach a hidden card?
await page.keyboard.press("Home");
await deck.focus();
const tabStops = [];
for (let i = 0; i < 6; i += 1) {
  await page.keyboard.press("Tab");
  tabStops.push(
    await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName.toLowerCase() ?? null,
        insideInactive: !!el?.closest('[data-position]:not([data-position="0"])'),
        text: (el?.textContent ?? "").trim().slice(0, 24),
        aria: el?.getAttribute("aria-label"),
      };
    }),
  );
}
log("tab-order", { tabStops });
await page.screenshot({ path: path.join(EVIDENCE, "card-stack-after-interactions.png") });

// --- narrow viewport
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
await deck.scrollIntoViewIfNeeded();
const narrow = await geom();
log("narrow-390", { deck: narrow.deck, controls: narrow.controls, active: narrow.active });
await page.screenshot({ path: path.join(EVIDENCE, "card-stack-390.png") });
await page.setViewportSize({ width: 1440, height: 900 });

// --- other motion specimens: magnify-dock / orbit / parallax quick sanity
await page.goto(`${BASE}/motion/spatial`, { waitUntil: "domcontentloaded" });
await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 15000 });
const spatial = await page.evaluate(() => {
  const slots = {};
  for (const s of ["card-stack", "orbit-field", "parallax-scene", "magnify-dock"]) {
    slots[s] = document.querySelectorAll(`[data-slot="${s}"]`).length;
  }
  const overflowing = [];
  for (const el of document.querySelectorAll("main *")) {
    if (el.children.length === 0 && el.scrollWidth > el.clientWidth + 4 && el.clientWidth > 0) {
      overflowing.push({ tag: el.tagName.toLowerCase(), cls: (el.className ?? "").toString().slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth });
    }
    if (overflowing.length > 8) break;
  }
  return { slots, overflowing };
});
log("spatial-page", spatial);

out.consoleErrors = errors;
await writeFile(path.join(EVIDENCE, "card-stack.json"), JSON.stringify(out, null, 1));
console.log("wrote", path.join(EVIDENCE, "card-stack.json"));
await browser.close();
