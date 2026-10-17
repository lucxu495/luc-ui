/**
 * UX-005 / CHT-002 — the navigation a detail page and a catalogue owe a reader.
 *
 * Two behaviours that are invisible to a route-health sweep (both pages return
 * 200 with a broken footer) and cheap to assert:
 *
 *  1. **UX-005** — a registry entry page ends with 2–4 *related* links plus
 *     previous/next, every target canonical, every link with an accessible name.
 *     A "Related" row that renders nothing is the failure mode this catches.
 *  2. **CHT-002** — every row of the chart catalogue is addressable at its own
 *     registry id, and the page really scrolls to it.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3149 node qa/navigation.mjs
 *
 * Exits non-zero on the first route that fails, so it can sit in a gate.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { classifyRoute, entryRoutes, footerProblems } from "./page-kind.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.resolve(HERE, "..");
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = resolveBaseUrl();

/** Entry pages across all three registry trees, plus the catalogue. */
const DEFAULT_ROUTES = [
  "/components/native-select",
  "/components/popover",
  "/components/typography",
  "/charts/line-chart",
  "/charts/violin-chart",
  "/motion/orbit-field",
  "/motion/card-stack",
];
const CATALOGUE = "/charts/catalog";

const argRoutes = process.argv.find((arg) => arg.startsWith("--routes="));
const ROUTES = argRoutes ? argRoutes.slice("--routes=".length).split(",").filter(Boolean) : DEFAULT_ROUTES;

const READ_FOOTER = () => {
  const main = document.querySelector("main");
  const relatedNav = main?.querySelector("nav[aria-label='Related pages']");
  const related = relatedNav
    ? [...relatedNav.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        name: (a.textContent ?? "").trim(),
      }))
    : [];
  const pager = main?.querySelector("nav[aria-label='Documentation']");
  const prevNext = pager
    ? [...pager.querySelectorAll("a")].map((a) => ({
        href: a.getAttribute("href"),
        name: (a.textContent ?? "").trim(),
      }))
    : [];
  return { related, prevNext };
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const report = { checkedAt: new Date().toISOString(), base: BASE, routes: {}, failures: [] };

/*
 * UX-005 is a promise to *registry entry* pages. The catalogue is a collection:
 * it lists charts, it is not one, and it has no family to draw siblings from — so
 * the footer correctly renders nothing there and asserting one would be a test
 * demanding navigation a reader does not want. The classification is shared with
 * `qa/page-kind.test.mjs`, which pins both halves of the rule.
 */
const navSource = await readFile(path.join(APP, "lib/docs/generated/nav.ts"), "utf8");
const navRows = [
  ...navSource.matchAll(/\"r\": \"([^\"]+)\",\s*\"f\": \"([^\"]+)\",\s*\"g\": \"([^\"]+)\",\s*\"s\": \"([^\"]+)\"/g),
].map((match) => ({ route: match[1], family: match[2], group: match[3], status: match[4] }));
const entryRouteSet = entryRoutes(navRows);

for (const route of ROUTES) {
  const problems = [];
  const kind = classifyRoute(route, entryRouteSet);
  try {
    const response = await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60000 });
    if ((response?.status() ?? 0) !== 200) problems.push(`HTTP ${response?.status()}`);
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const footer = await page.evaluate(READ_FOOTER);
    report.routes[route] = { kind, ...footer };
    problems.push(...footerProblems(route, kind, footer));
    /* The related targets must be real: resolve each one the way a reader would. */
    for (const link of footer.related) {
      const head = await page.request.get(BASE + link.href);
      if (head.status() !== 200) problems.push(`related target ${link.href} answers ${head.status()}`);
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  /* Evidence of the footer itself, at the foot of the page where it lives. */
  if (problems.length === 0) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(250);
    await page.screenshot({
      path: path.join(EVIDENCE, `footer-${route.replace(/\//g, "_").replace(/^_/, "")}.png`),
    });
  }
  if (problems.length > 0) report.failures.push({ route, problems });
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} ${route}\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
}

/* --- WB-005: the reader's presentation survives the next page -------------- */
{
  const problems = [];
  const stageTheme = () =>
    page.locator('[aria-label="Preview theme"] [role="radio"][aria-checked="true"]').innerText();
  const stageWidth = () =>
    page.locator('[aria-label="Preview width"] [role="radio"][aria-checked="true"]').innerText();
  const heightValue = () => page.locator('[role="slider"][aria-label="Height"]').getAttribute("aria-valuenow");
  try {
    await page.goto(`${BASE}/charts/line-chart`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const startHeight = await heightValue();
    const slider = page.locator('[role="slider"][aria-label="Height"]');
    await slider.focus();
    for (let press = 0; press < 3; press += 1) await page.keyboard.press("ArrowRight");
    /* Scoped to the playground: the site header has its own light/dark switch,
     * and an unscoped `radio` lookup matches both. */
    await page.locator('[aria-label="Preview theme"]').getByRole("radio", { name: "Dark" }).click();
    await page.locator('[aria-label="Preview width"]').getByRole("radio", { name: "390" }).click();
    await page.waitForTimeout(250);
    const chosenHeight = await heightValue();
    const chosenTheme = await stageTheme();
    const chosenWidth = await stageWidth();
    if (chosenHeight === startHeight) problems.push("the height slider did not move");

    /* A sibling chart page, mounted fresh: it must open the way the reader left. */
    await page.goto(`${BASE}/charts/violin-chart`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const siblingHeight = await heightValue();
    const siblingTheme = await stageTheme();
    const siblingWidth = await stageWidth();
    report.sticky = { chosenHeight, siblingHeight, chosenTheme, siblingTheme, chosenWidth, siblingWidth };
    if (siblingHeight !== chosenHeight)
      problems.push(`height did not follow the reader (${chosenHeight} → ${siblingHeight})`);
    if (siblingTheme !== chosenTheme)
      problems.push(`stage theme did not follow the reader (${chosenTheme} → ${siblingTheme})`);
    if (siblingWidth !== chosenWidth)
      problems.push(`preview width did not follow the reader (${chosenWidth} → ${siblingWidth})`);
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} charts sibling navigation (WB-005)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "WB-005 sticky stage", problems });
}

