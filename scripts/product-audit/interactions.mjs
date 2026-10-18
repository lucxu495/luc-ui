/**
 * Read-only interaction probe for the public Showcase.
 *
 * Runs representative task sequences — open/search/select, open/edit/close,
 * form validation, tabs, table overflow and mobile navigation — and writes
 * screenshots plus measured outcomes to artifacts/product-experience-audit/.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = (process.env.AUDIT_BASE ?? "http://127.0.0.1:5300").replace(/\/$/, "");
const out = path.resolve("artifacts/product-experience-audit/interactions");
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const results = [];

function log(name, value) {
  results.push({ name, ...value });
  console.log(name, JSON.stringify(value));
}

async function shot(page, name, options = {}) {
  await page.screenshot({ path: path.join(out, `${name}.png`), ...options });
}

async function withPage(viewport, fn) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: "dark",
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  try {
    await fn(page);
  } catch (error) {
    log("failure", {
      error: error instanceof Error ? error.message : String(error),
      consoleErrors,
    });
  } finally {
    await context.close();
  }
}

/* 1. Global command palette: open, search, select. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/`, { waitUntil: "networkidle" });
  await page.keyboard.press("Meta+KeyK");
  await page.waitForTimeout(350);
  const open = await page.evaluate(() => ({
    active: document.activeElement?.getAttribute("placeholder") ?? document.activeElement?.tagName,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    listboxes: document.querySelectorAll('[role="listbox"]').length,
    visibleItems: [...document.querySelectorAll('[role="option"]')].filter(
      (element) => element.getBoundingClientRect().height > 0,
    ).length,
  }));
  await shot(page, "command-open");
  await page.keyboard.type("button");
  await page.waitForTimeout(350);
  const filtered = await page.evaluate(() => ({
    active: document.activeElement?.getAttribute("placeholder") ?? document.activeElement?.tagName,
    visibleItems: [...document.querySelectorAll('[role="option"]')]
      .filter((element) => element.getBoundingClientRect().height > 0)
      .map((element) => ({
        text: element.textContent?.trim().replace(/\s+/g, " "),
        selected: element.getAttribute("aria-selected"),
      }))
      .slice(0, 8),
  }));
  await shot(page, "command-button");
  await page.keyboard.press("Enter");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
  const afterSelect = {
    url: page.url(),
    dialogs: await page.locator('[role="dialog"]').count(),
    active: await page.evaluate(() => ({
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    })),
  };
  log("command", { open, filtered, afterSelect });
});

/* 2. Dialog: open, inspect focus, cycle, close, restore. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/dialog`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /^New run$/ }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.focus();
  const triggerBefore = await page.evaluate(() => document.activeElement?.textContent?.trim());
  await trigger.click();
  await page.waitForTimeout(500);
  const open = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const rect = dialog?.getBoundingClientRect();
    return {
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      dialog: rect
        ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
        : null,
      active: {
        tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute("aria-label"),
        text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 100),
      },
      bodyOverflow: getComputedStyle(document.body).overflow,
      text: dialog?.textContent?.trim().replace(/\s+/g, " ").slice(0, 200),
    };
  });
  await shot(page, "dialog-open");
  const tabOrder = [];
  for (let index = 0; index < 7; index += 1) {
    await page.keyboard.press("Tab");
    tabOrder.push(
      await page.evaluate(() => ({
        tag: document.activeElement?.tagName,
        label: document.activeElement?.getAttribute("aria-label"),
        text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 60),
        inDialog: Boolean(document.activeElement?.closest('[role="dialog"]')),
      })),
    );
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);
  const closed = await page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    active: {
      tag: document.activeElement?.tagName,
      text: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    },
    bodyOverflow: getComputedStyle(document.body).overflow,
  }));
  log("dialog", { triggerBefore, open, tabOrder, closed });
});

/* 3. Select: open, inspect menu geometry and choose by keyboard. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/select`, { waitUntil: "networkidle" });
  const trigger = page.locator('[role="combobox"]').first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.waitForTimeout(350);
  const open = await page.evaluate(() => {
    const trigger = document.querySelector('[role="combobox"]');
    const listbox = document.querySelector('[role="listbox"]');
    const options = [...document.querySelectorAll('[role="option"]')].map((option) => {
      const rect = option.getBoundingClientRect();
      return {
        text: option.textContent?.trim().replace(/\s+/g, " "),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        selected: option.getAttribute("aria-selected"),
      };
    });
    const t = trigger?.getBoundingClientRect();
    const l = listbox?.getBoundingClientRect();
    return {
      trigger: t ? { x: Math.round(t.x), y: Math.round(t.y), width: Math.round(t.width), height: Math.round(t.height) } : null,
      listbox: l ? { x: Math.round(l.x), y: Math.round(l.y), width: Math.round(l.width), height: Math.round(l.height) } : null,
      options,
      active: document.activeElement?.getAttribute("role"),
    };
  });
  await shot(page, "select-open");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(180);
  const highlighted = await page.evaluate(() => ({
    activeText: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    activeId: document.activeElement?.id,
    selected: [...document.querySelectorAll('[role="option"][aria-selected="true"]')].map(
      (option) => option.textContent?.trim().replace(/\s+/g, " "),
    ),
  }));
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  const afterSelect = await page.evaluate(() => ({
    triggerText: document.querySelector('[role="combobox"]')?.textContent?.trim().replace(/\s+/g, " "),
    listboxes: document.querySelectorAll('[role="listbox"]').length,
    active: document.activeElement?.getAttribute("role"),
  }));
  log("select", { open, highlighted, afterSelect });
});

/* 4. Dropdown menu: open, navigate, dismiss, restore. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/menus`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /Run actions/ }).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await page.waitForTimeout(350);
  const open = await page.evaluate(() => ({
    menus: document.querySelectorAll('[role="menu"]').length,
    active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
    items: [...document.querySelectorAll('[role="menuitem"]')].map((item) => {
      const rect = item.getBoundingClientRect();
      return { text: item.textContent?.trim(), height: Math.round(rect.height) };
    }),
  }));
  await shot(page, "menu-open");
  await page.keyboard.press("ArrowDown");
  await page.waitForTimeout(150);
  const afterArrow = await page.evaluate(() => ({
    active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
  }));
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({
    menus: document.querySelectorAll('[role="menu"]').length,
    active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
  }));
  log("menu", { open, afterArrow, closed });
});

/* 5. Tabs: click + arrows. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/tabs`, { waitUntil: "networkidle" });
  const tab = page.getByRole("tab", { name: /Metrics/ }).first();
  await tab.scrollIntoViewIfNeeded();
  await tab.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(300);
  const keyboard = await page.evaluate(() => ({
    active: document.activeElement?.textContent?.trim().replace(/\s+/g, " "),
    selected: [...document.querySelectorAll('[role="tab"][aria-selected="true"]')]
      .slice(0, 5)
      .map((element) => element.textContent?.trim()),
    panel: document.querySelector('[role="tabpanel"]')?.textContent?.trim().replace(/\s+/g, " ").slice(0, 120),
  }));
  await shot(page, "tabs-keyboard");
  log("tabs", { keyboard });
});

/* 6. Form: submit empty, inspect summary and focus. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/forms/validation`, { waitUntil: "networkidle" });
  const save = page.getByRole("button", { name: /Save study/ }).first();
  await save.scrollIntoViewIfNeeded();
  await save.click();
  await page.waitForTimeout(500);
  const invalid = await page.evaluate(() => {
    const alerts = [...document.querySelectorAll('[role="alert"], [aria-live]')]
      .filter((element) => element.getBoundingClientRect().height > 0)
      .map((element) => ({
        role: element.getAttribute("role"),
        live: element.getAttribute("aria-live"),
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 300),
      }));
    const invalidFields = [...document.querySelectorAll('[aria-invalid="true"]')].map((element) => ({
      tag: element.tagName,
      name: element.getAttribute("name"),
      id: element.id,
      label: element.getAttribute("aria-label"),
      describedBy: element.getAttribute("aria-describedby"),
    }));
    const active = document.activeElement;
    const rect = active?.getBoundingClientRect();
    return {
      alerts,
      invalidFields,
      active: {
        tag: active?.tagName,
        id: active?.id,
        name: active?.getAttribute("name"),
        label: active?.getAttribute("aria-label"),
        text: active?.textContent?.trim().replace(/\s+/g, " ").slice(0, 100),
        rect: rect ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) } : null,
      },
    };
  });
  await shot(page, "form-invalid");
  log("form", { invalid });
});

/* 7. Data table overflow + column menu. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/data/table`, { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => {
    const table = document.querySelector("table");
    if (!table) return null;
    let scroller = table.parentElement;
    while (scroller && scroller.scrollWidth <= scroller.clientWidth) scroller = scroller.parentElement;
    const rect = table.getBoundingClientRect();
    const scrollerRect = scroller?.getBoundingClientRect();
    return {
      table: { width: Math.round(rect.width), right: Math.round(rect.right) },
      viewportWidth: document.documentElement.clientWidth,
      scroller: scroller
        ? {
            tag: scroller.tagName,
            className: typeof scroller.className === "string" ? scroller.className.slice(0, 160) : "",
            clientWidth: scroller.clientWidth,
            scrollWidth: scroller.scrollWidth,
            overflowX: getComputedStyle(scroller).overflowX,
            rect: scrollerRect
              ? {
                  x: Math.round(scrollerRect.x),
                  right: Math.round(scrollerRect.right),
                  width: Math.round(scrollerRect.width),
                }
              : null,
          }
        : null,
      headers: [...document.querySelectorAll("thead th")].map((header) =>
        header.textContent?.trim().replace(/\s+/g, " "),
      ),
    };
  });
  await shot(page, "table-default");
  const columns = page.getByRole("button", { name: /Columns/ }).first();
  if (await columns.count()) {
    await columns.click();
    await page.waitForTimeout(300);
    await shot(page, "table-columns-open");
  }
  log("dataTable", { metrics });
});

/* 8. Settings sheet: open, geometry, Escape restore. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/patterns/settings-form`, { waitUntil: "networkidle" });
  const trigger = page.getByRole("button", { name: /Edit settings/ }).first();
  await trigger.click();
  await page.waitForTimeout(500);
  const open = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const rect = dialog?.getBoundingClientRect();
    return {
      dialogs: document.querySelectorAll('[role="dialog"]').length,
      rect: rect
        ? { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) }
        : null,
      active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
      scrollHeight: dialog?.scrollHeight,
      clientHeight: dialog?.clientHeight,
    };
  });
  await shot(page, "sheet-open");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(450);
  const closed = await page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
  }));
  log("sheet", { open, closed });
});

/* 9. Mobile navigation: open, choose a section, verify close + current route. */
await withPage({ width: 390, height: 844 }, async (page) => {
  await page.goto(`${base}/components/buttons`, { waitUntil: "networkidle" });
  const menu = page.getByRole("button", { name: /Open navigation|Menu|Open menu/i }).first();
  const names = await page.getByRole("button").evaluateAll((elements) =>
    elements
      .map((element) => element.getAttribute("aria-label") || element.textContent?.trim())
      .filter(Boolean)
      .slice(0, 30),
  );
  await menu.click();
  await page.waitForTimeout(400);
  const open = await page.evaluate(() => {
    const dialogs = [...document.querySelectorAll('[role="dialog"]')];
    return {
      dialogs: dialogs.length,
      bodyOverflow: getComputedStyle(document.body).overflow,
      active: document.activeElement?.textContent?.trim().replace(/\s+/g, " ").slice(0, 80),
      links: [...document.querySelectorAll('[role="dialog"] a')]
        .slice(0, 12)
        .map((link) => link.textContent?.trim().replace(/\s+/g, " ")),
    };
  });
  await shot(page, "mobile-nav-open");
  const target = page.getByRole("link", { name: /^Select$/ }).last();
  if (await target.count()) {
    await target.click();
    await page.waitForTimeout(900);
  }
  const afterNavigate = await page.evaluate(() => ({
    url: location.href,
    dialogs: document.querySelectorAll('[role="dialog"]').length,
    bodyOverflow: getComputedStyle(document.body).overflow,
  }));
  log("mobileNav", { buttonNames: names, open, afterNavigate });
});

