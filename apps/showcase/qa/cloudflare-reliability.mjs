/**
 * Regression probe for a deployed/staged Cloudflare Worker.
 *
 * Run after an OpenNext build and a local or staging `wrangler dev`:
 *
 *   CLOUDFLARE_PREVIEW_URL=http://127.0.0.1:8787 pnpm --filter @luc/showcase qa:cloudflare
 *
 * The probe refuses the production hostname so this script cannot accidentally
 * become the high-load test the incident explicitly prohibits.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = (process.env.CLOUDFLARE_PREVIEW_URL ?? "http://127.0.0.1:8787").replace(
  /\/$/,
  "",
);
if (/^https?:\/\/ui\.lucxu\.com(?:\/|$)/.test(base)) {
  throw new Error("Refusing to load-test the production hostname");
}

const outputDir = path.resolve("../../artifacts/reliability");
await mkdir(outputDir, { recursive: true });

const routes = [
  { path: "/", lang: "en" },
  { path: "/zh", lang: "zh-Hans-CN" },
  { path: "/docs", lang: "en" },
  { path: "/zh/docs", lang: "zh-Hans-CN" },
  { path: "/date-time/date-picker", lang: "en" },
  { path: "/zh/date-time/date-picker", lang: "zh-Hans-CN" },
  { path: "/components/command", lang: "en" },
  { path: "/components/ai", lang: "en" },
  { path: "/application/navigation", lang: "en" },
  { path: "/charts/financial", lang: "en" },
  { path: "/integrations/tradingview", lang: "en" },
  { path: "/blocks", lang: "en" },
  { path: "/zh/blocks", lang: "zh-Hans-CN" },
];

const failures = [];

async function inspectResponse(route) {
  const started = performance.now();
  const response = await fetch(`${base}${route.path}`, {
    headers: { "cache-control": "no-cache" },
  });
  const body = await response.text();
  const result = {
    path: route.path,
    status: response.status,
    elapsedMs: Math.round(performance.now() - started),
    cacheControl: response.headers.get("cache-control"),
    contentLanguage: response.headers.get("content-language"),
    static: response.headers.get("x-luc-static"),
    hasWorkerError: body.includes("error code: 1102"),
    langMatches: body.includes(`<html lang="${route.lang}"`),
  };
  if (
    result.status !== 200 ||
    result.hasWorkerError ||
    !result.langMatches ||
    result.contentLanguage !== route.lang
  ) {
    failures.push(result);
  }
  return result;
}

const sequential = [];
for (let index = 0; index < 50; index += 1) {
  sequential.push(await inspectResponse(routes[index % routes.length]));
}

const concurrentRoutes = [
  routes[0],
  routes[1],
  routes[2],
  routes[3],
  routes[4],
  routes[5],
  routes[11],
  routes[12],
];
const concurrent = await Promise.all(concurrentRoutes.map(inspectResponse));

async function inspectRedirect(pathname, cookie, expectedLocation) {
  const response = await fetch(`${base}${pathname}`, {
    redirect: "manual",
    headers: cookie ? { cookie } : {},
  });
  const result = {
    path: pathname,
    status: response.status,
    location: response.headers.get("location"),
  };
  if (result.status !== 307 || result.location !== expectedLocation) {
    failures.push(result);
  }
  await response.body?.cancel();
  return result;
}

const redirects = [
  await inspectRedirect("/docs", "luc-ui-locale=zh-CN", `${base}/zh/docs`),
];

async function inspectAlias(pathname, expectedLocation) {
  const response = await fetch(`${base}${pathname}`, { redirect: "manual" });
  const result = {
    path: pathname,
    status: response.status,
    location: response.headers.get("location"),
  };
  if (result.status !== 308 || result.location !== expectedLocation) {
    failures.push(result);
  }
  await response.body?.cancel();
  return result;
}

redirects.push(
  await inspectAlias("/components/button", "/components/buttons"),
  await inspectAlias("/zh/components/button", "/zh/components/buttons"),
  await inspectAlias("/explore/browse?use=monitoring", `${base}/explore?use=monitoring`),
  await inspectAlias(
    "/zh/explore/browse?use=monitoring",
    `${base}/zh/explore?use=monitoring`,
  ),
);

async function inspectRsc(route, expectedText) {
  const response = await fetch(`${base}${route}?_rsc=reliability`, {
    headers: {
      rsc: "1",
      "next-router-prefetch": "1",
      "next-url": "/docs",
    },
  });
  const body = await response.text();
  const result = {
    route,
    status: response.status,
    contentType: response.headers.get("content-type"),
    rscStatic: response.headers.get("x-luc-static"),
    hasExpectedLanguage: body.includes(expectedText),
  };
  if (
    result.status !== 200 ||
    result.contentType !== "text/x-component" ||
    result.rscStatic !== "rsc" ||
    !result.hasExpectedLanguage
  ) {
    failures.push(result);
  }
  return result;
}

const rsc = [
  await inspectRsc("/docs/installation", "Installation"),
  await inspectRsc("/zh/docs/installation", "安装"),
];

const browser = await chromium.launch();
const hydration = [];
for (const [start, label, expectedHeading] of [
  ["/docs", "Installation", "Installation"],
  ["/zh/docs", "安装", "安装"],
]) {
  const page = await browser.newPage();
  const errors = [];
  const badResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      !response.url().includes("/v1/relay/envelopes")
    ) {
      badResponses.push({ status: response.status(), url: response.url() });
    }
  });

  await page.goto(`${base}${start}`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.documentElement.dataset.lucHydrated === "1",
    { timeout: 15_000 },
  );
  await page.getByRole("link", { name: label, exact: true }).first().click();
  await page.waitForTimeout(700);
  const result = {
    start,
    url: page.url(),
    heading: await page.locator("h1").first().textContent(),
    errors,
    badResponses,
  };
  if (
    result.heading !== expectedHeading ||
    result.errors.length > 0 ||
    result.badResponses.length > 0
  ) {
    failures.push(result);
  }
  hydration.push(result);
  await page.close();
}

{
  const page = await browser.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(`${base}/blocks`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.documentElement.dataset.lucHydrated === "1",
    { timeout: 15_000 },
  );
  await page.getByRole("link", { name: /Marketing/ }).first().click();
  await page.waitForTimeout(500);
  const result = {
    start: "/blocks",
    url: page.url(),
    filterPressed: await page
      .getByRole("link", { name: /Marketing/ })
      .first()
      .getAttribute("aria-current"),
    errors,
  };
  if (!result.url.includes("category=marketing") || result.filterPressed !== "page" || errors.length > 0) {
    failures.push(result);
  }
  hydration.push(result);
  await page.close();
}
await browser.close();

const report = {
  capturedAt: new Date().toISOString(),
  base,
  sequential,
  concurrent,
  redirects,
  rsc,
  hydration,
  failures,
};
await writeFile(path.join(outputDir, "cloudflare-regression.json"), JSON.stringify(report, null, 2));

console.log(
  `Cloudflare reliability: ${sequential.length + concurrent.length} HTML requests, ` +
    `${failures.length} failures`,
);
if (failures.length > 0) {
  console.error(JSON.stringify(failures, null, 2));
  process.exitCode = 1;
}