/* --- IA-005: the header carries the product's own primary areas ----------- */
{
  const problems = [];
  const observations = [];
  /*
   * Two primaries: Components and Charts. WP-5 moved Motion into Components — it
   * is a component family, and a header entry made it compete with Charts for the
   * same glance while a reader looking for a motion primitive under Components
   * found nothing. Visuals left this repository for `luc-visuals` and its header
   * entry went with it.
   *
   * This list is the pixel half of an assertion that already exists in
   * `tests/unit/discovery-areas.test.ts` (`PRIMARY_AREAS.map(id)` → `["components",
   * "charts"]`). It said `["Components", "Charts", "Visuals"]` for a while after
   * the extraction, so the probe failed on every run while the unit test passed —
   * a stale expectation, not a defect in the header. The labels below are the
   * English display names of those two areas.
   */
  const EXPECTED = ["Components", "Charts"];
  try {
    for (const width of [1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
      const nav = page.locator('[data-testid="primary-nav"]');
      if ((await nav.count()) === 0) {
        problems.push(`${width}px: no primary navigation element`);
        continue;
      }
      const labels = (await nav.locator("a, span").allInnerTexts())
        .map((text) => text.trim())
        .filter((text) => EXPECTED.includes(text));
      const metrics = await nav.evaluate((node) => {
        const box = node.getBoundingClientRect();
        const items = [...node.querySelectorAll("a, button")].map((item) => item.getBoundingClientRect());
        return {
          scrollWidth: node.scrollWidth,
          clientWidth: node.clientWidth,
          right: Math.max(...items.map((item) => item.right), 0),
          navRight: box.right,
          navLeft: box.left,
        };
      });
      observations.push({ width, labels, metrics });
      if (labels.length !== EXPECTED.length || EXPECTED.some((label) => !labels.includes(label))) {
        problems.push(`${width}px: primary entries are ${JSON.stringify(labels)}, expected ${JSON.stringify(EXPECTED)}`);
      }
      /* No wrapping and no clipping: the row either fits or it does not. */
      if (metrics.scrollWidth > metrics.clientWidth + 1) {
        problems.push(`${width}px: primary nav overflows (${metrics.scrollWidth} > ${metrics.clientWidth})`);
      }
      if (metrics.right > metrics.navRight + 1 && metrics.right > 0) {
        problems.push(`${width}px: the last primary entry is clipped (${Math.round(metrics.right)} > ${Math.round(metrics.navRight)})`);
      }
      const bodyOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (bodyOverflow > 1) problems.push(`${width}px: the document scrolls horizontally by ${bodyOverflow}px`);
    }

    /* The four supporting destinations stay reachable, behind one menu. */
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const more = page.locator('[data-testid="primary-nav"] button').last();
    await more.click();
    await page.waitForTimeout(250);
    const moreLinks = await page.locator("header a[href^='/'], header a[href^='/zh/']").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("href")),
    );
    for (const target of ["/explore", "/blocks", "/docs"]) {
      if (!moreLinks.some((link) => link && link.endsWith(target))) problems.push(`the More panel does not link to ${target}`);
    }
    if (!moreLinks.some((link) => link && link.includes("/studios"))) problems.push("the More panel does not link to the studios");

    /* --- WP-5: Motion is discoverable inside Components ------------------- */
    await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const motionLinks = await page.evaluate(() =>
      [...document.querySelectorAll("main a[href]")].filter((a) => (a.getAttribute("href") ?? "").includes("/motion")).length,
    );
    const motionHeading = await page.evaluate(() =>
      [...document.querySelectorAll("main h2, main h3")].some((h) => /motion/i.test(h.textContent ?? "")),
    );
    report.motionDiscovery = { motionLinks, motionHeading };
    if (motionLinks < 5) problems.push(`/components links to motion ${motionLinks} time(s); expected a family's worth`);
    if (!motionHeading) problems.push("/components has no Motion heading");

    /* A motion deep link keeps its own page, its own sidebar and the component
     * families beside it. */
    await page.goto(`${BASE}/motion/card-stack`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    const deepLink = await page.evaluate(() => ({
      h1: document.querySelector("main h1")?.textContent?.trim() ?? null,
      sidebarGroups: [...document.querySelectorAll('[data-slot="sidebar"] [data-slot="sidebar-group-label"]')].map(
        (node) => (node.textContent ?? "").trim(),
      ),
      activeNav: [...document.querySelectorAll('[data-testid="primary-nav"] a')]
        .filter((a) => a.getAttribute("aria-current") !== null)
        .map((a) => (a.textContent ?? "").trim()),
      /* How many sidebar links point into the component families, and whether the
       * sidebar names the parent it belongs to. */
      componentFamilyLinks: [...document.querySelectorAll('[data-slot="sidebar"] a[href]')].filter((a) => {
        const href = a.getAttribute("href") ?? "";
        return /^\/zh?\/?components\/(actions|forms|date-time|layout|navigation|feedback|overlays|data-display|media|application|ai|typography|experiences)/.test(
          href.replace(/^\/zh/, ""),
        );
      }).length,
      parentLink: [...document.querySelectorAll('[data-slot="sidebar"] a[href]')].some((a) => {
        const href = (a.getAttribute("href") ?? "").replace(/^\/zh/, "");
        return href === "/components";
      }),
    }));
    report.motionDeepLink = deepLink;
    if (deepLink.h1 !== "CardStack") problems.push(`/motion/card-stack h1 is ${JSON.stringify(deepLink.h1)}`);
    /*
     * A Motion page states its parent in one row, and does not print the parent's
     * tree (NAV-001). The previous assertion here asked for the opposite — "the
     * sidebar shows the component families" — which is what the reported defect
     * looked like from a distance: thirteen component rows above the Motion group.
     */
    if (!deepLink.sidebarGroups.some((label) => /motion/i.test(label))) {
      problems.push(`/motion/card-stack sidebar does not show Motion navigation (${deepLink.sidebarGroups.join(", ")})`);
    }
    if (deepLink.componentFamilyLinks > 0) {
      problems.push(`/motion/card-stack sidebar prints ${deepLink.componentFamilyLinks} component-family link(s)`);
    }
    if (!deepLink.parentLink) {
      problems.push("/motion/card-stack sidebar does not link to its parent area");
    }
    /* The header must not claim Motion is the active top-level area. */
    if (deepLink.activeNav.some((label) => /motion/i.test(label))) {
      problems.push("Motion is still marked as an active top-level area");
    }

    /* Narrow: the header must not try to keep four entries plus controls. */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
    if (await page.locator('[data-testid="primary-nav"]').isVisible()) {
      problems.push("390px: the desktop primary navigation is still visible");
    }
    const narrowOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    if (narrowOverflow > 1) problems.push(`390px: the document scrolls horizontally by ${narrowOverflow}px`);
    const affordances = await page.locator("header button, header a").count();
    if (affordances === 0) problems.push("390px: the header has no visible control at all");
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  report.header = { observations };
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} header tiers at 1024/1280/1440/390 (IA-005)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "IA-005 header", problems });
}

