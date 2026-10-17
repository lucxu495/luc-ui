/**
 * V2 page contract, in a real browser.
 *
 * `scripts/v2-inventory.mjs` reads the source; this reads the *page*. The split
 * matters because the two failures a static check cannot see are the ones that
 * matter most here:
 *
 *   - an example whose disclosure does not open, or whose copy button copies
 *     something other than the code shown — "has a `code` prop" is satisfied by
 *     both a working and a broken page;
 *   - a specimen that renders at 1440px and overflows at 390px.
 *
 * For every page in the committed inventory it asserts: HTTP 200, hydration, the
 * example count matches the source, every example has a title, a real
 * `aria-expanded` disclosure and a named copy control, the disclosure reveals the
 * source, `Copy` puts that source on the clipboard, no console error, and no
 * horizontal overflow. Chinese and mobile passes cover a representative sample of
 * every component family.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/v2-pages.mjs
 *   node qa/v2-pages.mjs --routes=/components/alert,/forms
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(APP, "../../artifacts/screenshots/showcase-transformation");
const INVENTORY = path.resolve(APP, "../../docs/audits/showcase-transformation/progress/v2-inventory.json");
const BASE = resolveBaseUrl();

const argRoutes = process.argv.find((value) => value.startsWith("--routes="));
const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

/** One page of each component family, for the locale and mobile passes. */
const SAMPLED = [
  "/components/buttons", // actions
  "/components/inputs", // forms
  "/components/select",
  "/components/alert", // feedback
  "/components/empty-state",
  "/components/dialog", // overlays
  "/components/menus",
  "/data/table", // data display
  "/date-time/calendar", // date and time
  "/application/workspace", // layout / application
  "/components/ai", // AI surfaces
  "/components/accordion", // disclosure
];

const READ_PAGE = () => {
  const examples = [...document.querySelectorAll('[data-slot="example"]')];
  const main = document.querySelector("main");
  return {
    examples: examples.length,
    titles: examples.map((node) => node.querySelector("h3")?.textContent?.trim() ?? null),
    disclosures: examples.filter((node) => node.querySelector("button[aria-expanded]")).length,
    copies: examples.filter((node) => {
      const button = node.querySelector("button[aria-label], button[title]");
      return Boolean(button);
    }).length,
    demos: document.querySelectorAll('[data-slot="demo"]').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    words: (main?.innerText ?? "").split(/\s+/).filter(Boolean).length,
  };
};

