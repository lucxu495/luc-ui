/**
 * Read-only product-experience capture probe.
 *
 * Usage:
 *   node scripts/product-audit/capture.mjs \
 *     --base=https://ui.lucxu.com \
 *     --out=artifacts/product-experience-audit/public-desktop \
 *     --viewport=1440x1000 \
 *     --scheme=dark \
 *     --routes=/,/docs,/components/buttons
 *
 * It writes one viewport and one full-page screenshot per route plus a JSON
 * report containing console errors, failed requests, horizontal overflow,
 * undersized controls and selected landmark geometry.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.find((value) => value.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const base = arg("base", "https://ui.lucxu.com").replace(/\/$/, "");
const out = path.resolve(arg("out", "artifacts/product-experience-audit/capture"));
const [width, height] = arg("viewport", "1440x1000").split("x").map(Number);
const scheme = arg("scheme", "dark");
const locale = arg("locale", "en");
const routes = arg(
  "routes",
  [
    "/",
    "/docs",
    "/docs/installation",
    "/components",
    "/components/buttons",
    "/components/inputs",
    "/components/select",
    "/components/dialog",
    "/components/menus",
    "/components/tabs",
    "/components/cards",
    "/data/table",
    "/charts",
    "/charts/financial",
    "/forms/validation",
    "/patterns/settings-form",
    "/application/navigation",
    "/explore",
  ].join(","),
).split(",");
const routeSlug = (route) =>
  route === "/" ? "home" : route.replace(/^\//, "").replaceAll("/", "--");

await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  colorScheme: scheme,
  locale,
});
const report = {
  capturedAt: new Date().toISOString(),
  base,
  viewport: { width, height },
  scheme,
  locale,
  routes: [],
};

for (const route of routes) {
  const page = await context.newPage();
  const consoleErrors = [];
  const failedRequests = [];
  const pageErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("requestfailed", (request) => {
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText ?? "unknown",
    });
  });

  const started = Date.now();
  let response;
  try {
    response = await page.goto(`${base}${route}`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    });
    await page.waitForTimeout(700);
    const row = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const main = document.querySelector("main");
      const rect = (element) => {
        if (!element) return null;
        const value = element.getBoundingClientRect();
        return {
          x: Math.round(value.x),
          y: Math.round(value.y),
          width: Math.round(value.width),
          height: Math.round(value.height),
        };
      };
      const overflow = [...document.querySelectorAll("body *")]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.position === "fixed") return false;
          const box = element.getBoundingClientRect();
          return box.width > 0 && (box.right > root.clientWidth + 2 || box.left < -2);
        })
        .slice(0, 20)
        .map((element) => ({
          tag: element.tagName.toLowerCase(),
          className:
            typeof element.className === "string"
              ? element.className.slice(0, 160)
              : undefined,
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
          rect: rect(element),
        }));
      const controls = [...document.querySelectorAll("button, a, input, select, textarea, [role=button]")]
        .filter((element) => {
          const box = element.getBoundingClientRect();
          return box.width > 0 && box.height > 0;
        })
        .map((element) => {
          const box = element.getBoundingClientRect();
          return {
            tag: element.tagName.toLowerCase(),
            text: (element.textContent ?? element.getAttribute("aria-label") ?? "")
              .trim()
              .replace(/\s+/g, " ")
              .slice(0, 80),
            width: Math.round(box.width),
            height: Math.round(box.height),
          };
        });
      const smallControls = controls.filter(
        (control) => control.width < 44 || control.height < 44,
      );
      const headings = [...document.querySelectorAll("h1, h2")].slice(0, 16).map((element) => {
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 120),
          fontSize: style.fontSize,
          fontWeight: style.fontWeight,
          lineHeight: style.lineHeight,
          rect: rect(element),
        };
      });
      return {
        title: document.title,
        url: location.href,
        documentWidth: root.scrollWidth,
        viewportWidth: root.clientWidth,
        documentHeight: root.scrollHeight,
        bodyBackground: getComputedStyle(body).backgroundColor,
        main: rect(main),
        header: rect(document.querySelector("header")),
        nav: rect(document.querySelector("nav")),
        headings,
        controlCount: controls.length,
        smallControlCount: smallControls.length,
        smallControls: smallControls.slice(0, 24),
        overflow,
        fonts: {
          body: getComputedStyle(body).fontFamily,
          bodySize: getComputedStyle(body).fontSize,
          bodyLineHeight: getComputedStyle(body).lineHeight,
        },
      };
    });

    const slug = routeSlug(route);
    await page.screenshot({ path: path.join(out, `${slug}--viewport.png`) });
    await page.screenshot({
      path: path.join(out, `${slug}--full.png`),
      fullPage: true,
    });
    report.routes.push({
      route,
      status: response?.status() ?? null,
      elapsedMs: Date.now() - started,
      consoleErrors,
      pageErrors,
      failedRequests,
      ...row,
    });
    console.log(
      `${String(response?.status() ?? "ERR").padStart(3)} ${route} ${Date.now() - started}ms ` +
        `${row.main ? `${row.main.width}x${row.main.height}` : "no-main"} ` +
        `overflow=${row.overflow.length} small=${row.smallControlCount}/${row.controlCount}`,
    );
  } catch (error) {
    report.routes.push({
      route,
      status: response?.status() ?? null,
      error: error instanceof Error ? error.message : String(error),
      consoleErrors,
      pageErrors,
      failedRequests,
    });
    console.log(`ERR ${route}: ${error instanceof Error ? error.message : error}`);
  } finally {
    await page.close();
  }
}

await writeFile(path.join(out, "report.json"), JSON.stringify(report, null, 2));
console.log(`Wrote ${path.join(out, "report.json")}`);
await browser.close();