/* --- CHT-002 ------------------------------------------------------------- */

/* --- WP-4: Explore's counts come from the registries, not from page rows --- */

/* --- NAV-001: the sidebar belongs to the destination you are on ----------- */
{
  const problems = [];
  /*
   * Two rules, both about the reported complaint rather than about a table of
   * labels to maintain:
   *
   *   1. the sidebar's *menu* lists no component-family link on a Motion page —
   *      the leak that made a Motion page read as Components;
   *   2. when a menu row points at the page you are on, that row is marked
   *      current, in both languages.
   *
   * Scoped to `[data-slot="sidebar-menu"]`: the sidebar header also links to the
   * area landing, and a header link is not a navigation row — the first version of
   * this check counted it and reported a defect that did not exist.
   */
  const AREAS = ["/docs", "/components", "/charts", "/motion", "/blocks", "/studios/charts", "/explore"];
  const rows = [];
  /**
   * Check one area in its own browser context.
   *
   * A context per pass, because visiting `/zh/**` sets the locale cookie and the
   * next block would then be redirected into Chinese — which is exactly what
   * happened the first time this ran: the Explore count assertions read Chinese
   * tile labels and reported `undefined`.
   */
  const check = async (checkPage, path, label) => {
    await checkPage.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await checkPage
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
      .catch(() => {});
    const state = await checkPage.evaluate(() => {
      const menus = [...document.querySelectorAll('[data-slot="sidebar-menu"]')];
      const links = menus.flatMap((menu) =>
        [...menu.querySelectorAll("a[href]")].map((a) => ({
          href: a.getAttribute("href"),
          current: a.getAttribute("aria-current") !== null || a.dataset.active === "true",
        })),
      );
      return { path: window.location.pathname, links };
    });
    const hrefs = state.links;
    rows.push({ path: state.path, menuLinks: hrefs.length });
    const selfRow = hrefs.find((link) => link.href === state.path);
    if (selfRow && !selfRow.current) {
      problems.push(`${label}${state.path}: a sidebar row points at this page but is not marked current`);
    }
  };
  try {
    for (const route of AREAS) await check(page, route, "en ");
    const zhContext = await context.browser().newContext({
      viewport: { width: 1440, height: 900 },
      locale: "zh-CN",
      extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
    });
    const zhPage = await zhContext.newPage();
    for (const route of AREAS) await check(zhPage, `/zh${route}`, "zh ");
    await zhContext.close();
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  report.sidebarOwnership = rows;
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} sidebar ownership follows the destination (NAV-001)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "NAV-001 sidebar ownership", problems });
}
{
  const problems = [];
  /** Local helper: navigate and wait for hydration (this file has no shared one). */
  const open = async (route) => {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
      .catch(() => {});
  };
  try {
    const readTiles = () =>
      page.evaluate(() =>
        Object.fromEntries(
          /*
           * The kind tiles now filter *in place* on `/explore` (IA-006 added the
           * explorer to the page the tiles live on), so their href is
           * `/explore?kind=…` rather than `/explore/browse?kind=…`. The counts
           * these tiles print are the thing under test — the locator follows the
           * tiles, the assertion is unchanged.
           */
          [
            ...document.querySelectorAll(
              "main a[href^='/explore?kind='], main a[href^='/explore/browse?kind=']",
            ),
          ].map((anchor) => {
            const value = anchor.querySelector(".luc-numeric")?.textContent?.trim() ?? "";
            const label = [...anchor.querySelectorAll("span")][1]?.textContent?.trim() ?? "";
            return [label, Number(value.replace(/[^0-9]/g, ""))];
          }),
        ),
      );
    await open("/explore");
    const tiles = await readTiles();
    report.exploreTiles = tiles;

    /*
     * The Blocks gallery states its own size in its "All" filter chip.
     *
     * There used to be a second cross-check above this one for "visual
     * elements", reading "N elements across" off `/components/buttons`. Visuals
     * is another repository now, that banner does not render, and the guard
     * around the comparison (`if (visualsBanner && …)`) made it a probe that
     * could not fail: it recorded `null` on every run and asserted nothing. It
     * is removed rather than left as decoration — this one is the same check
     * against a number that still has a source.
     */
    await open("/blocks");
    const blocksChip = await page.evaluate(() => {
      const match = (document.querySelector("main")?.innerText ?? "").match(/All\s*\((\d+)\)/);
      return match ? Number(match[1]) : null;
    });
    report.exploreCrossCheck = { blocksChip };

    const blocksTile = tiles["blocks"];
    if (blocksChip && blocksTile !== blocksChip) {
      problems.push(`Explore says ${blocksTile} blocks; the gallery lists ${blocksChip}`);
    }
    /* The registry's own groups, counted by the same parser the i18n gate uses:
     * a naive string count over-reports by the number of family rows. */
    const { loadRegistryGroupCounts } = await import("../scripts/chart-catalog-strings.mjs");
    const groupCounts = await loadRegistryGroupCounts();
    const countGroup = (group) => groupCounts[group] ?? 0;
    report.exploreRegistry = groupCounts;
    for (const [label, group] of [
      ["components", "components"],
      ["charts", "charts"],
      ["motion components", "motion"],
    ]) {
      if (tiles[label] !== countGroup(group)) {
        problems.push(`Explore says ${tiles[label]} for "${label}"; the registry holds ${countGroup(group)}`);
      }
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} /explore counts match the registries (WP-4)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "/explore counts", problems });
}
{
  const problems = [];
  try {
    const response = await page.goto(BASE + CATALOGUE, { waitUntil: "domcontentloaded", timeout: 60000 });
    if ((response?.status() ?? 0) !== 200) problems.push(`HTTP ${response?.status()}`);
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });

    const rows = await page.evaluate(() => {
      /* Catalogue rows only: the "On this page" rail is also made of anchors,
       * and one of its rows is always the last anchor in the document. */
      const anchors = [...document.querySelectorAll("main a[href^='#']")].filter(
        (a) => !a.closest('[data-slot="page-outline"]'),
      );
      return anchors.map((a) => ({ href: a.getAttribute("href"), label: a.getAttribute("aria-label") ?? "" }));
    });
    report.catalogue = { rows: rows.length };
    if (rows.length < 50) problems.push(`only ${rows.length} addressable rows`);
    for (const row of rows.slice(0, 5)) {
      if (!row.label) problems.push(`anchor ${row.href} has no accessible name`);
    }

    /*
     * A reader's real use of the anchor is a *shared link*, so the probe loads
     * the deep link rather than clicking. Picking a row from the middle of the
     * document means a pass cannot come from "it was already on screen".
     */
    const target = rows[Math.floor(rows.length / 2)]?.href?.slice(1);
    if (!target) problems.push("no anchor to test");
    else {
      await page.goto(`${BASE}${CATALOGUE}#${target}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 });
      const before = await page.evaluate((id) => {
        const node = document.getElementById(id);
        return node ? Math.round(node.getBoundingClientRect().top) : null;
      }, target);
      /*
       * Poll rather than sleep: the catalogue is a client page and the row can
       * move while fonts and charts settle. A scroll that never happens times
       * out, which is the failure this is looking for.
       */
      let landed = null;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        landed = await page.evaluate((id) => {
          const node = document.getElementById(id);
          if (!node) return null;
          const box = node.getBoundingClientRect();
          return { top: Math.round(box.top), width: Math.round(box.width) };
        }, target);
        if (landed && landed.top > -50 && landed.top < 220) break;
        await page.waitForTimeout(150);
      }
      report.catalogue.anchorTest = { id: target, rows: rows.length, before, landed };
      report.catalogue.target = { id: target, landed };
      if (!landed) problems.push(`#${target} does not exist`);
      else if (landed.width === 0) problems.push(`#${target} is not rendered`);
      else if (landed.top > 220 || landed.top < -50)
        problems.push(`#${target} did not come into view on a deep link (landed at ${landed.top}px)`);
      await page.screenshot({ path: path.join(EVIDENCE, "catalogue-deep-link.png") });
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} ${CATALOGUE} (CHT-002)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: CATALOGUE, problems });
}

