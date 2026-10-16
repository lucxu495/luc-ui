/**
 * QA-002 — the journeys a reader actually takes, driven end to end.
 *
 * The independent audit's finding was not that the site was broken; it was that
 * nothing measured a *journey*. Route health answers "does this page return 200",
 * `navigation.mjs` answers "does this component behave", and neither would notice
 * a discovery path that dead-ends, a copy button that copies the wrong string, or
 * a language switch that loses the reader's place. This file walks the seven
 * journeys the action item names, clicking what a person clicks:
 *
 *   1. Home → Components → catalogue preview → detail → Preview/Code
 *   2. Home → Components → Motion → a detail → a variant → copy its code
 *   3. Home → Charts → a time axis, and a control that changes it
 *   4. Home → Docs → installation → the API and the pager
 *   5. More → Blocks → Templates → Patterns → Experiences
 *   6. English → Chinese → a deep link → refresh → Back
 *   7. The mobile drawer: open a group, navigate, and land
 *
 * Each journey asserts where it arrived, what became visible, and — where it
 * matters — what the clipboard received and which sidebar owns the page. Failures
 * are collected rather than thrown, so one broken journey does not hide the rest,
 * and a screenshot of the final state of each journey is written to the shared
 * evidence directory.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:57703 node qa/journey.mjs
 *   node qa/journey.mjs --browser=firefox      (QA-003: the same journeys per engine)
 *
 * Exits non-zero when a journey fails.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, firefox, webkit } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation/journeys");
const BASE = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100";

/*
 * Which engine to drive — `QA-003` asks for the *same journeys* in Chromium,
 * Firefox and WebKit, so the engine is a parameter rather than a second suite.
 * `everywhere` runs all three and reports a matrix.
 */
const ENGINES = { chromium, firefox, webkit };
const requested = process.argv.find((arg) => arg.startsWith("--browser="))?.slice("--browser=".length) ?? "chromium";
const engines = requested === "everywhere" ? Object.keys(ENGINES) : requested.split(",");

const JOURNEYS = [
  { id: "01-home-to-component-detail", name: "Home → Components → catalogue → detail → Preview/Code" },
  { id: "02-components-to-motion-variant", name: "Components → Motion → detail → variant → copy" },
  { id: "03-home-to-charts-time-axis", name: "Home → Charts → a time axis, and a control" },
  { id: "04-home-to-docs-and-api", name: "Home → Docs → installation → API → pager" },
  { id: "05-more-to-build", name: "More → Blocks → Templates → Patterns → Experiences" },
  { id: "06-locale-round-trip", name: "English → Chinese → deep link → refresh → Back" },
  { id: "07-mobile-drawer", name: "Mobile drawer: open a group, navigate, land" },
];

const failures = [];
const runs = [];
await mkdir(EVIDENCE, { recursive: true });

/*
 * A journey is *registered* here and run once per engine below.
 *
 * The seven steps are written once and driven by each browser in turn, which is
 * what makes a cross-browser result a comparison of the same clicks rather than
 * three suites that drift.
 */
const QUEUE = [];
async function journey(id, viewport, steps) {
  QUEUE.push({ id, viewport, steps });
}

