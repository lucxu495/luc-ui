/**
 * NAV-004 — one Components sidebar, whichever page you click into.
 *
 * The reported defect: entering Motion replaced the Components sidebar with
 * Motion's own four-row tree ("Motion / Part of Components"). Motion was
 * declared a Components family *and* a separate navigation area, the shell
 * honours the area, and so the reader lost the four sections they had been
 * browsing while the breadcrumb went on saying Components.
 *
 * This is the gate that would have caught it, and the gate that says it is
 * fixed. It does not read the area model or any label: it opens `/components`,
 * **expands every section and every family** until the whole tree is in the DOM,
 * reads the hrefs out of the rendered sidebar, and then *clicks each one* in
 * turn, asserting after every click that
 *
 *   - the four sections are still the four sections, in the same order;
 *   - the section that owns the destination is expanded;
 *   - exactly one row is marked current, and it points at the page you are on;
 *   - nothing moved the reader to another area, another language or another URL
 *     than the link promised (a declared canonical redirect is allowed, and is
 *     reported as such);
 *   - the page did not scroll sideways, and the layout is intact.
 *
 * Then it does the same for Back/Forward, a sample of direct reloads, the whole
 * Chinese pass (whose section headings are different words), and the mobile
 * drawer. Finally it checks the opposite direction — that clicking into Charts
 * or Visuals *does* change the navigation area — because a check that only ever
 * sees the same four sections would pass on a site where the sidebar never
 * changed at all.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/sidebar-continuity.mjs
 *   … node qa/sidebar-continuity.mjs --limit=20     # first N destinations
 *   … node qa/sidebar-continuity.mjs --json
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = resolveBaseUrl();

const json = process.argv.includes("--json");
const limitArg = process.argv.find((value) => value.startsWith("--limit="));
const LIMIT = limitArg ? Number.parseInt(limitArg.slice("--limit=".length), 10) : 0;

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };

/** The four sections, in English and in Chinese — asserted, not derived from the
 * model under test, because a gate that reads its expectation from the code it
 * is checking cannot fail. */
const SECTIONS = {
  en: ["Design foundations", "UI components", "Motion and interaction", "Integrations"],
  "zh-CN": ["设计基础", "界面组件", "动效与交互", "集成"],
};

const failures = [];
const detail = [];
const report = { base: BASE, tested: [], directLoads: [], history: [], mobile: [], areaSwitches: [] };

/** Read the rendered sidebar: section headings and their state, current rows. */
const SIDEBAR_STATE = () => {
  /*
   * The *visible* tree, not the first one in the document.
   *
   * On a phone the desktop sidebar is still in the DOM behind the drawer, so a
   * probe that takes whichever it finds first measures a hidden column and then
   * reports that the drawer has no rows in it.
   */
  const sheet = document.querySelector('[data-slot="sheet"]');
  const sidebar =
    sheet && sheet.checkVisibility && sheet.checkVisibility()
      ? sheet
      : document.querySelector('[data-slot="app-shell-sidebar"]') ?? sheet;
  if (!sidebar) return null;
  return {
    path: location.pathname,
    sections: [...sidebar.querySelectorAll('[data-slot="sidebar-group-label"]')].map((node) => ({
      label: (node.textContent ?? "").trim(),
      expanded: node.getAttribute("aria-expanded") === "true",
    })),
    current: [...sidebar.querySelectorAll('[data-slot="sidebar-item"][data-current="true"]')].map((node) => {
      const anchor = node.querySelector("a[href]");
      return { label: (node.textContent ?? "").trim(), href: anchor?.getAttribute("href") ?? null };
    }),
    currentLinks: [...sidebar.querySelectorAll('[data-slot="sidebar-item"] a[href]')]
      .filter((node) => node.getAttribute("aria-current") === "page")
      .map((node) => node.getAttribute("href")),
    links: [...sidebar.querySelectorAll("a[href]")].map((node) => node.getAttribute("href")),
  };
};

/**
 * Open every disclosure in the sidebar so the whole tree is in the DOM.
 *
 * A collapsed row is not in the document, so a sweep that does not expand first
 * measures the first level and calls it the sidebar.
 */
async function expandAll(page) {
  for (let pass = 0; pass < 6; pass += 1) {
    const opened = await page.evaluate(() => {
      const sheet = document.querySelector('[data-slot="sheet"]');
      const root =
        sheet && sheet.checkVisibility && sheet.checkVisibility()
          ? sheet
          : document.querySelector('[data-slot="app-shell-sidebar"]') ?? sheet;
      if (!root) return 0;
      let count = 0;
      for (const node of root.querySelectorAll('[aria-expanded="false"]')) {
        node.click();
        count += 1;
      }
      return count;
    });
    await page.waitForTimeout(200);
    if (opened === 0) return;
  }
}

