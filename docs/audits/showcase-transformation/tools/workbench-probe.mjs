/*
 * READ-ONLY: does a workbench control actually change the specimen, and does
 * clicking inside a component page hit a stray link? Evidence -> gitignored root.
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
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

// ---------------- spatial workbench: keyboard-driven control test
await hydrate("/motion/spatial");
const sliderInfo = await page.evaluate(() => {
  const s = document.querySelector("main [role=slider]");
  if (!s) return null;
  const r = s.getBoundingClientRect();
  return { label: s.getAttribute("aria-label"), now: s.getAttribute("aria-valuenow"), min: s.getAttribute("aria-valuemin"), max: s.getAttribute("aria-valuemax"), box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
});
note("slider-info", sliderInfo);

const readVars = () =>
  page.evaluate(() => {
    const root = document.documentElement;
    const cs = getComputedStyle(root);
    const deck = document.querySelector('main [data-slot="card-stack"]');
    const parallax = document.querySelector('main [data-slot="parallax-scene"]');
    return {
      rootDepth: cs.getPropertyValue("--spatial-depth").trim(),
      deckTransform: deck ? getComputedStyle(deck).transform : null,
      parallaxTransform: parallax ? getComputedStyle(parallax).transform : null,
      pageVars: deck ? { d: getComputedStyle(deck).getPropertyValue("--spatial-depth").trim() } : null,
    };
  });

const slider = page.locator("main [role=slider]").first();
await slider.focus();
const beforeNow = await slider.getAttribute("aria-valuenow");
for (let i = 0; i < 5; i += 1) await page.keyboard.press("ArrowRight");
await page.waitForTimeout(600);
const afterNow = await slider.getAttribute("aria-valuenow");
note("slider-keyboard", { beforeNow, afterNow, changed: beforeNow !== afterNow, vars: await readVars() });

// click precisely on the slider thumb
const thumbBox = await slider
  .evaluate((el) => {
    const t = el.querySelector("[data-slot='slider-thumb'], [role='slider'], span");
    const r = (t ?? el).getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  })
  .catch(() => null);
if (thumbBox) {
  await page.mouse.click(thumbBox.x, thumbBox.y);
  await page.waitForTimeout(300);
  await page.mouse.move(thumbBox.x + 80, thumbBox.y);
  await page.mouse.down();
  await page.mouse.move(thumbBox.x + 200, thumbBox.y, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  note("slider-drag", { now: await slider.getAttribute("aria-valuenow"), vars: await readVars() });
}

// orbit pause/play + headline "Change the headline"
const orbitButtons = await page.evaluate(() =>
  [...document.querySelectorAll("main button")].map((b) => b.getAttribute("aria-label") ?? b.textContent.trim().slice(0, 30)).filter(Boolean),
);
note("orbit-buttons", orbitButtons);
const headline = page.getByRole("button", { name: /change the headline/i }).first();
if (await headline.count()) {
  const before = await page.evaluate(() => document.querySelector("main")?.innerText.match(/Built for dense interfaces|Alive on every interaction|One system, many products/)?.[0] ?? null);
  await headline.click();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => document.querySelector("main")?.innerText.match(/Built for dense interfaces|Alive on every interaction|One system, many products/)?.[0] ?? null);
  note("headline-change", { before, after, changed: before !== after });
}

// ---------------- stray-link probe on component pages
const linkProbe = async (route) => {
  await hydrate(route);
  const data = await page.evaluate(() => {
    const main = document.querySelector("main");
    if (!main) return null;
    const vh = window.innerHeight;
    const links = [...main.querySelectorAll("a[href]")].map((a) => {
      const r = a.getBoundingClientRect();
      return {
        href: a.getAttribute("href"),
        text: (a.textContent || "").trim().slice(0, 28),
        inViewport: r.top < vh && r.bottom > 0 && r.width > 0,
        box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      };
    });
    return {
      firstViewportLinks: links.filter((l) => l.inViewport).slice(0, 20),
      totalLinks: links.length,
      // the demo stage: the biggest child block of main's first section
      demoBoxes: [...main.querySelectorAll("[data-slot], .luc-card, section > div")].slice(0, 6).map((n) => {
        const r = n.getBoundingClientRect();
        return { slot: n.getAttribute("data-slot"), y: Math.round(r.y), h: Math.round(r.height), hasLinkInside: !!n.querySelector("a[href]") };
      }),
    };
  });
  return data;
};

note("links-components-accordion", await linkProbe("/components/accordion"));
note("links-components-buttons", await linkProbe("/components/buttons"));
note("links-charts-line-chart", await linkProbe("/charts/line-chart"));

// click at several points across the demo region of a doc entry page
await hydrate("/components/accordion");
const navClicks = [];
for (const [dx, dy] of [[0.3, 0.2], [0.5, 0.5], [0.8, 0.35]]) {
  await hydrate("/components/accordion");
  const main = await page.locator("main").first().boundingBox();
  const url0 = page.url();
  await page.mouse.click(main.x + main.width * dx, main.y + main.height * dy);
  await page.waitForTimeout(500);
  navClicks.push({ dx, dy, navigated: page.url() !== url0, to: page.url() });
}
note("accordion-click-points", navClicks);

// prev/next footer links on a doc entry page
const pager = await page.evaluate(() => {
  const links = [...document.querySelectorAll("a[href]")].filter((a) => /previous|next/i.test(a.getAttribute("rel") ?? "") || /previous|next/i.test(a.getAttribute("aria-label") ?? ""));
  const footer = [...document.querySelectorAll("main + *, footer a[href], [data-slot='doc-pager'] a")].map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 30) }));
  return { relLinks: links.map((a) => ({ href: a.getAttribute("href"), text: a.textContent.trim().slice(0, 24) })), footer: footer.slice(0, 10) };
});
note("pager", pager);

await writeFile(path.join(EVIDENCE, "workbench-probe.json"), JSON.stringify(out, null, 1));
console.log("wrote workbench-probe.json");
await browser.close();