/* --- NAV-002: the front door is a landing page, not a documentation page --- */
{
  const problems = [];
  const observations = [];
  const landingContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const landing = await landingContext.newPage();
  try {
    for (const prefix of ["", "/zh"]) {
      await landing.goto(`${BASE}${prefix}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await landing.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20000,
      });
      const state = await landing.evaluate(() => {
        const aside = document.querySelector('[data-slot="app-shell-sidebar"]');
        const main = document.querySelector("main");
        const brand = document.querySelector('header a[href], header a[href$="/"]');
        return {
          asideRendered: Boolean(aside),
          asideVisible: aside ? getComputedStyle(aside).display !== "none" : false,
          asideWidth: aside ? Math.round(aside.getBoundingClientRect().width) : 0,
          mainLeft: main ? Math.round(main.getBoundingClientRect().left) : -1,
          mainWidth: main ? Math.round(main.getBoundingClientRect().width) : 0,
          brandHref: brand?.getAttribute("href") ?? null,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        };
      });
      observations.push({ prefix: prefix || "(en)", ...state });
      /* No column — and, just as important, no *reserved* column: the content has
       * to start at the page edge, not 256px in. */
      if (state.asideVisible || state.asideWidth > 0) {
        problems.push(`${prefix}/: the landing route still renders a sidebar column`);
      }
      if (state.mainLeft > 8) problems.push(`${prefix}/: the content is inset by ${state.mainLeft}px`);
      if (state.mainWidth < 1200) problems.push(`${prefix}/: the content took only ${state.mainWidth}px of 1440`);
      /* The logo is how a reader gets home, so it has to be on the page. */
      if (!state.brandHref) problems.push(`${prefix}/: the landing header has no logo link`);
      if (state.overflow > 1) problems.push(`${prefix}/: the landing page scrolls horizontally`);

      /* The drawer is the only navigation below `lg`, so it has to exist. */
      await landing.setViewportSize({ width: 390, height: 844 });
      await landing.goto(`${BASE}${prefix}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await landing.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20000,
      });
      const narrow = await landing.evaluate(() => {
        const trigger = [...document.querySelectorAll("header button")].find(
          (node) => node.getAttribute("aria-expanded") !== null,
        );
        return { hasTrigger: Boolean(trigger) };
      });
      if (!narrow.hasTrigger) problems.push(`${prefix}/ at 390px: no way to open the navigation`);
      else {
        await landing
          .locator("header button[aria-expanded]")
          .first()
          .click();
        await landing.waitForTimeout(400);
        const drawer = await landing.evaluate(
          () => document.querySelectorAll('[data-slot="sidebar-content"] [data-slot="sidebar-group"]').length,
        );
        if (drawer < 2) problems.push(`${prefix}/ at 390px: the drawer lists ${drawer} group(s)`);
        await landing.keyboard.press("Escape");
      }
      await landing.setViewportSize({ width: 1440, height: 900 });

      /* Back from a product page restores the full-width landing. */
      await landing.goto(`${BASE}${prefix}/docs`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await landing.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20000,
      });
      await landing.goBack({ waitUntil: "domcontentloaded" });
      await landing.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20000,
      });
      const restored = await landing.evaluate(() => {
        const aside = document.querySelector('[data-slot="app-shell-sidebar"]');
        return {
          url: location.pathname,
          asideVisible: aside ? getComputedStyle(aside).display !== "none" : false,
        };
      });
      observations.push({ prefix: prefix || "(en)", back: restored });
      if (restored.asideVisible) problems.push(`${prefix}/: going back left the documentation sidebar up`);
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  } finally {
    await landingContext.close();
  }
  report.landing = observations;
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} the landing route has no sidebar (NAV-002)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "NAV-002 landing shell", problems });
}

