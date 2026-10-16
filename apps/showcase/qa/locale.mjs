/**
 * Locale routing — the URL, the cookie and the middleware must agree.
 *
 * The Showcase keeps English unprefixed and Chinese under `/zh`. Two pieces make
 * that work: `middleware.ts` rewrites `/zh/<route>` onto `/<route>` (one copy of
 * every page), and a cookie remembers the visitor's last explicit choice so an
 * unprefixed URL is not bounced into Chinese again.
 *
 * That is a small machine with a sharp failure mode: when the cookie and the URL
 * disagree, a browser can be sent back and forth between `/x` and `/zh/x` while
 * `curl`, which carries no cookie and follows one redirect, sees nothing wrong.
 * This probe drives a real browser through the transitions and counts hops.
 *
 *   LUC_QA_BASE_URL=http://127.0.0.1:3149 node qa/locale.mjs
 *
 * A scenario fails when its chain exceeds `MAX_HOPS`, when any single URL is
 * requested more than `MAX_REPEATS` times (the loop signature), when the final
 * URL is not the canonical one for the language, or when `<html lang>` does not
 * agree with the URL prefix.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EVIDENCE = path.resolve(HERE, "../../../artifacts/screenshots/showcase-transformation");
const BASE = (process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3100").replace(/\/$/, "");

const MAX_HOPS = 6;
const MAX_REPEATS = 3;
const ALL = process.argv.includes("--all");

/**
 * `--all` walks every documented route under `/zh`.
 *
 * The seven-page scenario below proves the transitions; this proves the *links*,
 * on every page, which is the real invariant: an unprefixed internal link is
 * correct on no Chinese page. It is opt-in because it is a full sweep.
 */
async function documentedRoutes() {
  const app = path.resolve(HERE, "..");
  const registry = await readFile(path.join(app, "lib/docs/generated/registry.ts"), "utf8").catch(() => "");
  /*
   * The registry alone is not the site: hand-written pages (`/visuals/elements`,
   * `/explore`, `/blocks`, the studios) are covered by the QA route policy
   * instead. Sweeping only one of the two sets is how a gate grows a blind spot
   * — the first run of this check passed on 223 registry routes while the page
   * with 81 unprefixed links sat outside it.
   */
  const { ROUTES } = await import("./routes.mjs");
  return [
    ...new Set([
      ...ROUTES.map((route) => route.path),
      ...[...registry.matchAll(/"route": "(\/[^"]+)"/g)].map((match) => match[1]),
    ]),
  ];
}

