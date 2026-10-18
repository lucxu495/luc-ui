/**
 * Produces the focused visual and behavioural evidence referenced by
 * docs/audits/PRODUCT_EXPERIENCE_AUDIT.md.
 *
 * Run against a local production Showcase:
 *   node scripts/product-audit/evidence.mjs
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = (process.env.AUDIT_BASE ?? "http://127.0.0.1:5300").replace(/\/$/, "");
const out = path.resolve("artifacts/product-experience-audit/evidence");
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const results = {};

async function pageAt(viewport, route) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  await page.goto(`${base}${route}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  return { context, page };
}

/* Home resource counts. */
{
  const { context, page } = await pageAt({ width: 1440, height: 1000 }, "/");
  const section = page.locator('[data-testid="home-resources"]');
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await section.screenshot({ path: path.join(out, "home-resource-counts.png") });
  results.homeResources = await page.$$eval("[data-testid^=home-resource-]", (elements) =>
    elements.map((element) => ({
      id: element.getAttribute("data-testid"),
      text: element.innerText.trim().replace(/\n+/g, " | "),
    })),
  );
  await context.close();
}

/* Docs category counts. */
{
  const { context, page } = await pageAt({ width: 1440, height: 1000 }, "/docs");
  await page.locator("h2#sections").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "docs-surface-counts.png") });
  results.docsCounts = await page.locator("h2#sections + div").innerText();
  await context.close();
}

/* Mobile header theme availability. */
{
  const { context, page } = await pageAt({ width: 390, height: 844 }, "/components/buttons");
  await page.screenshot({ path: path.join(out, "mobile-header-theme.png") });
  results.mobileTheme = await page.evaluate(() => {
    const controls = [...document.querySelectorAll("[aria-label='System theme'], [aria-label='Light theme'], [aria-label='Dark theme']")];
    return {
      visibleControls: controls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && getComputedStyle(element).visibility !== "hidden";
        })
        .map((element) => element.getAttribute("aria-label")),
      domControls: controls.map((element) => ({
        label: element.getAttribute("aria-label"),
        width: Math.round(element.getBoundingClientRect().width),
        height: Math.round(element.getBoundingClientRect().height),
        display: getComputedStyle(element).display,
      })),
    };
  });
  await context.close();
}

/* Mobile props table readability. */
{
  const { context, page } = await pageAt({ width: 390, height: 844 }, "/components/buttons");
  const heading = page.locator("h3#props-Button");
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "mobile-button-props.png") });
  const table = page.locator("table").filter({ hasText: "loadingLabel?" }).first();
  results.mobilePropsTable = await table.evaluate((element) => {
    const cells = [...element.querySelectorAll("tbody tr:first-child td")];
    return {
      tableWidth: Math.round(element.getBoundingClientRect().width),
      columns: cells.map((cell) => ({
        text: cell.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
        width: Math.round(cell.getBoundingClientRect().width),
        height: Math.round(cell.getBoundingClientRect().height),
      })),
      pageHeight: document.documentElement.scrollHeight,
    };
  });
  await context.close();
}

/* Mobile documentation table cut-off. */
{
  const { context, page } = await pageAt({ width: 390, height: 844 }, "/patterns/table-filters");
  const heading = page.getByRole("heading", { name: "Filter bar plus table" });
  await heading.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "mobile-table-cutoff.png") });
  results.mobileTable = await page.evaluate(() => {
    const table = [...document.querySelectorAll("table")].find((candidate) =>
      candidate.textContent?.includes("Symbol"),
    );
    if (!table) return null;
    let scroller = table.parentElement;
    while (scroller && scroller.scrollWidth <= scroller.clientWidth) scroller = scroller.parentElement;
    const rect = table.getBoundingClientRect();
    return {
      tableWidth: Math.round(rect.width),
      visibleViewport: document.documentElement.clientWidth,
      scroller: scroller
        ? {
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
            overflowX: getComputedStyle(scroller).overflowX,
          }
        : null,
      headers: [...table.querySelectorAll("thead th")].map((header) =>
        header.textContent?.trim().replace(/\s+/g, " "),
      ),
    };
  });
  await context.close();
}

/* Finance experience: chart wider than its clipped frame. */
{
  const { context, page } = await pageAt({ width: 390, height: 844 }, "/experiences/vertical/finance");
  const chart = page.locator("canvas").first();
  await chart.evaluate((element) => {
    const top = element.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, Math.max(0, top - 110));
  });
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(out, "finance-mobile-chart.png") });
  results.financeChart = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      canvas: {
        x: Math.round(rect.x),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      viewportWidth: document.documentElement.clientWidth,
    };
  });
  await context.close();
}

/* Skip link, "/" hint, command focus and copy feedback. */
{
  const { context, page } = await pageAt({ width: 1440, height: 1000 }, "/components/buttons");

  await page.keyboard.press("Tab");
  const skipBefore = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim(),
  }));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const skipAfter = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim().slice(0, 80),
    scrollY: Math.round(window.scrollY),
  }));
  await page.keyboard.press("Tab");
  const skipNextTab = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    href: document.activeElement?.getAttribute("href"),
  }));
  results.skipLink = { skipBefore, skipAfter, skipNextTab };

  await page.goto(`${base}/docs`, { waitUntil: "networkidle" });
  await page.keyboard.press("/");
  await page.waitForTimeout(150);
  results.slashShortcut = await page.evaluate(() => ({
    activeTag: document.activeElement?.tagName,
    activeRole: document.activeElement?.getAttribute("role"),
    activeValue: document.activeElement?.value,
  }));
  await page.screenshot({ path: path.join(out, "docs-slash-hint.png") });

  await page.keyboard.press("Meta+KeyK");
  await page.waitForTimeout(250);
  await page.keyboard.type("button");
  await page.waitForTimeout(200);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(350);
  results.commandFocusAfterNavigation = await page.evaluate(() => ({
    url: location.href,
    activeTag: document.activeElement?.tagName,
    activeText: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 100),
    heading: document.querySelector("h1")?.textContent?.trim(),
  }));

  const copy = page.getByRole("button", { name: /Copy import/i }).first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  await page.waitForTimeout(250);
  results.copyFeedback = await page.evaluate(() => ({
    activeLabel: document.activeElement?.getAttribute("aria-label"),
    liveRegions: [...document.querySelectorAll("[aria-live]")].map((element) => ({
      live: element.getAttribute("aria-live"),
      text: element.textContent?.trim().slice(0, 100),
    })),
    tooltip: document.querySelector("[role=tooltip]")?.textContent?.trim() ?? null,
  }));
  await page.screenshot({ path: path.join(out, "copy-feedback.png") });
  await context.close();
}

/* Chart unit inconsistency: axis says $, tooltip says plain volume. */
{
  const { context, page } = await pageAt({ width: 1440, height: 1000 }, "/charts/financial");
  const oneMonth = page.locator("text=1M").first();
  await oneMonth.click();
  await page.waitForTimeout(450);
  const canvas = page.locator("canvas").first();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(out, "chart-volume-unit.png") });
  results.chartUnits = {
    tooltip: await page.evaluate(() =>
      [...document.querySelectorAll("div")]
        .map((element) => element.textContent?.trim().replace(/\s+/g, " ") ?? "")
        .find((text) => text.startsWith("Volume") || text.includes("Volume ")) ?? null,
    ),
  };
  await context.close();
}

await writeFile(path.join(out, "evidence.json"), JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
await browser.close();