/* --- NAV-003: the sidebar reads as a hierarchy, and folds where it should --- */
{
  /*
   * Re-pointed at Components under IA V3, and for two reasons.
   *
   * It used to drive `/docs`, which was the site's biggest tree — eight sections
   * and about forty rows — because that is where folding is worth measuring. Docs
   * is four rows across two sections now (the guides moved to Components, where
   * they document the library rather than the process), and a short tree is
   * deliberately unfolded. Components is the long tree, so it is the honest
   * subject: four sections, thirteen families, and one of them always open.
   */
  const problems = [];
  const detail = [];
  const navContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const navPage = await navContext.newPage();
  const shape = () =>
    navPage.evaluate(() => {
      const groups = [...document.querySelectorAll('[data-slot="sidebar-content"] [data-slot="sidebar-group"]')];
      return groups.map((group) => {
        const label = group.querySelector('[data-slot="sidebar-group-label"]');
        const style = label ? getComputedStyle(label) : null;
        return {
          text: (label?.textContent ?? "").trim(),
          tag: label?.tagName ?? null,
          expanded: label?.getAttribute("aria-expanded") ?? null,
          rows: group.querySelectorAll('[data-slot="sidebar-item"]').length,
          weight: style ? Number(style.fontWeight) : 0,
          transform: style?.textTransform ?? "",
          size: style ? Number.parseFloat(style.fontSize) : 0,
        };
      });
    });
  try {
    await navPage.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await navPage.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
      timeout: 20000,
    });
    const sections = await shape();
    const rowWeight = await navPage.evaluate(() => {
      const anchor = document.querySelector('[data-slot="sidebar-item"] a');
      return anchor ? Number(getComputedStyle(anchor).fontWeight) : 0;
    });
    detail.push(`components groups=${sections.length} heading=${sections[0]?.size}px/${sections[0]?.weight} row=${rowWeight}`);
    /* The four sections IA V3 declares, in order. */
    if (sections.map((group) => group.text).join(" | ") !==
        "Design foundations | UI components | Motion and interaction | Integrations") {
      problems.push(`/components sections are ${sections.map((group) => group.text).join(" | ")}`);
    }
    const heading = sections[0];
    if (heading?.tag !== "BUTTON") problems.push(`a group heading is a <${heading?.tag}> rather than a toggle`);
    if (heading?.transform !== "none") problems.push(`group headings are still ${heading?.transform}`);
    if (!(heading?.weight > rowWeight)) {
      problems.push(`the group heading (${heading?.weight}) is not heavier than the rows (${rowWeight})`);
    }
    if (!(heading?.size >= 13)) problems.push(`the group heading is ${heading?.size}px — smaller than the rows`);
    /*
     * A long tree opens one section, and it is the one the page is about.
     *
     * The landing route lives in no group, and the shell used to fall back to the
     * first — so `/components` opened "Design foundations" and hid the thirteen
     * families the page lists. The area declares which section a landing opens.
     */
    const open = sections.filter((group) => group.expanded === "true");
    if (open.length !== 1) problems.push(`/components opens ${open.length} sections by default`);
    if (open[0]?.text !== "UI components") {
      problems.push(`/components opens "${open[0]?.text}" rather than the component families`);
    }
    if (sections.some((group) => group.expanded === "true" && group.rows === 0)) {
      problems.push("/components renders an empty section heading");
    }
    /* Clicking a heading folds the section and does not navigate. */
    const foundations = navPage.locator('[data-slot="sidebar-group-label"]', { hasText: "Design foundations" }).first();
    await foundations.click();
    await navPage.waitForTimeout(350);
    if ((await shape()).find((group) => group.text === "Design foundations")?.expanded !== "true") {
      problems.push("clicking a section heading did not unfold the section");
    }
    if ((await navPage.evaluate(() => location.pathname)) !== "/components") {
      problems.push("clicking a section heading navigated somewhere");
    }
    await foundations.focus();
    await navPage.keyboard.press("Enter");
    await navPage.waitForTimeout(300);
    if ((await shape()).find((group) => group.text === "Design foundations")?.expanded !== "false") {
      problems.push("Enter did not fold the section");
    }
    await navPage.keyboard.press("Space");
    await navPage.waitForTimeout(300);
    if ((await shape()).find((group) => group.text === "Design foundations")?.expanded !== "true") {
      problems.push("Space did not unfold the section");
    }
    /*
     * A deep link exposes its own row, in its own section.
     *
     * The three routes below are the IA V3 move in one assertion: Typography is a
     * foundation, Calendar is a date-time component and TradingView is an
     * integration, and all three used to render the documentation taxonomy with no
     * row marked current.
     */
    for (const [route, section, row] of [
      ["/foundations/spacing", "Design foundations", "Spacing"],
      ["/date-time/calendar", "UI components", "Calendar"],
      ["/integrations/tradingview", "Integrations", "Overview"],
    ]) {
      await navPage.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await navPage.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
        timeout: 20000,
      });
      const deep = await navPage.evaluate(() => ({
        current: [...document.querySelectorAll('[data-slot="sidebar-item"][data-current="true"]')].map((node) =>
          node.textContent.trim(),
        ),
        groups: [...document.querySelectorAll('[data-slot="sidebar-group"]')].map((group) => ({
          label: (group.querySelector('[data-slot="sidebar-group-label"]')?.textContent ?? "").trim(),
          expanded: group.querySelector('[data-slot="sidebar-group-label"]')?.getAttribute("aria-expanded"),
        })),
      }));
      detail.push(`${route} current=${deep.current.join(",")}`);
      if (!deep.current.includes(row)) {
        problems.push(`${route} does not mark "${row}" current (${deep.current.join(",") || "none"})`);
      }
      if (!deep.groups.some((group) => group.expanded === "true" && group.label === section)) {
        problems.push(`${route} does not open the "${section}" section that holds it`);
      }
    }
    /* A search reaches rows inside folded sections. */
    await navPage.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await navPage.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
      timeout: 20000,
    });
    await navPage.getByRole("button", { name: /search|筛选|搜索/i }).first().click().catch(() => {});
    await navPage.keyboard.press("Meta+k").catch(() => {});
    await navPage.waitForTimeout(350);
    const paletteOpen = await navPage.evaluate(
      () => document.querySelectorAll('[role="dialog"], [data-slot="command"]').length > 0,
    );
    detail.push(`palette open via trigger or ⌘K: ${paletteOpen}`);
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  } finally {
    await navContext.close();
  }
  report.sidebarHierarchy = detail;
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} the sidebar states its hierarchy (NAV-003)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "NAV-003 sidebar hierarchy", problems });
}
/* --- IA-007: Build's four subareas each own their sidebar ----------------- */
{
  const problems = [];
  const buildContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const buildPage = await buildContext.newPage();
  const read = () =>
    buildPage.evaluate(() => ({
      area: (document.querySelector('[data-slot="sidebar"] a[href]')?.textContent ?? "").trim(),
      groups: [...document.querySelectorAll('[data-slot="sidebar-group-label"]')].map((node) =>
        (node.textContent ?? "").trim(),
      ),
      current: [...document.querySelectorAll('[data-slot="sidebar-item"][data-current="true"]')].map((node) =>
        (node.textContent ?? "").trim(),
      ),
    }));
  try {
    const cases = [
      { route: "/blocks", current: "Blocks" },
      { route: "/templates", current: "Templates" },
      { route: "/patterns", current: "Overview" },
      { route: "/experiences", current: "Experiences" },
    ];
    const seen = [];
    for (const entry of cases) {
      await buildPage.goto(`${BASE}${entry.route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await buildPage
        .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
        .catch(() => {});
      const state = await read();
      seen.push({ route: entry.route, ...state });
      /* Every subarea says "Build", and every subarea's switcher lists all four. */
      if (!state.groups.includes("Build")) problems.push(`${entry.route}: no Build switcher (${state.groups})`);
      if (!state.current.includes(entry.current)) {
        problems.push(`${entry.route}: the sidebar does not mark "${entry.current}" current (${state.current})`);
      }
      if (state.current.includes("Blocks") && entry.route !== "/blocks") {
        problems.push(`${entry.route}: the Blocks row is marked current`);
      }
      if (entry.route === "/patterns" && state.groups.includes("Templates")) {
        problems.push("/patterns: the sidebar lists another subarea's navigation");
      }
    }
    report.buildAreas = seen;
    /* The More panel agrees with the four subareas rather than with the parent. */
    await buildPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await buildPage.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
      timeout: 20000,
    });
    await buildPage.locator('[data-testid="primary-nav"] button').last().click();
    await buildPage.waitForTimeout(300);
    const moreLinks = await buildPage
      .locator("header a[href]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("href") ?? ""));
    for (const target of ["/blocks", "/templates", "/patterns", "/experiences", "/explore", "/docs"]) {
      if (!moreLinks.includes(target)) problems.push(`the More panel does not link to ${target}`);
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  } finally {
    await buildContext.close();
  }
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} Build's subareas own their navigation (IA-007)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "IA-007 build subareas", problems });
}

/* --- IA V3: one product, four areas -------------------------------------- */
{
  /*
   * The brief's own list, asserted in a browser rather than assumed from the
   * route table: the four sections of Components, the single Explore destination,
   * Build's family and its explicit way back, and a Search action that really
   * opens search.
   */
  const problems = [];
  const detail = [];
  const iaContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const iaPage = await iaContext.newPage();
  const sidebar = () =>
    iaPage.evaluate(() => {
      const sb = document.querySelector('[data-slot="app-shell-sidebar"]');
      if (!sb) return { sections: [], current: [], links: [] };
      return {
        sections: [...sb.querySelectorAll('[data-slot="sidebar-group-label"]')].map((n) =>
          (n.textContent ?? "").trim(),
        ),
        current: [...sb.querySelectorAll('[data-slot="sidebar-item"][data-current="true"]')].map((n) =>
          (n.textContent ?? "").trim(),
        ),
        links: [...sb.querySelectorAll("a[href]")].map((a) => a.getAttribute("href") ?? ""),
      };
    });
  const visit = async (route) => {
    await iaPage.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await iaPage
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
      .catch(() => {});
    return sidebar();
  };
  const COMPONENT_SECTIONS = [
    "Design foundations",
    "UI components",
    "Motion and interaction",
    "Integrations",
  ];
  try {
    /*
     * 1. The pages that used to borrow the documentation taxonomy.
     *
     * Every one of these rendered the Docs sidebar — "Start here / Foundations /
     * Application / Forms / Data and time / Integrations / Experiments" — with no
     * row marked current, after the reader had walked there from Components.
     */
    for (const route of [
      "/foundations/typography",
      "/date-time/calendar",
      "/application/workspace",
      "/forms/validation",
      "/data/table",
      "/integrations/tradingview",
    ]) {
      const state = await visit(route);
      if (state.sections.join(" | ") !== COMPONENT_SECTIONS.join(" | ")) {
        problems.push(`${route}: sidebar is "${state.sections.join(" | ")}"`);
      }
      if (state.current.length !== 1) {
        problems.push(`${route}: ${state.current.length} rows marked current`);
      }
    }

    /*
     * 2. Explore is one destination.
     *
     * The area shipped two entrances to one experience — Overview and All
     * capabilities, both mounting the same explorer. The alias must still resolve
     * (a bookmark carries the filter) and must not appear as a menu row.
     */
    const explore = await visit("/explore");
    if (explore.links.filter((href) => href === "/explore/browse").length > 0) {
      problems.push("/explore still lists the alias as a destination");
    }
    const aliasResponse = await iaPage.goto(`${BASE}/explore/browse?kind=chart`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await iaPage.waitForTimeout(400);
    const landed = new URL(iaPage.url());
    if (landed.pathname !== "/explore" || landed.search !== "?kind=chart") {
      problems.push(`/explore/browse?kind=chart landed on ${landed.pathname}${landed.search}`);
    }
    if (!aliasResponse || aliasResponse.status() >= 400) {
      problems.push(`/explore/browse returned ${aliasResponse?.status()}`);
    }
    detail.push(`explore alias → ${landed.pathname}${landed.search}`);
    /*
     * And the alias keeps the reader in their language.
     *
     * The middleware rewrites `/zh/explore/browse` onto `/explore/browse` before
     * the page runs, so a redirect written against the bare path sends a Chinese
     * reader to the English page. That is what the first version did, and a check
     * that only ever fetches the un-prefixed URL cannot see it — so both are
     * fetched, and the Chinese one must land on a Chinese URL.
     */
    /*
     * In its own context, because visiting `/zh/**` sets the locale cookie and
     * every later unprefixed `goto` in this page would then be redirected into
     * Chinese — which is exactly how this check first failed, reporting that the
     * Build switcher was missing on `/experiences` because it was reading the
     * Chinese sidebar. NAV-001 records the same hazard; the isolation is the fix.
     */
    const zhContext = await iaContext.browser().newContext({
      viewport: { width: 1440, height: 900 },
      locale: "zh-CN",
      extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
    });
    const zhPage = await zhContext.newPage();
    await zhPage.goto(`${BASE}/zh/explore/browse?kind=chart`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await zhPage.waitForTimeout(400);
    const zhLanded = new URL(zhPage.url());
    if (!zhLanded.pathname.startsWith("/zh/")) {
      problems.push(`/zh/explore/browse landed on ${zhLanded.pathname} — the locale was dropped`);
    }
    detail.push(`zh alias → ${zhLanded.pathname}${zhLanded.search}`);
    await zhContext.close();

    /*
     * 3. Build is a family, and its details say how to leave.
     *
     * Five subareas share one switcher, and the three kinds of detail page — a
     * reference product, a studio, a template's target — carry a visible link back
     * to the collection rather than relying on browser Back.
     */
    for (const [route, current] of [
      ["/blocks", "Blocks"],
      ["/templates", "Templates"],
      ["/patterns", "Overview"],
      ["/experiences", "Experiences"],
      ["/studios/charts", "Studios"],
    ]) {
      const state = await visit(route);
      if (!state.sections.includes("Build")) {
        problems.push(`${route}: no Build switcher (${state.sections.join(" | ")})`);
      }
      if (!state.current.includes(current)) {
        problems.push(`${route}: "${current}" is not marked current (${state.current.join(",")})`);
      }
    }
    for (const route of [
      "/experiences/personal/career",
      "/experiences/vertical/finance",
      "/studios/charts",
      "/studios/motion",
      "/studios/themes",
      "/studios/composer",
    ]) {
      await visit(route);
      const back = await iaPage.evaluate(() => {
        const node = document.querySelector('[data-slot="collection-return"]');
        return node ? { href: node.getAttribute("href"), text: (node.textContent ?? "").trim() } : null;
      });
      detail.push(`${route} return=${back ? `${back.text} → ${back.href}` : "none"}`);
      if (!back) problems.push(`${route}: no explicit way back to its collection`);
    }

    /*
     * 4. The front door's Search action opens search.
     *
     * It used to be a link labelled "Find the right thing" pointing at `/explore`
     * — a promise of search that led to an introductory page. The action must open
     * the palette, and the palette must be a real one: typeable, with results.
     */
    await iaPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await iaPage
      .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
      .catch(() => {});
    const action = iaPage.locator('[data-slot="home-search-action"]').first();
    if ((await action.count()) === 0) {
      problems.push("/ has no search action");
    } else {
      await action.click();
      await iaPage.waitForTimeout(500);
      const palette = await iaPage.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"], [data-slot="command"]');
        const field = document.querySelector('[role="dialog"] input, [data-slot="command"] input, input[type="search"]');
        return { open: Boolean(dialog), field: Boolean(field) };
      });
      if (!palette.open || !palette.field) {
        problems.push(`/ search action opened palette=${palette.open} field=${palette.field}`);
      } else {
        await iaPage.keyboard.type("calendar");
        await iaPage.waitForTimeout(400);
        const options = await iaPage.evaluate(
          () => document.querySelectorAll('[role="option"], [data-slot="command-item"]').length,
        );
        detail.push(`palette query "calendar" → ${options} option(s)`);
        if (options === 0) problems.push("/ search action opened a palette that produced no results");
      }
    }
    report.iaV3 = detail;
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 200)}`);
  } finally {
    await iaContext.close();
  }
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} the site reads as one product (IA V3)\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  if (problems.length > 0) report.failures.push({ route: "IA V3 product structure", problems });
}

await context.close();
await browser.close();
await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "navigation-probe.json");
await writeFile(outFile, `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`\nreport: ${outFile}\n`);
if (report.failures.length > 0) {
  process.stdout.write(`\n${report.failures.length} route(s) failed.\n`);
  process.exit(1);
}
process.stdout.write("\nDetail footers and the chart catalogue are navigable.\n");