/** One browser context per language: the cookie jar is the thing under test. */
async function scenario(browser, { name, language, steps }) {
  const context = await browser.newContext({
    locale: language,
    extraHTTPHeaders: { "Accept-Language": language === "zh-CN" ? "zh-CN,zh;q=0.9" : "en-US,en;q=0.9" },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const hops = [];
  const perUrl = new Map();
  page.on("response", (response) => {
    if (!response.request().isNavigationRequest()) return;
    const url = new URL(response.url());
    const key = url.pathname;
    perUrl.set(key, (perUrl.get(key) ?? 0) + 1);
    if (response.status() >= 300 && response.status() < 400) {
      hops.push(`${response.status()} ${key} → ${response.headers()["location"] ?? "?"}`);
    }
  });

  const problems = [];
  const observations = [];
  try {
    for (const step of steps) {
      if (step.goto) {
        const response = await page.goto(BASE + step.goto, { waitUntil: "domcontentloaded", timeout: 40000 });
        await page
          .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
          .catch(() => {});
        observations.push({
          step: step.label ?? step.goto,
          status: response?.status() ?? 0,
          url: new URL(page.url()).pathname + new URL(page.url()).search,
          lang: await page.evaluate(() => document.documentElement.lang),
        });
        if (step.expect && new URL(page.url()).pathname !== step.expect) {
          problems.push(`${step.label ?? step.goto}: landed on ${new URL(page.url()).pathname}, expected ${step.expect}`);
        }
        if (step.expectLang) {
          const lang = await page.evaluate(() => document.documentElement.lang);
          if (!lang.startsWith(step.expectLang)) {
            problems.push(`${step.label ?? step.goto}: <html lang> is "${lang}", expected "${step.expectLang}…"`);
          }
        }
      }
      if (step.click) {
        await page.locator(step.click).first().click();
        await page.waitForLoadState("domcontentloaded").catch(() => {});
        await page.waitForTimeout(500);
        observations.push({ step: step.label ?? `click ${step.click}`, url: new URL(page.url()).pathname });
      }
      if (step.crawlLinks) {
        /*
         * The trap that makes this browser-only: Next prefetches a `<Link>` as
         * soon as it is in the viewport, and a prefetch of an *unprefixed* URL
         * from a Chinese page receives the 307 into `/zh/...`, which the client
         * router then caches and replays on click. `curl` follows one redirect
         * and sees a correct page; the browser keeps a poisoned entry.
         *
         * So the inventory matters as much as the click: on a prefixed page every
         * internal link must already be prefixed.
         */
        const unprefixed = await page.evaluate(() => {
          const out = [];
          for (const anchor of document.querySelectorAll("a[href^='/']")) {
            const href = anchor.getAttribute("href");
            if (href.startsWith("/zh") || href.startsWith("/en")) continue;
            out.push(href.split("#")[0]);
          }
          return [...new Set(out)];
        });
        observations.push({ step: "unprefixed internal links", list: unprefixed });
        if (unprefixed.length > 0) {
          problems.push(
            `${unprefixed.length} internal link(s) on a Chinese page are not prefixed: ${unprefixed.slice(0, 6).join(", ")}`,
          );
        }
      }
      if (step.reload) {
        await page.reload({ waitUntil: "domcontentloaded" });
        observations.push({ step: "reload", url: new URL(page.url()).pathname });
      }
      if (step.back) {
        await page.goBack({ waitUntil: "domcontentloaded" }).catch(() => {});
        observations.push({ step: "back", url: new URL(page.url()).pathname });
      }
    }
  } catch (error) {
    problems.push(`probe failed: ${String(error.message).slice(0, 160)}`);
  }

  if (hops.length > MAX_HOPS) problems.push(`${hops.length} redirects (limit ${MAX_HOPS})`);
  for (const [url, count] of perUrl) {
    if (count > MAX_REPEATS) problems.push(`${url} was requested ${count} times — redirect loop`);
  }
  await context.close();
  return { name, language, problems, hops, perUrl: Object.fromEntries(perUrl), observations };
}

const browser = await chromium.launch();
const results = [];

results.push(
  await scenario(browser, {
    name: "cookies-free, English browser",
    language: "en-US",
    steps: [
      { goto: "/", label: "fresh /", expect: "/", expectLang: "en" },
      { goto: "/components/buttons", label: "fresh /components/buttons", expect: "/components/buttons", expectLang: "en" },
    ],
  }),
);

results.push(
  await scenario(browser, {
    name: "cookies-free, Chinese browser",
    language: "zh-CN",
    steps: [
      { goto: "/", label: "fresh / (zh browser)", expect: "/zh", expectLang: "zh" },
      { goto: "/components/buttons", label: "fresh /components/buttons (zh browser)", expect: "/zh/components/buttons", expectLang: "zh" },
      { reload: true },
      { goto: "/zh/charts/line-chart", label: "direct /zh deep link", expect: "/zh/charts/line-chart", expectLang: "zh" },
      { back: true, label: "back" },
      { goto: "/motion/card-stack", label: "prefixed sibling after history", expect: "/zh/motion/card-stack", expectLang: "zh" },
    ],
  }),
);

/*
 * The transition that the cookie exists for: an explicit choice has to stick,
 * in both directions, including after the visitor asks for English from a
 * Chinese URL.
 */
results.push(
  await scenario(browser, {
    name: "explicit switch zh → en",
    language: "zh-CN",
    steps: [
      { goto: "/zh/components/buttons", label: "start in Chinese", expect: "/zh/components/buttons", expectLang: "zh" },
      { click: '[data-testid="language-control"]', label: "open the switcher" },
      { click: '[data-testid="language-control"] ~ * a[hrefLang="en"], a[hrefLang="en"]', label: "choose English" },
      { goto: "/components/buttons", label: "English URL stays English", expect: "/components/buttons", expectLang: "en" },
    ],
  }),
);

/*
 * Every surface a Chinese reader can reach has to hand out Chinese URLs. This
 * scenario walks the areas rather than one page, because the defect is a *link*
 * on a page, and which page it is on is the whole question.
 */
results.push(
  await scenario(browser, {
    name: "Chinese pages link to Chinese URLs",
    language: "zh-CN",
    steps: [
      { goto: "/zh", label: "home in Chinese", expect: "/zh", crawlLinks: true },
      { goto: "/zh/components/buttons", label: "components in Chinese", expect: "/zh/components/buttons", crawlLinks: true },
      { goto: "/zh/charts/line-chart", label: "charts in Chinese", expect: "/zh/charts/line-chart", crawlLinks: true },
      { goto: "/zh/motion/card-stack", label: "motion in Chinese", expect: "/zh/motion/card-stack", crawlLinks: true },
      { goto: "/zh/components/buttons", label: "a component page in Chinese", expect: "/zh/components/buttons", crawlLinks: true },
      { goto: "/zh/explore", label: "explore in Chinese", expect: "/zh/explore", crawlLinks: true },
      { goto: "/zh/docs", label: "docs in Chinese", expect: "/zh/docs", crawlLinks: true },
    ],
  }),
);

/* --- optional full sweep: every documented route, under /zh ---------------- */
if (ALL) {
  const routes = await documentedRoutes();
  const context = await browser.newContext({
    locale: "zh-CN",
    extraHTTPHeaders: { "Accept-Language": "zh-CN,zh;q=0.9" },
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const offenders = [];
  const timeouts = [];
  /* One redirect into /zh is expected per fresh document; more is a loop. */
  const perRoute = [];
  for (const route of routes) {
    const hops = [];
    const onResponse = (response) => {
      if (!response.request().isNavigationRequest()) return;
      if (response.status() >= 300 && response.status() < 400) hops.push(response.url());
    };
    page.on("response", onResponse);
    /*
     * One retry, because a timeout is not a locale defect.
     *
     * The first run of this sweep on a busy machine reported
     * `/zh/charts/ecdf-chart` as "1 unprefixed internal link" when the truth was
     * that `page.goto` had timed out; the same route answers in 30ms when asked
     * directly. A gate that turns a slow navigation into a wrong finding is worse
     * than one that reports the slow navigation: the retry absorbs the transient,
     * and a route still failing afterwards is recorded as a timeout, separately.
     */
    const visit = async () =>
      page.goto(`${BASE}/zh${route === "/" ? "" : route}`, { waitUntil: "domcontentloaded", timeout: 40000 });
    try {
      try {
        await visit();
      } catch {
        await visit();
      }
      await page
        .waitForFunction(() => document.documentElement.dataset.lucHydrated === "1", null, { timeout: 20000 })
        .catch(() => {});
      const unprefixed = await page.evaluate(() => {
        const out = [];
        for (const anchor of document.querySelectorAll("a[href^='/']")) {
          const href = anchor.getAttribute("href");
          if (href.startsWith("/zh") || href.startsWith("/en")) continue;
          const target = href.split("#")[0];
          if (target.startsWith("/_next")) continue;
          out.push(target);
        }
        return [...new Set(out)];
      });
      if (unprefixed.length > 0) offenders.push({ route, links: unprefixed });
      if (hops.length > 1) perRoute.push({ route, hops: hops.length });
    } catch (error) {
      timeouts.push({ route, error: String(error.message).slice(0, 80) });
    } finally {
      page.off("response", onResponse);
    }
  }
  await context.close();
  const problems = [];
  if (offenders.length > 0) {
    const total = offenders.reduce((sum, entry) => sum + entry.links.length, 0);
    problems.push(`${offenders.length} route(s) hand out ${total} unprefixed internal link(s)`);
    for (const entry of offenders.slice(0, 12)) {
      console.log(`       ${entry.route}: ${entry.links.slice(0, 5).join(", ")}`);
    }
  }
  if (perRoute.length > 0) problems.push(`${perRoute.length} route(s) redirected more than once`);
  if (timeouts.length > 0) {
    problems.push(`${timeouts.length} route(s) did not load within the timeout (not a link defect)`);
    for (const entry of timeouts.slice(0, 5)) console.log(`       timeout ${entry.route}: ${entry.error}`);
  }
  results.push({ name: `full /zh sweep (${routes.length} routes)`, language: "zh-CN", problems, hops: [], perUrl: {}, observations: [] });
  await writeFile(
    path.join(EVIDENCE, "locale-sweep.json"),
    `${JSON.stringify({ base: BASE, routes: routes.length, offenders, perRoute, timeouts }, null, 2)}\n`,
  );
}

await browser.close();
await mkdir(EVIDENCE, { recursive: true });
const outFile = path.join(EVIDENCE, "locale-probe.json");
await writeFile(outFile, `${JSON.stringify({ base: BASE, results }, null, 2)}\n`);

let failed = 0;
for (const result of results) {
  console.log(`${result.problems.length === 0 ? "PASS" : "FAIL"} ${result.name}`);
  for (const problem of result.problems) console.log(`     - ${problem}`);
  for (const hop of result.hops) console.log(`       hop: ${hop}`);
  failed += result.problems.length > 0 ? 1 : 0;
}
console.log(`\nreport: ${outFile}`);
process.exit(failed === 0 ? 0 : 1);
