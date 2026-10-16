/*
 * READ-ONLY: demo position vs prose, demo-region links, duplicate ids, slider
 * track interaction. Evidence -> gitignored root.
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EVIDENCE = path.resolve(HERE, "../../../../artifacts/screenshots/showcase-transformation");
const BASE = "http://127.0.0.1:3000";
await mkdir(EVIDENCE, { recursive: true });
const out = { generatedAt: new Date().toISOString(), notes: [] };
const note = (k, v) => {
  out.notes.push({ k, v });
  process.stderr.write(`${k}: ${JSON.stringify(v)}\n`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const hydrate = async (route) => {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 15000 });
};

// ---------- 1. demo position vs prose, per detail page
const DETAILS = [
  "/components/buttons",
  "/components/inputs",
  "/components/slider",
  "/components/accordion",
  "/charts/line-chart",
  "/charts/violin-chart",
  "/motion/card-stack",
  "/motion/kinetic",
  "/docs/reference",
  "/visuals/elements",
];
for (const route of DETAILS) {
  await hydrate(route);
  const info = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;
    const demo = main.querySelector("canvas, [data-slot='demo-stage'], [data-slot='playground'], [data-slot='card-stack'], [data-slot='chart'], figure");
    const rect = demo?.getBoundingClientRect();
    // words that appear before the demo in DOM order
    let wordsBefore = null;
    if (demo) {
      const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
      let collected = "";
      while (walker.nextNode()) {
        const n = walker.currentNode;
        if (demo.contains(n) || n.compareDocumentPosition(demo) & Node.DOCUMENT_POSITION_PRECEDING) break;
        collected += n.textContent + " ";
      }
      wordsBefore = collected.split(/\s+/).filter(Boolean).length;
    }
    return {
      scrollHeight: document.documentElement.scrollHeight,
      mainHeight: Math.round(main.getBoundingClientRect().height),
      demoSlot: demo?.getAttribute("data-slot") ?? demo?.tagName.toLowerCase() ?? null,
      demoTop: rect ? Math.round(rect.top + window.scrollY) : null,
      demoHeight: rect ? Math.round(rect.height) : null,
      wordsBeforeDemo: wordsBefore,
      h1Top: (() => { const h = main.querySelector("h1"); const r = h?.getBoundingClientRect(); return r ? Math.round(r.top + window.scrollY) : null; })(),
    };
  });
  note(`detail:${route}`, info);
}

// ---------- 2. links inside demo regions that point at other doc entries
const DEMO_ROUTES = ["/components/buttons", "/components/cards", "/components/inputs", "/motion/spatial", "/charts/timeseries", "/blocks", "/patterns"];
for (const route of DEMO_ROUTES) {
  await hydrate(route);
  const links = await page.evaluate(() => {
    const main = document.querySelector("main");
    const demo = main?.querySelector("[data-slot='demo-stage'], [data-slot='demo'], .demo, [data-slot='playground']");
    const scope = demo ?? main;
    return [...(scope?.querySelectorAll("a[href]") ?? [])].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 26) })).slice(0, 25);
  });
  note(`demo-links:${route}`, links);
}

// ---------- 3. duplicate ids in the document
for (const route of ["/visuals/elements", "/motion", "/components/accordion", "/charts/catalog"]) {
  await hydrate(route);
  const dupes = await page.evaluate(() => {
    const counts = {};
    for (const el of document.querySelectorAll("[id]")) counts[el.id] = (counts[el.id] ?? 0) + 1;
    return Object.entries(counts).filter(([, n]) => n > 1).slice(0, 20);
  });
  note(`duplicate-ids:${route}`, dupes);
}

// ---------- 4. slider track click (correct target)
await hydrate("/motion/spatial");
const track = await page.evaluate(() => {
  const thumb = document.querySelector("main [role=slider]");
  const root = thumb?.closest("[data-orientation], span");
  const r = (root ?? thumb).getBoundingClientRect();
  return { rootTag: root?.tagName, box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, now: thumb?.getAttribute("aria-valuenow") };
});
note("slider-track", track);
if (track.box.w > 30) {
  await page.mouse.click(track.box.x + track.box.w * 0.85, track.box.y + track.box.h / 2);
  await page.waitForTimeout(500);
  note("slider-track-click", { now: await page.locator("main [role=slider]").first().getAttribute("aria-valuenow") });
}

// ---------- 5. the /motion gallery tiles
await hydrate("/motion");
const gallery = await page.evaluate(() => {
  const main = document.querySelector("main");
  const links = [...(main?.querySelectorAll("a[href]") ?? [])].map((a) => a.getAttribute("href")).filter((h) => h.startsWith("/motion/"));
  return { motionLinks: [...new Set(links)].length, sample: [...new Set(links)].slice(0, 12) };
});
note("motion-gallery", gallery);

await writeFile(path.join(EVIDENCE, "detail-probe.json"), JSON.stringify(out, null, 1));
console.log("wrote detail-probe.json");
await browser.close();