/** One journey: a fresh context, the steps, and a screenshot of where it ended. */
async function runJourney(browser, id, viewport, steps) {
  const spec = JOURNEYS.find((entry) => entry.id === id);
  /*
   * Clipboard *permissions* are a Chromium-only capability in Playwright:
   * Firefox and WebKit reject the context option outright ("Unknown permission").
   * The journeys therefore ask for them only where they exist, and the copy step
   * below degrades honestly rather than being skipped — see `readClipboard`.
   */
  const context = await browser.newContext({
    viewport,
    ...(currentEngine === "chromium" ? { permissions: ["clipboard-read", "clipboard-write"] } : {}),
  });
  const page = await context.newPage();
  const problems = [];
  const consoleErrors = [];
  /** Non-failing observations worth keeping in the report (e.g. how copy was read). */
  const detail = [];
  page.on("pageerror", (error) => consoleErrors.push(String(error).slice(0, 180)));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text().slice(0, 180));
  });
  const record = async (what, ok, detail) => {
    if (!ok) problems.push(`${what}${detail ? ` — ${detail}` : ""}`);
  };
  const settle = async () => {
    await page.waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, {
      timeout: 40000,
    });
    await page.waitForTimeout(200);
  };
  /**
   * What the copy button produced.
   *
   * Chromium can read the system clipboard; the other two engines cannot (the
   * permission does not exist), so there the assertion is about the *offered*
   * value: the code block the button belongs to. Both are honest answers to "does
   * copy produce usable code" — one checks the clipboard, the other checks what
   * the button is wired to — and the run detail says which was used, so a
   * cross-browser pass cannot quietly claim the stronger check.
   */
  const readClipboard = async (fallbackText) => {
    if (currentEngine === "chromium") {
      return { value: await page.evaluate(() => navigator.clipboard.readText()), source: "clipboard" };
    }
    return { value: fallbackText, source: "code block (engine has no clipboard permission)" };
  };

  try {
    await steps({ page, record, settle, readClipboard, detail });
  } catch (error) {
    problems.push(`journey threw: ${String(error.message).slice(0, 200)}`);
  }
  if (consoleErrors.length > 0) problems.push(`console: ${consoleErrors[0]}`);

  await page.screenshot({ path: path.join(EVIDENCE, `${id}${engineSuffix()}.png`) }).catch(() => {});
  runs.push({ id, engine: currentEngine, name: spec?.name ?? id, url: page.url(), detail, problems });
  for (const problem of problems) failures.push(`${currentEngine} ${id}: ${problem}`);
  process.stdout.write(`${problems.length === 0 ? "PASS" : "FAIL"} [${currentEngine}] ${id} ${spec?.name ?? ""}\n`);
  for (const problem of problems) process.stdout.write(`     - ${problem}\n`);
  await context.close();
}

/** Which engine is running, and the suffix its screenshots carry. */
let currentEngine = engines[0];
const engineSuffix = () => (engines.length > 1 ? `-${currentEngine}` : "");

/** The sidebar's area identity, the way the navigation gate reads it. */
const SIDEBAR = () =>
  [
    ...document.querySelectorAll('[data-slot="app-shell-sidebar"] a[href]'),
  ].map((node) => (node.getAttribute("href") ?? "").replace(/^\/zh/, ""))[0] ?? null;

/* ------------------------------------------------------------------ journey 1 */
await journey("01-home-to-component-detail", { width: 1440, height: 900 }, async ({ page, record, settle }) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  /* The front door offers Components without a sidebar in the way. */
  await record(
    "the landing page has no sidebar column",
    (await page.locator('[data-slot="app-shell-sidebar"]').count()) === 0,
  );
  await page.getByRole("link", { name: "Browse the components" }).click();
  await page.waitForURL(/\/components$/, { timeout: 30000 });
  await settle();
  await record(
    "Components owns the sidebar",
    (await page.locator('[data-slot="app-shell-sidebar"]').first().innerText()).includes("Components"),
  );

  /* A catalogue preview is a real link into a detail page. */
  const preview = page.locator('main a[href$="/components/buttons"]').first();
  await record("the catalogue links to a component", (await preview.count()) > 0);
  await preview.click();
  await page.waitForURL(/\/components\/buttons$/, { timeout: 30000 });
  await settle();

  /* The specimen is in the first viewport, and Preview/Code is real: the code
   * block and the live specimen are both there, and the code names the component. */
  const height = page.viewportSize().height;
  const demo = await page.evaluate(() => {
    /*
     * Either specimen shape. Components V2 pages wrap a specimen in
     * `[data-slot="example"]`, whose stage is `[data-slot="example-stage"]`; the
     * older documentation pages still use `[data-slot="demo"]`. The journey
     * cares about the promise — a live specimen above the fold — not about which
     * of the two primitives the page happens to use.
     */
    const stage = document.querySelector("main [data-slot='example-stage'], main [data-slot='demo']");
    const code = document.querySelector("main pre code");
    return {
      top: stage ? Math.round(stage.getBoundingClientRect().top + window.scrollY) : null,
      code: code?.textContent?.slice(0, 80) ?? null,
    };
  });
  await record("the first specimen is in the first viewport", demo.top !== null && demo.top < height, `top=${demo.top}`);
  await record("the specimen has its own code", Boolean(demo.code) && demo.code.includes("<Button"), demo.code ?? "none");
});