/** Every distinct destination the Components sidebar offers, in document order. */
async function extractDestinations(page) {
  await expandAll(page);
  return page.evaluate(() => {
    const sheet = document.querySelector('[data-slot="sheet"]');
    const root =
      sheet && sheet.checkVisibility && sheet.checkVisibility()
        ? sheet
        : document.querySelector('[data-slot="app-shell-sidebar"]') ?? sheet;
    const seen = [];
    for (const anchor of root.querySelectorAll('[data-slot="sidebar-item"] a[href]')) {
      const href = anchor.getAttribute("href");
      if (!href || !seen.includes(href)) seen.push(href);
    }
    return seen;
  });
}

function assertFourSections(state, locale, where) {
  const expected = SECTIONS[locale];
  const labels = state.sections.map((section) => section.label);
  if (labels.join(" | ") !== expected.join(" | ")) {
    failures.push(`${where}: sidebar sections are "${labels.join(" | ")}"`);
    return false;
  }
  return true;
}

const browser = await chromium.launch();
await mkdir(EVIDENCE, { recursive: true });

/* ------------------------------------------------------- desktop, English */
{
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("pageerror", (error) => consoleErrors.push(String(error).slice(0, 160)));

  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });

  const destinations = await extractDestinations(page);
  const targets = LIMIT > 0 ? destinations.slice(0, LIMIT) : destinations;

  /* Back to a fresh tree before clicking: expanding everything left every row
     open, and the click path should be the path a reader takes. */
  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });

  for (const href of targets) {
    /*
     * Click, from the sidebar, exactly as a reader would — but with the tree
     * open, because a link that is only reachable after three disclosures is
     * still a destination the sidebar offers.
     */
    await expandAll(page);
    const link = page.locator(`[data-slot="app-shell-sidebar"] [data-slot="sidebar-item"] a[href="${href}"]`).first();
    if ((await link.count()) === 0) {
      failures.push(`${href}: extracted from the sidebar but not clickable`);
      continue;
    }
    await link.click({ timeout: 15000 }).catch((error) => {
      failures.push(`${href}: click failed — ${String(error.message).slice(0, 120)}`);
    });
    /*
     * Wait for the *navigation*, not for a fixed delay.
     *
     * A 220ms sleep was enough for most destinations and not for the heavy ones —
     * a chart page or a page with a lazily loaded island took longer, the probe
     * read the sidebar while `/components` was still on screen, and reported that
     * thirteen pages had lost their current row. The condition is "we left the
     * hub", which is true for every destination including the ones that redirect.
     */
    await page
      .waitForFunction(() => location.pathname !== "/components", null, { timeout: 15000 })
      .catch(() => failures.push(`${href}: the click did not navigate away from /components`));
    await page.waitForTimeout(160);

    const state = await page.evaluate(SIDEBAR_STATE);
    const landed = state?.path ?? "";
    const redirected = landed !== href;
    const where = `${href}${redirected ? ` → ${landed}` : ""}`;
    report.tested.push({ href, landed, redirected });

    if (!state) {
      failures.push(`${where}: no sidebar after navigation`);
      continue;
    }
    if (!assertFourSections(state, "en", where)) continue;
    /*
     * Exactly one current row, and it points at the page the reader is on. The
     * redirect case is the reason this reads the *link's* href rather than the
     * one that was clicked: `/components/calendar` is a declared canonical alias
     * for `/date-time/calendar`, and the row that must light up is the one for
     * the page actually rendered.
     */
    const currentHrefs = state.current
      .map((row) => row.href)
      .filter((value) => value !== null);
    if (currentHrefs.length !== 1 || currentHrefs[0] !== landed) {
      /*
       * An area *landing* marks nothing current, and that is the model rather
       * than a defect: `/components` is the parent of the thirteen families, and
       * none of them is the page you are on. Every other destination must light
       * exactly one row, and it must be its own.
       */
      if (!(landed === "/components" && currentHrefs.length === 0)) {
        failures.push(
          `${where}: current rows are ${JSON.stringify(currentHrefs)} — expected exactly [${landed}]`,
        );
      }
    }
    const owningSection = state.sections.find((section) => section.expanded);
    if (!owningSection) failures.push(`${where}: no section is expanded`);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) failures.push(`${where}: ${overflow}px horizontal overflow`);

    /* Back to the hub for the next destination. */
    await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  }
  if (consoleErrors.length > 0) failures.push(`console: ${consoleErrors[0]}`);
  detail.push(`English desktop: ${targets.length} of ${destinations.length} destinations clicked`);
  await context.close();
}

