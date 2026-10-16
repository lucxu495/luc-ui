/*
 * READ-ONLY UX probes (Phase B): Visuals catalog structure, spatial workbench
 * controls, and "does clicking inside a demo navigate somewhere" checks.
 * Writes evidence only under the gitignored evidence root.
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EVIDENCE = path.resolve(HERE, "../../../../artifacts/screenshots/showcase-transformation");
const BASE = "http://127.0.0.1:3000";
await mkdir(EVIDENCE, { recursive: true });
const out = { generatedAt: new Date().toISOString(), alerts: [], notes: [] };
const note = (k, v) => {
  out.notes.push({ k, v });
  process.stderr.write(`${k}: ${JSON.stringify(v)}\n`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on("dialog", async (d) => {
  out.alerts.push(d.message().slice(0, 160));
  await d.dismiss();
});

const hydrate = async (route) => {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 15000 });
};

const navShape = () =>
  page.evaluate(() => {
    const header = document.querySelector("header");
    const aside = document.querySelector("aside");
    const groupLabels = [...document.querySelectorAll("aside [data-slot='sidebar-group-label']")].map((n) => n.textContent.trim());
    return {
      headerTexts: header
        ? [...header.querySelectorAll("a,button")].map((n) => (n.textContent || "").trim()).filter(Boolean).slice(0, 20)
        : [],
      headerCurrent: [...(header?.querySelectorAll("[aria-current]") ?? [])].map((n) => n.textContent.trim()),
      sidebarGroups: groupLabels.length ? groupLabels : [...(aside?.querySelectorAll("nav > div") ?? [])].map((n) => n.textContent.trim().slice(0, 40)).slice(0, 30),
      sidebarLinks: aside ? [...aside.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")) : [],
      asideText: aside ? aside.innerText.slice(0, 2000) : null,
      outline: [...document.querySelectorAll('[aria-label*="n this page" i] a')].map((a) => a.textContent.trim()),
    };
  });

// ---------- A) Visuals catalog
await hydrate("/visuals/elements");
const catalog = await page.evaluate(() => {
  const links = [...document.querySelectorAll('a[href^="/visuals/elements/"]')].map((a) => a.getAttribute("href"));
  const unique = [...new Set(links)];
  const chips = [...document.querySelectorAll("main button, main [role=tab], main a[href*='#']")].map((n) => n.textContent.trim()).filter(Boolean).slice(0, 40);
  const anchors = [...document.querySelectorAll("main [id]")].map((n) => n.id).slice(0, 40);
  const h3 = [...document.querySelectorAll("main h3")].map((n) => n.textContent.trim());
  return { elementLinkCount: links.length, uniqueElementLinks: unique.length, sample: unique.slice(0, 10), chips, anchors, h3Count: h3.length, h3Sample: h3.slice(0, 14) };
});
note("visuals-catalog", catalog);
note("visuals-elements-nav", await navShape());

// open a real element detail page
const detailHref = catalog.sample[0];
if (detailHref) {
  await hydrate(detailHref);
  const detail = await page.evaluate(() => {
    const main = document.querySelector("main");
    const firstCanvasOrSvg = main?.querySelector("canvas, svg[data-slot], [data-slot='visual'], [data-slot*='visual']");
    const r = firstCanvasOrSvg?.getBoundingClientRect();
    const y = r ? Math.round(r.y) : null;
    return {
      h1: main?.querySelector("h1")?.textContent?.trim(),
      words: (main?.innerText ?? "").split(/\s+/).filter(Boolean).length,
      firstVisualTop: y,
      firstVisualHeight: r ? Math.round(r.height) : null,
      hasDetails: !!main?.querySelector("details"),
      codeBlocks: main?.querySelectorAll("pre").length,
      h2s: [...(main?.querySelectorAll("h2") ?? [])].map((n) => n.textContent.trim()),
    };
  });
  note("visuals-detail", { href: detailHref, ...detail });
  await page.screenshot({ path: path.join(EVIDENCE, "visuals-detail.png") });
}

// ---------- B) spatial workbench controls
await hydrate("/motion/spatial");
const controls = await page.evaluate(() => {
  const main = document.querySelector("main");
  return {
    sliders: [...(main?.querySelectorAll("[role=slider]") ?? [])].map((s) => ({ label: s.getAttribute("aria-label"), value: s.getAttribute("aria-valuenow") })),
    segmented: [...(main?.querySelectorAll("[role=tab],[role=radio]") ?? [])].map((s) => s.textContent.trim()).slice(0, 12),
    switches: [...(main?.querySelectorAll("button[role=switch],input[type=checkbox]") ?? [])].map((s) => s.getAttribute("aria-label") ?? s.textContent.trim()).slice(0, 8),
    buttons: [...(main?.querySelectorAll("button") ?? [])].map((b) => b.getAttribute("aria-label") ?? b.textContent.trim()).slice(0, 30),
    cardStackSlots: main?.querySelectorAll('[data-slot="card-stack"]').length,
    magnifySlots: main?.querySelectorAll('[data-slot="magnify-dock"], [data-slot="magnify-dock-item"]').length,
  };
});
note("spatial-controls", controls);

const readSpatialState = () =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    const deck = main?.querySelector('[data-slot="card-stack"]');
    const orbit = main?.querySelector('[data-slot="orbit-field"], [class*="orbit"]');
    const style = deck ? getComputedStyle(deck) : null;
    return {
      deckActive: deck?.getAttribute("data-active") ?? null,
      deckTransform: style?.transform ?? null,
      orbitTransform: orbit ? getComputedStyle(orbit).transform : null,
      cssVars: orbit ? { depth: getComputedStyle(orbit).getPropertyValue("--spatial-depth").trim(), lift: getComputedStyle(orbit).getPropertyValue("--spatial-lift").trim() } : null,
    };
  });

const slider = page.locator("main [role=slider]").first();
const sliderCount = await page.locator("main [role=slider]").count();
if (sliderCount > 0) {
  const before = await slider.getAttribute("aria-valuenow");
  const box = await slider.boundingBox();
  await page.mouse.click(box.x + box.width * 0.85, box.y + box.height / 2);
  await page.waitForTimeout(700);
  const after = await slider.getAttribute("aria-valuenow");
  const state = await readSpatialState();
  note("spatial-slider-change", { before, after, changed: before !== after, state });
}

// card stack controls on the workbench
const deck = page.locator('main [data-slot="card-stack"]').first();
if (await deck.count()) {
  const before = await deck.getAttribute("data-active");
  const nextBtn = deck.locator('[data-slot="card-stack-controls"] button[aria-label="Next card"]');
  if (await nextBtn.count()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
    note("spatial-deck-next", { before, after: await deck.getAttribute("data-active") });
  }
}

// ---------- C) unexpected navigation on click
const clickTargets = [
  "/components/buttons",
  "/components/slider",
  "/charts/line-chart",
  "/motion/card-stack",
  "/visuals/elements",
  "/motion/spatial",
];
for (const route of clickTargets) {
  await hydrate(route);
  const url0 = page.url();
  const demo = page.locator('main [data-slot], main canvas, main [class*="demo"]').first();
  let clicked = false;
  try {
    if (await demo.count()) {
      await demo.click({ position: { x: 30, y: 20 }, timeout: 3000 });
      clicked = true;
    }
  } catch {
    clicked = false;
  }
  await page.waitForTimeout(700);
  note("click-test", { route, clicked, navigated: page.url() !== url0, to: page.url() !== url0 ? page.url() : undefined });
}

// ---------- D) mobile sidebar / discovery on a narrow viewport
await page.setViewportSize({ width: 390, height: 844 });
await hydrate("/components/buttons");
const mobile = await page.evaluate(() => ({
  hasSidebarVisible: !!document.querySelector("aside") && getComputedStyle(document.querySelector("aside")).display !== "none",
  triggers: [...document.querySelectorAll("header button")].map((b) => b.getAttribute("aria-label") ?? b.textContent.trim()).slice(0, 10),
  bodyScrollWidth: document.body.scrollWidth,
  viewport: window.innerWidth,
}));
note("mobile", mobile);
await page.screenshot({ path: path.join(EVIDENCE, "mobile-components-buttons.png") });

await writeFile(path.join(EVIDENCE, "ux-probe.json"), JSON.stringify(out, null, 1));
console.log("wrote ux-probe.json");
await browser.close();