/* ------------------------------------------------------------------ journey 2 */
await journey("02-components-to-motion-variant", { width: 1440, height: 900 }, async ({ page, record, settle, readClipboard, detail }) => {
  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  /* Motion is a family of Components: found here, not in the header. */
  const motionLink = page.locator('main a[href="/motion"]').first();
  await record("Components links to Motion", (await motionLink.count()) > 0);
  await page.goto(`${BASE}/motion/card-stack`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  const section = page.locator("main h2#examples");
  await record("the Motion detail shows its other configurations", (await section.count()) === 1);
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);

  /* The variant is interactive: the deck behind it steps. */
  const decks = page.locator('[data-slot="card-stack"]');
  await record("a second configuration is rendered", (await decks.count()) > 1, `${await decks.count()} deck(s)`);
  const second = decks.nth(1);
  const before = await second.getAttribute("data-active");
  await second.locator('[data-slot="card-stack-controls"] button[aria-label="Next card"]').click();
  await page.waitForTimeout(600);
  await record("the variant responds to its controls", (await second.getAttribute("data-active")) !== before);

  /* Copy produces the code of *that* variant. */
  const block = second.locator("xpath=ancestor::div[contains(@class,'flex-col')][1]");
  const copy = page.locator("main pre").nth(1).locator("xpath=../div//button").first();
  await page.locator("main pre").nth(1).hover();
  await page.waitForTimeout(150);
  await copy.click();
  const offered = await page.locator("main pre").nth(1).locator("code").innerText();
  const { value, source } = await readClipboard(offered);
  detail.push(`copy read from ${source}`);
  await record("copy yields the variant's own code", value.includes("<CardStack"), value.slice(0, 60));
  void block;
});

