/*
 * READ-ONLY competitor structure probe (Phase C).
 * Visits each site's home + one catalog + one detail page, records observable
 * structure (sidebar, preview, code access, tabs, API reference placement).
 * Screenshots go to the gitignored evidence root.
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const EVIDENCE = path.resolve(HERE, "../../../../artifacts/screenshots/showcase-transformation/competitors");
await mkdir(EVIDENCE, { recursive: true });
const out = { generatedAt: new Date().toISOString(), sites: [] };

const SITES = [
  { id: "reactbits", home: "https://reactbits.dev", detail: "https://reactbits.dev/animations/animated-content" },
  { id: "shadcn", home: "https://ui.shadcn.com", detail: "https://ui.shadcn.com/docs/components/button" },
  { id: "motion-primitives", home: "https://motion-primitives.com", detail: "https://motion-primitives.com/docs/text-effect" },
  { id: "magicui", home: "https://magicui.design", detail: "https://magicui.design/docs/components/marquee" },
  { id: "aceternity", home: "https://ui.aceternity.com", detail: "https://ui.aceternity.com/components/animated-testimonials" },
  { id: "mantine", home: "https://mantine.dev", detail: "https://mantine.dev/core/button/" },
  { id: "radix-themes", home: "https://www.radix-ui.com/themes", detail: "https://www.radix-ui.com/themes/docs/components/button" },
  { id: "echarts", home: "https://echarts.apache.org/examples", detail: "https://echarts.apache.org/examples/en/editor.html?c=line-simple" },
  { id: "21st", home: "https://21st.dev", detail: "https://21st.dev/community/components" },
];

const browser = await chromium.launch();

const structure = async (page) => {
  return page.evaluate(() => {
    const q = (s) => [...document.querySelectorAll(s)];
    const text = (el) => (el?.textContent ?? "").trim();
    const headings = q("h1,h2,h3").map((h) => `${h.tagName}:${text(h).slice(0, 40)}`).slice(0, 25);
    const navs = q("nav, aside").map((n) => ({
      tag: n.tagName.toLowerCase(),
      label: n.getAttribute("aria-label"),
      links: n.querySelectorAll("a[href]").length,
      firstTexts: [...n.querySelectorAll("a[href]")].slice(0, 12).map((a) => text(a).slice(0, 26)),
    })).filter((n) => n.links > 2).slice(0, 6);
    const codeBlocks = q("pre, code").length;
    const copyButtons = q('button[aria-label*="opy" i], button').filter((b) => /copy/i.test(text(b) || (b.getAttribute("aria-label") ?? ""))).length;
    const tabs = q('[role="tab"]').map((t) => text(t).slice(0, 20)).slice(0, 12);
    const tables = q("table").length;
    const iframes = q("iframe").length;
    const canvases = q("canvas").length;
    const breadcrumb = q('[aria-label*="readcrumb" i], nav[aria-label*="readcrumb" i]').length;
    const bodyWords = (document.body.innerText || "").split(/\s+/).filter(Boolean).length;
    const firstHeadingTop = (() => { const h = document.querySelector("h1"); const r = h?.getBoundingClientRect(); return r ? Math.round(r.top) : null; })();
    const links = q("a[href]").length;
    return { title: document.title, links, navs, headings, codeBlocks, copyButtons, tabs, tables, iframes, canvases, breadcrumb, bodyWords, firstHeadingTop };
  });
};

for (const site of SITES) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const entry = { id: site.id };
  for (const [kind, url] of [["home", site.home], ["detail", site.detail]]) {
    try {
      const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
      entry[kind] = { url, status: resp?.status() };
      await page.waitForTimeout(2500);
      entry[kind].structure = await structure(page);
      await page.screenshot({ path: path.join(EVIDENCE, `${site.id}-${kind}.png`), fullPage: false });
    } catch (e) {
      entry[kind] = { url, error: String(e).slice(0, 160) };
    }
  }
  // narrow viewport on the detail page
  try {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(site.detail, { waitUntil: "domcontentloaded", timeout: 45000 });
    await page.waitForTimeout(1500);
    entry.mobile = await page.evaluate(() => ({
      scrollWidth: document.body.scrollWidth,
      viewport: window.innerWidth,
      navVisible: !!document.querySelector("nav,aside") && getComputedStyle(document.querySelector("nav,aside")).display !== "none",
      toggles: [...document.querySelectorAll("button")].map((b) => b.getAttribute("aria-label") ?? "").filter(Boolean).slice(0, 8),
    }));
    await page.screenshot({ path: path.join(EVIDENCE, `${site.id}-mobile.png`), fullPage: false });
  } catch (e) {
    entry.mobile = { error: String(e).slice(0, 120) };
  }
  await page.close();
  out.sites.push(entry);
  process.stderr.write(`done ${site.id}\n`);
}

await writeFile(path.join(EVIDENCE, "competitors.json"), JSON.stringify(out, null, 1));
console.log("wrote competitors.json");
await browser.close();