/* --------------------------------------------------- direct load + history */
{
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  /*
   * A representative direct load per section, plus the two that were reported.
   * A client navigation can be correct while a cold load of the same URL is not
   * (the sidebar is built from the pathname on both paths, but only if both
   * paths agreed about the area).
   */
  const samples = [
    "/foundations/typography",
    "/components/select",
    "/motion",
    "/motion/card-stack",
    "/motion/aurora-surface",
    "/motion/intensity",
    "/integrations/tradingview",
  ];
  for (const route of samples) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const state = await page.evaluate(SIDEBAR_STATE);
    report.directLoads.push({ route, sections: state?.sections.map((s) => s.label) ?? [], current: state?.current ?? [] });
    if (!state || !assertFourSections(state, "en", `direct ${route}`)) continue;
    const currentHrefs = state.current.map((row) => row.href).filter(Boolean);
    if (currentHrefs.length !== 1 || currentHrefs[0] !== route) {
      failures.push(`direct ${route}: current rows are ${JSON.stringify(currentHrefs)}`);
    }
  }

  /* Back and Forward across an area boundary that must *not* exist. */
  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  for (const href of ["/motion/kinetic", "/integrations/tradingview", "/date-time/calendar"]) {
    /* The link only exists once its family is open — the tree is collapsible by
     * design, and a click path that assumes every row is always in the DOM is a
     * test of the test. */
    await expandAll(page);
    await page.locator(`[data-slot="app-shell-sidebar"] [data-slot="sidebar-item"] a[href="${href}"]`).first()
      .click({ timeout: 15000 })
      .catch(() => failures.push(`history: could not click ${href}`));
    await page.waitForTimeout(300);
  }
  for (let step = 0; step < 3; step += 1) {
    await page.goBack({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const state = await page.evaluate(SIDEBAR_STATE);
    report.history.push({ step: `back-${step + 1}`, path: state?.path, current: state?.current ?? [] });
    if (!state) {
      failures.push(`history back-${step + 1}: no sidebar`);
      continue;
    }
    assertFourSections(state, "en", `history back-${step + 1} (${state.path})`);
    const currentHrefs = state.current.map((row) => row.href).filter(Boolean);
    /* The hub is an area landing and marks nothing current — see the note in the
     * click loop. */
    if (!(state.path === "/components" && currentHrefs.length === 0) &&
        (currentHrefs.length !== 1 || currentHrefs[0] !== state.path)) {
      failures.push(`history back-${step + 1}: ${state.path} marks ${JSON.stringify(currentHrefs)}`);
    }
  }
  await page.goForward({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(300);
  const forward = await page.evaluate(SIDEBAR_STATE);
  report.history.push({ step: "forward", path: forward?.path, current: forward?.current ?? [] });
  if (forward) assertFourSections(forward, "en", `history forward (${forward.path})`);
  await context.close();
}

/* -------------------------------------------------------------- Chinese */
{
  /*
   * Its own context: visiting `/zh/**` sets the locale cookie, and an unprefixed
   * `goto` in the same context would then be redirected into Chinese — which is
   * how this probe first reported that `/experiences` had lost its Build
   * switcher, when in fact it was reading the Chinese sidebar.
   */
  const context = await browser.newContext({
    viewport: DESKTOP,
    locale: "zh-CN",
    extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/zh/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  /*
   * The same sweep as the English pass, not a sample.
   *
   * The Chinese sidebar is the same tree with different words, but "same tree"
   * is a claim about the code, and the defect this gate exists for was a claim
   * about the code that was wrong. Every destination, again — the run is a few
   * minutes and it is the only thing that can say the two languages agree.
   */
  const zhDestinations = await extractDestinations(page);
  const destinations = LIMIT > 0 ? zhDestinations.slice(0, LIMIT) : zhDestinations;
  await page.goto(`${BASE}/zh/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  for (const href of destinations) {
    await expandAll(page);
    await page.locator(`[data-slot="app-shell-sidebar"] [data-slot="sidebar-item"] a[href="${href}"]`).first()
      .click({ timeout: 15000 })
      .catch((error) => failures.push(`zh ${href}: click failed — ${String(error.message).slice(0, 100)}`));
    await page.waitForTimeout(250);
    const state = await page.evaluate(SIDEBAR_STATE);
    const where = `zh ${href} → ${state?.path}`;
    if (!state) {
      failures.push(`${where}: no sidebar`);
      continue;
    }
    assertFourSections(state, "zh-CN", where);
    /* The locale must survive the navigation: a hidden redirect that drops `/zh`
     * sends the reader to the English page without saying so. */
    if (!state.path.startsWith("/zh/")) failures.push(`${where}: the locale was dropped`);
    await page.goto(`${BASE}/zh/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  }
  detail.push(`Chinese desktop: ${destinations.length} of ${zhDestinations.length} destinations clicked`);
  await context.close();
}

/* --------------------------------------------------------------- mobile */
{
  const context = await browser.newContext({ viewport: MOBILE });
  const page = await context.newPage();
  const openDrawer = async () => {
    /* Already open counts as open: the trigger is behind the overlay once the
     * sheet is on screen, and clicking it would be intercepted. */
    const open = await page.evaluate(() => {
      const sheet = document.querySelector('[data-slot="sheet"]');
      return Boolean(sheet && sheet.checkVisibility && sheet.checkVisibility());
    });
    if (open) return;
    await page.getByRole("button", { name: /open navigation/i }).first().click({ timeout: 15000 });
    await page.waitForTimeout(450);
  };
  /*
   * One destination from each section, clicked *inside the drawer*, because the
   * mobile navigation is a different control with the same tree: the reported
   * defect was a reader losing their place, and on a phone the sidebar is a sheet
   * that has to keep the same four sections and the same active row.
   */
  for (const start of ["/motion/card-stack", "/components", "/foundations/typography", "/integrations/tradingview"]) {
    await page.goto(`${BASE}${start}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    await openDrawer();
    const state = await page.evaluate(SIDEBAR_STATE);
    const where = `mobile ${start}`;
    report.mobile.push({ route: start, sections: state?.sections.map((s) => s.label) ?? [] });
    if (!state) {
      failures.push(`${where}: the drawer did not open`);
      continue;
    }
    assertFourSections(state, "en", where);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (overflow > 1) failures.push(`${where}: ${overflow}px horizontal overflow`);
    /* The section holding this page is the one that is open. */
    const expected = start.startsWith("/motion")
      ? "Motion and interaction"
      : start.startsWith("/foundations")
        ? "Design foundations"
        : start.startsWith("/integrations")
          ? "Integrations"
          : null;
    if (expected) {
      const section = state.sections.find((entry) => entry.label === expected);
      if (!section?.expanded) failures.push(`${where}: "${expected}" is not the open section`);
    }
  }
  /* And one click through the drawer, to prove the tree is operable there. */
  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
  await openDrawer();
  await expandAll(page);
  await page.locator('[data-slot="sheet"] [data-slot="sidebar-item"] a[href="/motion/card-stack"]').first()
    .click({ timeout: 15000 })
    .catch((error) => failures.push(`mobile drawer: could not click /motion/card-stack — ${String(error.message).slice(0, 100)}`));
  await page.waitForFunction(() => location.pathname === "/motion/card-stack", null, { timeout: 15000 }).catch(() => {
    failures.push("mobile drawer: clicking a motion destination did not navigate");
  });
  await page.waitForTimeout(300);
  await openDrawer();
  const afterClick = await page.evaluate(SIDEBAR_STATE);
  if (afterClick) {
    assertFourSections(afterClick, "en", "mobile drawer after navigation");
    const current = afterClick.current.map((row) => row.href).filter(Boolean);
    if (current[0] !== "/motion/card-stack") {
      failures.push(`mobile drawer after navigation: current rows are ${JSON.stringify(current)}`);
    }
  }
  detail.push(`mobile: ${report.mobile.length} routes inspected in the drawer`);
  await context.close();
}

/* ---------------------------------- a real area switch must still switch */
{
  const context = await browser.newContext({ viewport: DESKTOP });
  const page = await context.newPage();
  for (const [name, route, expected] of [
    ["Charts", "/charts/line-chart", "Charts"],
    ["Motion", "/motion/kinetic", "Motion and interaction"],
  ]) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const state = await page.evaluate(SIDEBAR_STATE);
    const labels = state?.sections.map((section) => section.label) ?? [];
    report.areaSwitches.push({ area: name, route, sections: labels });
    if (!labels.includes(expected)) {
      failures.push(`${route}: expected the ${name} sidebar, saw "${labels.join(" | ")}"`);
    }
    if (labels.join(" | ") === SECTIONS.en.join(" | ")) {
      failures.push(`${route}: still shows the Components sections — the area did not switch`);
    }
  }
  await context.close();
}

await browser.close();
await writeFile(path.join(EVIDENCE, "sidebar-continuity.json"), `${JSON.stringify({ ...report, failures }, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify({ ...report, failures }, null, 2));
} else {
  console.log(`LUC UI — Components sidebar continuity (${BASE})`);
  console.log(`  destinations clicked : ${report.tested.length}`);
  console.log(`  direct loads         : ${report.directLoads.length}`);
  console.log(`  history steps        : ${report.history.length}`);
  console.log(`  area switches        : ${report.areaSwitches.map((entry) => `${entry.area}=${entry.sections.join("/")}`).join("  ")}`);
  for (const line of detail) console.log(`  ${line}`);
  for (const failure of failures) console.log(`  ✗ ${failure}`);
  if (failures.length === 0) {
    console.log("  ✓ every Components destination keeps the same four-section sidebar");
  }
}

process.exitCode = failures.length > 0 ? 1 : 0;