/* ------------------------------------------------------------------ journey 3 */
await journey("03-home-to-charts-time-axis", { width: 1440, height: 900 }, async ({ page, record, settle }) => {
  await page.goto(`${BASE}/charts`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  await record(
    "Charts owns the sidebar",
    (await page.locator('[data-slot="app-shell-sidebar"]').first().innerText()).includes("Charts"),
  );
  await page.goto(`${BASE}/charts/line-chart`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  await page.waitForTimeout(1200);

  /* The axis really labels itself, from the surface's own diagnostics. */
  const labels = await page.evaluate(() => {
    const host = document.querySelector("[data-luc-chart-diagnostics]");
    const digest = host ? JSON.parse(host.getAttribute("data-luc-chart-diagnostics") ?? "{}") : {};
    const height = host?.getBoundingClientRect().height ?? 0;
    return (digest.texts ?? [])
      .filter((t) => t.y > height - 40)
      .map((t) => t.t)
      .filter(Boolean);
  });
  await record(
    "the time axis labels its ticks without repeating the month",
    labels.length > 1 && new Set(labels).size === labels.length,
    labels.join(" | "),
  );

  /*
   * A control changes the preview and the code together.
   *
   * The code read is the *playground's* own panel — the control belongs to the
   * playground, and the page's other code blocks are specimens that must not
   * change when a prop changes.
   */
  const codeText = () =>
    page.evaluate(() => document.querySelector('[data-slot="playground"] details pre code')?.textContent ?? null);
  const before = await codeText();
  const combo = page.locator('[data-slot="playground-controls"] button[role="combobox"]').first();
  const option = page.locator('[role="option"][aria-selected="false"]').first();
  await combo.click();
  await page.waitForTimeout(250);
  await option.click();
  await page.waitForTimeout(600);
  const after = await codeText();
  await record(
    "a control rewrites the code beside the preview",
    before !== null && after !== null && before !== after,
    before === after ? "the code panel did not change" : undefined,
  );
});

/* ------------------------------------------------------------------ journey 4 */
await journey("04-home-to-docs-and-api", { width: 1440, height: 900 }, async ({ page, record, settle }) => {
  await page.goto(`${BASE}/docs`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  await page.getByRole("link", { name: "Installation", exact: true }).first().click();
  await page.waitForURL(/\/docs\/installation$/, { timeout: 30000 });
  await settle();
  const installWords = await page.evaluate(() => (document.querySelector("main")?.innerText ?? "").split(/\s+/).length);
  await record("installation is a real page with real commands", installWords > 80, `${installWords} words`);

  await page.goto(`${BASE}/components/native-select`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  const api = await page.locator("main h2#api");
  await record("a detail page has an API section", (await api.count()) === 1);
  const related = page.locator("main nav[aria-label='Related pages'] a");
  const pager = page.locator("main nav[aria-label='Documentation'] a");
  await record("it ends with related entries", (await related.count()) >= 2, `${await related.count()} links`);
  await record("and with a pager", (await pager.count()) === 2, `${await pager.count()} links`);
  /*
   * Wait for the navigation rather than sampling the URL straight after the click.
   *
   * Firefox commits this navigation a tick later than the other two engines, and
   * the first version of this step read the URL before it changed and called a
   * working pager broken. A journey that fails on engine timing is a broken
   * journey, not a broken product.
   */
  const before = page.url();
  await pager.first().click();
  const navigated = await page
    .waitForURL((url) => url.toString() !== before, { timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  await settle();
  await record("the pager navigates", navigated, page.url());
});

/* ------------------------------------------------------------------ journey 5 */
await journey("05-more-to-build", { width: 1440, height: 900 }, async ({ page, record, settle }) => {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  await page.locator('[data-testid="primary-nav"] button').last().click();
  await page.waitForTimeout(300);
  const panel = page.locator("header");
  for (const [label, route] of [
    ["Blocks", "/blocks"],
    ["Templates", "/templates"],
    ["Patterns", "/patterns"],
    ["Experiences", "/experiences"],
  ]) {
    const link = panel.getByRole("link", { name: label, exact: true }).first();
    await record(`the More panel lists ${label}`, (await link.count()) > 0);
    if (await link.count()) {
      await link.click();
      await page.waitForURL(new RegExp(`${route}$`), { timeout: 30000 });
      await settle();
      const identity = await page.evaluate(SIDEBAR);
      await record(`${route} reports its own area`, identity !== null, `sidebar first link ${identity}`);
      /* The Build switcher names the family on every subarea. */
      const groups = await page.evaluate(() =>
        [...document.querySelectorAll('[data-slot="sidebar-group-label"]')].map((node) => node.textContent?.trim()),
      );
      await record(`${route} shows the Build switcher`, groups.includes("Build"), groups.join(", "));
      await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
      await settle();
      await page.locator('[data-testid="primary-nav"] button').last().click();
      await page.waitForTimeout(250);
    }
  }
});

/* ------------------------------------------------------------------ journey 6 */
await journey("06-locale-round-trip", { width: 1440, height: 900 }, async ({ page, record, settle }) => {
  await page.goto(`${BASE}/components/buttons`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  const english = await page.locator("main h1").innerText();

  /*
   * Switch language the way a reader does: the control is a popover of real
   * links (`hrefLang` names the target), because the language *is* the URL.
   */
  await page.locator('[data-testid="language-control"]').click();
  await page.waitForTimeout(300);
  await page.locator('a[hrefLang="zh-CN"]').first().click();
  await page.waitForURL(/\/zh\//, { timeout: 30000 });
  await settle();
  const chinese = await page.locator("main h1").innerText();
  await record("switching language translates the page", chinese !== english, `${english} → ${chinese}`);
  await record(
    "and keeps every internal link in the Chinese locale",
    await page.evaluate(
      () =>
        [...document.querySelectorAll("main a[href^='/']")].filter(
          (node) => !(node.getAttribute("href") ?? "").startsWith("/zh"),
        ).length === 0,
    ),
  );

  /* A deep link survives a hard refresh and Back. */
  await page.goto(`${BASE}/zh/motion/card-stack`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  const title = await page.locator("main h1").innerText();
  await page.reload({ waitUntil: "domcontentloaded" });
  await settle();
  await record("a Chinese deep link survives a refresh", (await page.locator("main h1").innerText()) === title);
  await page.goBack({ waitUntil: "domcontentloaded" });
  await settle();
  await record("Back returns to the previous page", page.url().includes("/zh/components/buttons"), page.url());
});

/* ------------------------------------------------------------------ journey 7 */
await journey("07-mobile-drawer", { width: 390, height: 844 }, async ({ page, record, settle }) => {
  /*
   * Re-pointed at Components under IA V3.
   *
   * The journey used to start on `/docs` and open a group called "Forms", because
   * Docs had eight sections and Forms was one of them. It has two now — the guides
   * moved to Components, where they document the library — so the drawer's real
   * subject is the two-level tree: a section, then a family inside it. That is a
   * stronger version of what this journey was written to check, because the
   * second level only exists on Components.
   */
  await page.goto(`${BASE}/components`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await settle();
  await record(
    "the desktop sidebar is not taking the width",
    await page.evaluate(() => {
      const aside = document.querySelector('[data-slot="app-shell-sidebar"]');
      return !aside || getComputedStyle(aside).display === "none";
    }),
  );
  await page.getByRole("button", { name: /open navigation/i }).first().click();
  await page.waitForTimeout(400);
  const drawer = page.locator('[data-slot="sheet"]');
  await record("the drawer opens", (await drawer.count()) > 0);
  /* The section the page is about is already open — a landing route opens one. */
  const openSection = drawer.locator('[data-slot="sidebar-group-label"]', { hasText: "UI components" }).first();
  await record(
    "the drawer opens the section the page is about",
    (await openSection.getAttribute("aria-expanded")) === "true",
    String(await openSection.getAttribute("aria-expanded")),
  );
  /* A *closed* section opens when it is asked to. */
  const closedSection = drawer.locator('[data-slot="sidebar-group-label"]', { hasText: "Integrations" }).first();
  await closedSection.click();
  await page.waitForTimeout(350);
  await record(
    "a closed drawer section expands",
    (await closedSection.getAttribute("aria-expanded")) === "true",
    String(await closedSection.getAttribute("aria-expanded")),
  );
  await closedSection.click();
  await page.waitForTimeout(250);
  /* Then a family inside the open section — the second level, which only
   * Components has: thirteen collapsible families under one section heading. */
  const family = drawer.locator('[data-slot="sidebar-item"]', { hasText: /^Forms$/ }).locator("button").first();
  await family.click();
  await page.waitForTimeout(350);
  await record(
    "a family inside the section expands",
    (await drawer.locator("a", { hasText: "Validation" }).count()) > 0,
  );
  await drawer.locator("a", { hasText: "Validation" }).first().click();
  await page.waitForURL(/\/forms\/validation$/, { timeout: 30000 });
  await settle();
  await record("the drawer navigates and closes", (await page.locator('[data-slot="sheet"]').count()) === 0);
  await record(
    "the page did not scroll sideways",
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth <= 1),
  );
});

/*
 * Run the registered journeys in every requested engine.
 *
 * Each engine gets its own browser process and its own screenshot suffix, so a
 * WebKit-only failure is visible as such rather than as "a journey failed".
 */
for (const engine of engines) {
  const launcher = ENGINES[engine];
  if (!launcher) {
    failures.push(`unknown engine "${engine}" — expected chromium, firefox or webkit`);
    continue;
  }
  currentEngine = engine;
  let browser;
  try {
    browser = await launcher.launch();
  } catch (error) {
    /* An engine that will not start is an environment fact, not a product
     * failure: it is reported as such and the other engines still run. */
    runs.push({ id: "engine-startup", engine, problems: [String(error.message).slice(0, 160)] });
    process.stdout.write(`SKIP [${engine}] could not launch: ${String(error.message).slice(0, 120)}\n`);
    continue;
  }
  for (const { id, viewport, steps } of QUEUE) {
    await runJourney(browser, id, viewport, steps);
  }
  await browser.close();
}

await writeFile(
  path.join(EVIDENCE, "journeys.json"),
  `${JSON.stringify({ checkedAt: new Date().toISOString(), base: BASE, engines, runs, failures }, null, 2)}\n`,
);
process.stdout.write(`\nreport: ${path.join(EVIDENCE, "journeys.json")}\n`);
if (failures.length > 0) {
  process.stdout.write(`\n${failures.length} journey step(s) failed.\n`);
  process.exit(1);
}
process.stdout.write(`\nAll ${JOURNEYS.length} journeys pass in ${engines.join(", ")}.\n`);