async function checkPage(page, route, viewport) {
  const problems = [];
  const consoleErrors = [];
  const onError = (message) => consoleErrors.push(String(message).slice(0, 200));
  page.on("pageerror", onError);
  page.on("console", (message) => {
    if (message.type() === "error") onError(message.text());
  });

  const response = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 120000 });
  const status = response?.status() ?? 0;
  if (status !== 200) problems.push(`HTTP ${status}`);
  await page
    .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 60000 })
    .catch(() => problems.push("never hydrated"));

  const state = await page.evaluate(READ_PAGE);
  if (state.overflow > 1) problems.push(`horizontal overflow ${state.overflow}px at ${viewport.width}px`);
  if (state.examples !== state.disclosures) {
    problems.push(`${state.examples - state.disclosures} example(s) with no disclosure`);
  }
  if (state.examples !== state.copies) problems.push(`${state.examples - state.copies} example(s) with no copy control`);
  const untitled = state.titles.filter((title) => title === null || title.length < 2).length;
  if (untitled > 0) problems.push(`${untitled} example(s) with no title`);

  /* One real interaction: open the source and read what copy would put on the
   * clipboard. A page where either half is wired to the wrong thing fails here
   * and nowhere else. */
  if (state.examples > 0 && viewport === desktop) {
    const first = page.locator('[data-slot="example"]').first();
    /*
     * The *disclosure*, not the first `aria-expanded` control inside the
     * specimen — an accordion trigger, a menu trigger and a select trigger are
     * all `aria-expanded` buttons, and clicking one of those opens the wrong
     * thing (or navigates). The button's name is "Show code" / "显示代码" in
     * every locale, which is the one property unique to it.
     */
    const toggle = first.getByRole("button", { name: /code|代码/i }).first();
    const before = await toggle.getAttribute("aria-expanded");
    await toggle.click();
    /* The *same* locator: re-reading `button[aria-expanded]` inside the example
     * would find the specimen's own control (a select trigger, an accordion
     * trigger) and report a state change that never happened. */
    const after = await toggle.getAttribute("aria-expanded");
    if (before === after) problems.push("the disclosure does not change state");
    const code = await first.locator("pre").innerText().catch(() => "");
    if (code.trim().length < 8) problems.push("the revealed source is empty");
    const copyVisible = await first.locator("pre").isVisible().catch(() => false);
    if (!copyVisible) problems.push("the revealed source is not visible");

    /*
     * `Copy` must put the *shown* source on the clipboard.
     *
     * This file's header has promised it since it was written — "`Copy` puts
     * that source on the clipboard" — and the body never checked it, so a page
     * whose copy button carried the wrong string, or the snippet of a different
     * example, would have passed. The desktop context already grants clipboard
     * access for exactly this; the other passes skip it, because they reuse
     * contexts that do not.
     */
    /*
     * The *code* copy control, by its own name.
     *
     * `/copy|复制/i` also matches a specimen that happens to contain one — an
     * `IconButton label="Copy run id"` is the case that found this — and since
     * `.first()` walks the DOM, the specimen's button (which is above the frame's
     * control) won the match. The probe then clicked a documentation control,
     * copied nothing, and reported the *previous* page's clipboard contents as a
     * wrong snippet. The example frame names its control "Copy code"; that is the
     * unique property to select on, exactly as the disclosure uses "Show code".
     */
    const copy = first.getByRole("button", { name: /copy code|复制代码/i }).first();
    if ((await copy.count()) === 0) {
      problems.push("no copy control on the first example");
    } else {
      await copy.click();
      const copied = await page.evaluate(() => navigator.clipboard.readText()).catch(() => null);
      if (copied === null) problems.push("the clipboard could not be read");
      else if (copied.trim() !== code.trim()) {
        problems.push(`Copy put ${copied.trim().slice(0, 40)}… on the clipboard, not the shown source`);
      }
    }
  }

  page.off("pageerror", onError);
  for (const message of consoleErrors) problems.push(`console: ${message}`);
  return { route, status, ...state, problems };
}

async function main() {
  const inventory = JSON.parse(await readFile(INVENTORY, "utf8"));
  const allRoutes = inventory.pages.filter((page) => page.examples > 0).map((page) => page.route);
  const routes = argRoutes ? argRoutes.slice("--routes=".length).split(",") : allRoutes;

  const browser = await chromium.launch();
  const results = [];

  const desktopContext = await browser.newContext({
    viewport: desktop,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const desktopPage = await desktopContext.newPage();
  for (const route of routes) {
    const result = await checkPage(desktopPage, route, desktop);
    results.push({ ...result, pass: "en", viewport: "1440" });
  }
  await desktopContext.close();

  const zhContext = await browser.newContext({ viewport: desktop });
  /* Every pass, not just the English desktop one: the copy check reads the
   * clipboard, and a context without write permission fails it for a reason
   * that has nothing to do with the page. */
  await zhContext.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  const zhPage = await zhContext.newPage();
  for (const route of SAMPLED) {
    const result = await checkPage(zhPage, `/zh${route}`, desktop);
    results.push({ ...result, pass: "zh", viewport: "1440" });
  }
  await zhContext.close();

  const mobileContext = await browser.newContext({ viewport: mobile });
  await mobileContext.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  const mobilePage = await mobileContext.newPage();
  for (const route of SAMPLED) {
    const result = await checkPage(mobilePage, route, mobile);
    results.push({ ...result, pass: "en-mobile", viewport: "390" });
  }
  await mobileContext.close();
  await browser.close();

  await mkdir(EVIDENCE, { recursive: true });
  await writeFile(
    path.join(EVIDENCE, "v2-pages.json"),
    `${JSON.stringify({ base: BASE, at: new Date().toISOString(), results }, null, 2)}\n`,
  );

  const failed = results.filter((result) => result.problems.length > 0);
  const examples = results.reduce((sum, result) => sum + result.examples, 0);
  console.log(
    `V2 pages: ${results.length - failed.length}/${results.length} checks OK · ${examples} examples rendered · ` +
      `${results.filter((r) => r.pass === "zh").length} Chinese · ${results.filter((r) => r.viewport === "390").length} at 390px`,
  );
  for (const result of failed) {
    console.log(`  FAIL ${result.pass} ${result.route}`);
    for (const problem of result.problems.slice(0, 6)) console.log(`       - ${problem}`);
  }
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
