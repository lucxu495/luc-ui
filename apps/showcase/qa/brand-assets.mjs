/**
 * Browser proof for the public brand entry points.
 *
 * Checks the things a unit test cannot see: which logo variant the browser
 * actually paints in each theme, whether the favicon and touch icon resolve,
 * whether the mobile drawer carries the same mark, and whether the fixed logo
 * box moves or changes size after hydration.
 *
 *   node qa/brand-assets.mjs
 *   LUC_QA_BASE_URL=http://127.0.0.1:5300 node qa/brand-assets.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { resolveBaseUrl } from "./base-url.mjs";
import { navigateAndReady } from "./readiness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../../../artifacts/qa/brand");
const BASE = resolveBaseUrl();

const ASSETS = [
  "/brand/luc-ui-logo-light-32.png",
  "/brand/luc-ui-logo-dark-32.png",
  "/brand/luc-ui-logo-light-64.png",
  "/brand/luc-ui-logo-dark-64.png",
  "/brand/luc-ui-apple-touch-180.png",
];

const LANGUAGES = [
  { id: "en", prefix: "", htmlLang: "en" },
  { id: "zh", prefix: "/zh", htmlLang: "zh-Hans-CN" },
];
const THEMES = ["light", "dark"];
const WIDTHS = [1440, 390];

const findings = [];
const cases = [];

function fail(label, message) {
  findings.push({ label, message });
}

function visibleLogos() {
  return Array.from(document.querySelectorAll('img[src*="luc-ui-logo-"]'))
    .map((image) => {
      const style = getComputedStyle(image);
      const box = image.getBoundingClientRect();
      return {
        src: image.getAttribute("src") ?? "",
        width: Math.round(box.width * 100) / 100,
        height: Math.round(box.height * 100) / 100,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        visible:
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number.parseFloat(style.opacity || "1") > 0 &&
          box.width > 0 &&
          box.height > 0,
      };
    })
    .filter((image) => image.visible);
}

function assertVisibleLogo(label, logos, theme) {
  if (logos.length === 0) {
    fail(label, "no visible Luc UI logo");
    return;
  }
  for (const logo of logos) {
    if (!logo.src.includes(`luc-ui-logo-${theme}-`)) {
      fail(label, `visible logo does not match ${theme} theme: ${logo.src}`);
    }
    if (!logo.src.includes(`luc-ui-logo-${theme}-64.png`)) {
      fail(label, `logo does not resolve to the 64 px source: ${logo.src}`);
    }
    if (logo.naturalWidth < 28 || logo.naturalWidth !== logo.naturalHeight) {
      fail(label, `optimized logo is smaller than its rendered box or not square: ${logo.naturalWidth}x${logo.naturalHeight}`);
    }
    if (Math.abs(logo.width - logo.height) > 0.5) {
      fail(label, `logo box is not square: ${logo.width}x${logo.height}`);
    }
    if (logo.width < 26 || logo.width > 30) {
      fail(label, `logo box is not the expected 28 px: ${logo.width}`);
    }
  }
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  for (const language of LANGUAGES) {
    for (const theme of THEMES) {
      for (const width of WIDTHS) {
        const label = `${language.id}-${theme}-${width}`;
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          colorScheme: theme,
        });
        await context.addInitScript((value) => {
          window.localStorage.setItem("luc-ui-theme", value);
        }, theme);
        const page = await context.newPage();
        const consoleErrors = [];
        const pageErrors = [];
        const brand404s = [];
        page.on("console", (message) => {
          if (message.type() === "error") consoleErrors.push(message.text());
        });
        page.on("pageerror", (error) => pageErrors.push(error.message));
        page.on("response", (response) => {
          if (response.url().includes("/brand/") && response.status() >= 400) {
            brand404s.push(`${response.status()} ${response.url()}`);
          }
        });

        try {
          const base = `${BASE}${language.prefix}`;
          await navigateAndReady(page, base, { timeoutMs: 25_000, settleMs: 500 });

          const identity = await page.evaluate(() => ({
            lang: document.documentElement.lang,
            title: document.title,
            href: location.pathname,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            hydrate: document.documentElement.dataset.lucHydrated,
          }));
          if (identity.lang !== language.htmlLang) fail(label, `html lang is ${identity.lang}`);
          if (!identity.title.includes("Luc UI")) fail(label, `title does not name Luc UI: ${identity.title}`);
          if (identity.overflow > 0) fail(label, `horizontal overflow ${identity.overflow}px`);
          if (identity.hydrate !== "1") fail(label, "hydration marker missing");

          const firstLogos = await page.evaluate(visibleLogos);
          assertVisibleLogo(label, firstLogos, theme);
          await page.waitForTimeout(350);
          const secondLogos = await page.evaluate(visibleLogos);
          assertVisibleLogo(label, secondLogos, theme);
          if (
            firstLogos.length !== secondLogos.length ||
            firstLogos.some(
              (logo, index) =>
                Math.abs(logo.width - secondLogos[index].width) > 0.5 ||
                Math.abs(logo.height - secondLogos[index].height) > 0.5,
            )
          ) {
            fail(label, "logo box changed size after hydration");
          }

          const links = await page.evaluate(() =>
            Array.from(document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]')).map((link) => ({
              rel: link.getAttribute("rel") ?? "",
              href: link.getAttribute("href") ?? "",
              media: link.getAttribute("media") ?? "",
            })),
          );
          for (const expected of [
            "/brand/luc-ui-logo-light-32.png",
            "/brand/luc-ui-logo-dark-32.png",
            "/brand/luc-ui-apple-touch-180.png",
          ]) {
            if (!links.some((link) => link.href === expected)) fail(label, `metadata is missing ${expected}`);
          }

          if (width === 390) {
            await navigateAndReady(page, `${base}/components/button`, { timeoutMs: 25_000, settleMs: 400 });
            await page.getByRole("button", { name: /Open navigation/i }).first().click();
            const drawer = page.getByRole("dialog").first();
            await drawer.waitFor({ state: "visible", timeout: 10_000 });
            const drawerLogos = await drawer.evaluate((node) =>
              Array.from(node.querySelectorAll('img[src*="luc-ui-logo-"]'))
                .map((image) => {
                  const style = getComputedStyle(image);
                  const box = image.getBoundingClientRect();
                  return {
                    src: image.getAttribute("src") ?? "",
                    width: Math.round(box.width * 100) / 100,
                    height: Math.round(box.height * 100) / 100,
                    naturalWidth: image.naturalWidth,
                    naturalHeight: image.naturalHeight,
                    visible:
                      style.display !== "none" &&
                      style.visibility !== "hidden" &&
                      box.width > 0 &&
                      box.height > 0,
                  };
                })
                .filter((image) => image.visible),
            );
            assertVisibleLogo(`${label}-drawer`, drawerLogos, theme);
            await page.screenshot({ path: path.join(OUT, `${label}-drawer.png`), fullPage: false });
          }

          await page.goto(base, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("load");
          await page.screenshot({ path: path.join(OUT, `${label}-home.png`), fullPage: false });

          for (const asset of ASSETS) {
            const response = await context.request.get(`${BASE}${asset}`);
            if (!response.ok()) fail(label, `${asset} returned HTTP ${response.status()}`);
            if (!(response.headers()["content-type"] ?? "").startsWith("image/png")) {
              fail(label, `${asset} is not served as image/png`);
            }
          }
        } catch (error) {
          fail(label, String(error?.stack ?? error).slice(0, 600));
        }

        if (consoleErrors.length > 0) fail(label, `console errors: ${consoleErrors.join(" | ").slice(0, 600)}`);
        if (pageErrors.length > 0) fail(label, `page errors: ${pageErrors.join(" | ").slice(0, 600)}`);
        if (brand404s.length > 0) fail(label, `brand request failures: ${brand404s.join(" | ")}`);
        cases.push({ label, consoleErrors, pageErrors, brand404s });
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(OUT, "report.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl: BASE, cases, findings }, null, 2)}\n`,
  "utf8",
);

if (findings.length > 0) {
  for (const finding of findings) console.error(`  ✗ ${finding.label}: ${finding.message}`);
  process.exitCode = 1;
} else {
  console.log(`brand assets: ${cases.length} browser contexts passed at 1440 and 390 px, light and dark, en and zh`);
}
