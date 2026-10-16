/*
 * READ-ONLY Showcase audit harness (Phase B of the Showcase Transformation audit).
 *
 * It never writes into the repository except under the gitignored evidence root.
 * It observes the *running* Showcase over HTTP + a real Chromium.
 *
 * usage:
 *   node tools/browser-sweep.mjs [--shots] [--limit=N] [--base=URL]
 */
import { chromium } from "/home/luc/code/luc-quant/node_modules/.pnpm/playwright@1.63.0/node_modules/playwright/index.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const AUDIT = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(AUDIT, "../../../artifacts/screenshots/showcase-transformation");

const argv = process.argv.slice(2);
const shots = argv.includes("--shots");
const base = (argv.find((a) => a.startsWith("--base=")) ?? "--base=http://127.0.0.1:3000").slice(7);

const ROUTES = [
  "/",
  "/docs", "/docs/installation", "/docs/theming", "/docs/reference",
  "/foundations", "/foundations/colors", "/foundations/themes",
  "/components", "/components/buttons", "/components/inputs", "/components/cards",
  "/components/ai", "/components/accordion", "/components/slider", "/components/overlay",
  "/charts", "/charts/catalog", "/charts/timeseries", "/charts/line-chart",
  "/charts/violin-chart", "/charts/financial", "/charts/correlation-matrix",
  "/motion", "/motion/kinetic", "/motion/card-stack", "/motion/spatial", "/motion/spotlight",
  "/visuals", "/visuals/elements", "/visuals/elements/metric", "/visuals/elements/data",
  "/visuals/styles", "/visuals/themes", "/visuals/art", "/visuals/artifacts",
  "/visuals/compositions", "/visuals/docs", "/visuals/skins",
  "/explore", "/explore/browse",
  "/blocks", "/templates", "/experiences", "/experiences/vertical/finance",
  "/patterns", "/patterns/research-workspace",
  "/studios/charts", "/studios/motion", "/studios/themes", "/studios/composer",
  "/application", "/forms", "/data/table", "/date-time/calendar",
  "/integrations/tradingview", "/experiments/design-lab",
];

const probe = async (page) => {
  const textOf = async (sel) => {
    const n = await page.locator(sel).first();
    return (await n.count()) ? (await n.innerText().catch(() => "")).trim().slice(0, 160) : null;
  };
  const main = page.locator("main").first();
  const body = (await main.count()) ? await main.innerText().catch(() => "") : "";
  const links = await page.locator("a[href]").evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("href") ?? "").filter(Boolean),
  );
  return {
    title: await page.title(),
    h1Count: await page.locator("h1").count(),
    h1: await textOf("h1"),
    areaCurrent: await page.evaluate(() => {
      const el = document.querySelector('header [aria-current], nav [aria-current="page"]');
      return el ? el.textContent.trim().slice(0, 60) : null;
    }),
    headerAreaLinks: await page.locator("header nav a").evaluateAll((n) =>
      n.map((x) => x.textContent.trim()).filter(Boolean).slice(0, 14),
    ),
    sidebarGroups: await page.locator('aside [data-slot="sidebar-group-label"], aside nav > div > span').evaluateAll((n) =>
      n.map((x) => x.textContent.trim()).filter(Boolean).slice(0, 30),
    ),
    sidebarLinkCount: await page.locator("aside a[href]").count(),
    breadcrumb: await page.locator('nav[aria-label*="readcrumb" i]').count(),
    outlineItems: await page.locator('[aria-label*="n this page" i] a').count(),
    h2: await page.locator("main h2").count(),
    h3: await page.locator("main h3").count(),
    words: body ? body.split(/\s+/).filter(Boolean).length : null,
    codeBlocks: await page.locator("main pre").count(),
    tabs: await page.locator('[role="tab"]').count(),
    inputs: await page.locator("main input, main [role=slider], main select").count(),
    buttons: await page.locator("main button").count(),
    canvases: await page.locator("main canvas").count(),
    svgs: await page.locator("main svg").count(),
    hrefCount: links.length,
    externalHrefCount: links.filter((h) => h.startsWith("http")).length,
  };
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await mkdir(EVIDENCE, { recursive: true });
const results = [];
const limit = Number((argv.find((a) => a.startsWith("--limit=")) ?? "").slice(8) || 0);
const routes = limit ? ROUTES.slice(0, limit) : ROUTES;

for (const route of routes) {
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text().slice(0, 240));
  });
  page.on("pageerror", (e) => errors.push(`pageerror: ${String(e).slice(0, 240)}`));
  page.on("requestfailed", (r) => failed.push(`${r.url().slice(0, 120)} ${r.failure()?.errorText ?? ""}`));
  const entry = { route, ok: true };
  try {
    const response = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 30000 });
    entry.status = response ? response.status() : null;
    await page
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", { timeout: 12000 })
      .catch(() => {
        entry.hydrated = false;
      });
    entry.hydrated = entry.hydrated !== false;
    entry.finalUrl = new URL(page.url()).pathname;
    Object.assign(entry, await probe(page));
    entry.consoleErrors = errors;
    entry.requestFailed = failed.slice(0, 6);
    if (shots) {
      const name = route === "/" ? "root" : route.replace(/^\//, "").replace(/\//g, "__");
      await page.screenshot({ path: path.join(EVIDENCE, `${name}.png`), fullPage: false });
    }
    if (!errors.length) delete entry.consoleErrors;
    if (!failed.length) delete entry.requestFailed;
  } catch (e) {
    entry.ok = false;
    entry.error = String(e).slice(0, 300);
  }
  await page.close();
  results.push(entry);
  process.stderr.write(`${route} ${entry.status ?? "ERR"} ${entry.words ?? ""}w ${entry.h1 ?? ""}\n`);
}

await browser.close();
await writeFile(path.join(EVIDENCE, "sweep.json"), JSON.stringify({ base, generatedAt: new Date().toISOString(), results }, null, 1));
console.log(`wrote ${results.length} rows to ${EVIDENCE}/sweep.json`);