/* 10. Copy feedback: icon and accessible name after activation. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/buttons`, { waitUntil: "networkidle" });
  const copy = page.getByRole("button", { name: /Copy import path/ }).first();
  await copy.scrollIntoViewIfNeeded();
  await copy.click();
  await page.waitForTimeout(250);
  const state = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      label: active?.getAttribute("aria-label"),
      text: active?.textContent?.trim(),
      tooltip: document.querySelector('[role="tooltip"]')?.textContent?.trim(),
      clipboard: navigator.clipboard ? "available" : "unavailable",
    };
  });
  await shot(page, "copy-feedback");
  log("copy", { state });
});

/* 11. Chart hover: tooltip visibility and bounds. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/charts/financial`, { waitUntil: "networkidle" });
  const canvas = page.locator("canvas").first();
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (box) {
    await page.mouse.move(box.x + box.width * 0.55, box.y + box.height * 0.45);
    await page.waitForTimeout(500);
    await shot(page, "chart-hover");
  }
  const tooltip = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll("div")].filter((element) => {
      const style = getComputedStyle(element);
      const text = element.textContent?.trim() ?? "";
      return (
        text.length > 0 &&
        text.length < 500 &&
        (style.position === "absolute" || style.position === "fixed") &&
        style.visibility !== "hidden" &&
        Number(style.opacity) > 0
      );
    });
    return candidates.slice(0, 10).map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        text: element.textContent?.trim().replace(/\s+/g, " ").slice(0, 200),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
        background: getComputedStyle(element).backgroundColor,
        fontSize: getComputedStyle(element).fontSize,
      };
    });
  });
  log("chart", { box, tooltip });
});

/* 12. Light theme + reduced motion: visual state check. */
await withPage({ width: 1440, height: 1000 }, async (page) => {
  await page.goto(`${base}/components/dialog`, { waitUntil: "networkidle" });
  const theme = page.getByRole("radio", { name: /Light/i }).first();
  if (await theme.count()) {
    await theme.click();
  } else {
    const lightButton = page.getByRole("button", { name: /Light/i }).first();
    if (await lightButton.count()) await lightButton.click();
  }
  await page.waitForTimeout(500);
  const themeState = await page.evaluate(() => ({
    htmlClass: document.documentElement.className,
    dataTheme: document.documentElement.dataset.theme,
    background: getComputedStyle(document.body).backgroundColor,
    color: getComputedStyle(document.body).color,
    storage: localStorage.getItem("luc-ui-theme") ?? localStorage.getItem("theme"),
  }));
  await shot(page, "light-dialog", { fullPage: true });
  const reduced = page.getByRole("radio", { name: /Reduced/i }).first();
  if (await reduced.count()) await reduced.click();
  await page.waitForTimeout(300);
  const reducedState = await page.evaluate(() => ({
    dataMotion: document.documentElement.dataset.motion,
  }));
  log("theme", { themeState, reducedState });
});

await writeFile(path.join(out, "report.json"), JSON.stringify(results, null, 2));
console.log(`Wrote ${path.join(out, "report.json")}`);
await browser.close();
