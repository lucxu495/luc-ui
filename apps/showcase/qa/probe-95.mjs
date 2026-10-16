/**
 * Phase 9.5 diagnostic probe.
 *
 * A read-only measuring tool for the defects the user reported after
 * inspecting the deployed Showcase:
 *
 *   width     how much horizontal space a route actually uses, and whether the
 *             document overflows its own viewport
 *   sheet     panel geometry at every stage of a Sheet's enter/exit animation,
 *             in all four directions
 *   stable    whether a document scroll position survives a Playground control
 *             change, and whether unrelated sections move
 *   navclip   which elements inside a named element overflow their own box
 *
 * It asserts nothing. It prints numbers so the fix is chosen from evidence
 * rather than from a guess, and so the same numbers can be compared before and
 * after. The regression guards live in `qa/geometry.mjs` and `qa/behaviour.mjs`.
 *
 *   node qa/probe-95.mjs width --routes=/components/button,/charts/line
 *   node qa/probe-95.mjs sheet --route=/components/sheet
 *   node qa/probe-95.mjs stable --route=/motion/kinetic
 *   node qa/probe-95.mjs navclip --route=/application/navigation
 */

import path from "node:path";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { navigateAndReady } from "./readiness.mjs";

const BASE_URL = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, "../../..");

const VIEWPORTS = {
  "390": { width: 390, height: 844 },
  "768": { width: 768, height: 1024 },
  "1280": { width: 1280, height: 800 },
  "1440": { width: 1440, height: 900 },
  "1920": { width: 1920, height: 1080 },
  "2560": { width: 2560, height: 1440 },
};

function argOf(name, fallback) {
  const hit = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

function listOf(name, fallback) {
  const raw = argOf(name, "");
  return raw ? raw.split(",").map((entry) => entry.trim()).filter(Boolean) : fallback;
}

/** Every width a single document can be measured at, in one navigation. */
async function measureWidths(page, route, sizes) {
  const out = [];
  for (const key of sizes) {
    const viewport = VIEWPORTS[key];
    if (!viewport) throw new Error(`[probe-95] Unknown viewport "${key}"`);
    /*
     * Load *at* the size rather than resizing into it. A chart sizes its canvas
     * from its container on mount and then follows a throttled ResizeObserver,
     * so measuring a resized page reads the previous geometry and invents
     * overflow that a visitor who actually arrives at that width never sees.
     */
    await page.setViewportSize(viewport);
    await navigateAndReady(page, `${BASE_URL}${route}`);
    const metrics = await page.evaluate(() => {
      const html = document.documentElement;
      const main = document.querySelector("main") ?? document.body;
      const container = document.querySelector('[data-slot="container"]');
      const demo = document.querySelector('[data-slot="demo"]');
      const playground = document.querySelector('[data-slot="playground"]');
      const rect = (node) => {
        if (!node) return null;
        const box = node.getBoundingClientRect();
        return {
          left: Math.round(box.left),
          right: Math.round(box.right),
          width: Math.round(box.width),
        };
      };
      return {
        viewport: window.innerWidth,
        scrollWidth: html.scrollWidth,
        overflowX: html.scrollWidth - html.clientWidth,
        main: rect(main),
        container: rect(container),
        demo: rect(demo),
        playground: rect(playground),
      };
    });
    out.push({ size: key, ...metrics });
  }
  return out;
}

/** Open one sheet by direction and watch where its panel actually is. */
async function measureSheet(page, route, direction) {
  /* The demo opens each edge from a button labelled with the edge name. */
  const trigger = page.getByRole("button", { name: new RegExp(`^${direction}$`, "i") });
  await trigger.first().click();
  const panel = page.locator('[data-slot="sheet"]');
  await panel.waitFor({ state: "visible" });

  const stages = [];
  const sample = async (label) => {
    const geometry = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[data-slot="sheet"]'));
      const overlays = Array.from(document.querySelectorAll('[data-slot="sheet-overlay"]'));
      return {
        panels: nodes.map((node) => {
          const box = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return {
            className: node.className,
            state: node.getAttribute("data-state"),
            side: node.getAttribute("data-side"),
            top: Math.round(box.top),
            left: Math.round(box.left),
            width: Math.round(box.width),
            height: Math.round(box.height),
            transform: style.transform,
            animation: style.animationName,
            visibility: style.visibility,
          };
        }),
        overlays: overlays.length,
        scrollLocked: document.body.hasAttribute("data-scroll-locked") ||
          document.body.style.pointerEvents === "none" ||
          getComputedStyle(document.body).overflow !== "visible",
      };
    });
    stages.push({ label, ...geometry });
  };

  await sample("opened");
  await page.keyboard.press("Escape");
  /* Sample during the exit animation, not after it. */
  await page.waitForTimeout(90);
  await sample("exiting");
  await page.waitForTimeout(600);
  await sample("closed");
  return { direction, stages };
}

/**
 * Does driving a Playground move the document?
 *
 * The measurement is deliberately taken around the *stage* rather than around
 * the whole document: a control that legitimately re-renders a taller chart may
 * change the document height, but nothing outside the stage is allowed to move,
 * and the reader must not be scrolled somewhere they did not ask to go.
 */
async function measureStability(page) {
  const snapshot = () =>
    page.evaluate(() => {
      const html = document.documentElement;
      const stage = document.querySelector('[data-slot="playground-stage"]') ??
        document.querySelector('[data-slot="playground"]');
      const controls = document.querySelector('[data-slot="playground-controls"]') ??
        document.querySelector('[data-slot="playground"]');
      const aside = document.querySelector('[data-slot="page-outline"]') ?? document.querySelector("aside");
      const box = (node) => {
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          top: Math.round(rect.top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      };
      return {
        scrollY: Math.round(window.scrollY),
        scrollX: Math.round(window.scrollX),
        scrollWidth: html.scrollWidth,
        clientWidth: html.clientWidth,
        documentHeight: html.scrollHeight,
        stage: box(stage),
        controls: box(controls),
        aside: box(aside),
      };
    });

  const anchor = page.locator('[data-slot="playground"]').first();
  if ((await anchor.count()) === 0) return { playground: false, steps: [] };
  await anchor.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -160));

  const scope = page.locator('[data-slot="playground"]').first();
  const steps = [];
  const drive = async (label, run) => {
    const before = await snapshot();
    await run();
    await page.evaluate(
      () =>
        new Promise((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 260))),
        ),
    );
    const after = await snapshot();
    steps.push({
      label,
      deltaScrollY: after.scrollY - before.scrollY,
      deltaScrollX: after.scrollX - before.scrollX,
      deltaStageTop: (after.stage?.top ?? 0) - (before.stage?.top ?? 0),
      deltaStageLeft: (after.stage?.left ?? 0) - (before.stage?.left ?? 0),
      deltaStageWidth: (after.stage?.width ?? 0) - (before.stage?.width ?? 0),
      deltaStageHeight: (after.stage?.height ?? 0) - (before.stage?.height ?? 0),
      deltaControlsLeft: (after.controls?.left ?? 0) - (before.controls?.left ?? 0),
      deltaAsideTop: (after.aside?.top ?? 0) - (before.aside?.top ?? 0),
      overflowX: after.scrollWidth - after.clientWidth,
    });
  };

  const ranges = scope.locator('input[type="range"]');
  for (let index = 0; index < (await ranges.count()); index += 1) {
    const range = ranges.nth(index);
    await drive(`range#${index}`, async () => {
      await range.focus();
      await page.keyboard.press("ArrowRight");
      await page.keyboard.press("ArrowRight");
    });
  }
  const checks = scope.locator('input[type="checkbox"], [role="switch"]');
  for (let index = 0; index < (await checks.count()); index += 1) {
    const box = checks.nth(index);
    await drive(`toggle#${index}`, async () => {
      await box.click({ force: true });
    });
  }
  const segments = scope.locator('[role="tab"], [role="radio"]');
  for (let index = 0; index < (await segments.count()); index += 1) {
    const segment = segments.nth(index);
    await drive(`segment#${index}`, async () => {
      await segment.click({ force: true });
    });
  }
  return { playground: true, steps };
}

/** Which descendants stick out of their nearest clipping ancestor? */
/** Everything on the page that sticks past the right edge of the viewport. */
async function measureViewportOverflow(page) {
  return page.evaluate(() => {
    const limit = document.documentElement.clientWidth;
    /*
     * Only elements that can actually widen the document count. Anything
     * inside a scrolling or clipping ancestor is already bounded by it — the
     * `<code>` inside a `<pre>` is wider than the screen on purpose and would
     * otherwise be reported as the cause of an overflow it does not cause.
     */
    const bounded = (node) => {
      let current = node.parentElement;
      while (current && current !== document.body) {
        if (getComputedStyle(current).overflowX !== "visible") return true;
        current = current.parentElement;
      }
      return false;
    };
    const rows = [];
    for (const node of document.body.querySelectorAll("*")) {
      const box = node.getBoundingClientRect();
      if (box.right <= limit + 1 && box.left >= -1) continue;
      if (bounded(node)) continue;
      rows.push({
        node,
        tag: node.tagName.toLowerCase(),
        slot: node.getAttribute("data-slot") ?? "",
        className: typeof node.className === "string" ? node.className.slice(0, 90) : "",
        left: Math.round(box.left),
        right: Math.round(box.right),
        width: Math.round(box.width),
        scrollWidth: node.scrollWidth,
        text: (node.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 40),
      });
    }
    rows.sort((a, b) => b.right - a.right);
    /*
     * The ancestor chain of the widest offender.
     *
     * An element sticking out is a symptom; the width that has to be fixed is
     * the first ancestor whose box is already too wide, and printing the chain
     * is how that one is picked out instead of guessed at.
     */
    const chain = [];
    {
      let node = rows[0]?.node ?? null;
      while (node && node !== document.documentElement.parentElement) {
        const box = node.getBoundingClientRect();
        chain.push(
          `${node.tagName.toLowerCase()}${node.getAttribute("data-slot") ? `[${node.getAttribute("data-slot")}]` : ""} ` +
            `${Math.round(box.width)}px minW=${getComputedStyle(node).minWidth} overflowX=${getComputedStyle(node).overflowX}`,
        );
        node = node.parentElement;
      }
    }
    return {
      limit,
      scrollWidth: document.documentElement.scrollWidth,
      rows: rows.slice(0, 30).map(({ node: _node, ...rest }) => rest),
      chain,
    };
  });
}

async function measureClipping(page, selector) {
  return page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return { found: false, offenders: [] };
    const offenders = [];
    const rootBox = root.getBoundingClientRect();
    for (const node of root.querySelectorAll("*")) {
      const box = node.getBoundingClientRect();
      const style = getComputedStyle(node);
      const clippedBy = ["auto", "hidden", "scroll", "clip"].includes(style.overflowX) ||
        ["auto", "hidden", "scroll", "clip"].includes(style.overflowY);
      const overflows = box.right > rootBox.right + 1 || box.left < rootBox.left - 1;
      /*
       * Count only the element that actually causes the document to scroll: a
       * node whose own box sticks out *and* whose ancestor chain has not
       * already bounded it. Reporting every descendant of a wide row would
       * bury the one element worth fixing.
       */
      if (overflows && !clippedBy && !hasScrollingAncestor(node, root)) {
        offenders.push({
          tag: node.tagName.toLowerCase(),
          slot: node.getAttribute("data-slot") ?? "",
          className: typeof node.className === "string" ? node.className.slice(0, 120) : "",
          left: Math.round(box.left),
          right: Math.round(box.right),
          width: Math.round(box.width),
          text: (node.textContent ?? "").trim().slice(0, 60),
        });
      }
    }
    return {
      found: true,
      root: { left: Math.round(rootBox.left), right: Math.round(rootBox.right) },
      rootScrollWidth: root.scrollWidth,
      rootClientWidth: root.clientWidth,
      rootOverflowX: getComputedStyle(root).overflowX,
      documentScrollWidth: document.documentElement.scrollWidth,
      offenders: offenders.slice(0, 25),
    };

    function hasScrollingAncestor(node, stopAt) {
      let current = node.parentElement;
      while (current && current !== stopAt.parentElement) {
        const overflowX = getComputedStyle(current).overflowX;
        if (["auto", "hidden", "scroll", "clip"].includes(overflowX)) return true;
        current = current.parentElement;
      }
      return false;
    }
  }, selector);
}

async function main() {
  const mode = process.argv[2] ?? "width";
  const route = argOf("route", "/");
  const sizes = listOf("sizes", ["390", "768", "1280", "1440", "1920", "2560"]);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORTS["1440"], deviceScaleFactor: 1 });
  page.on("pageerror", (error) => console.log("pageerror:", error.message));

  try {
    await navigateAndReady(page, `${BASE_URL}${route}`);

    if (mode === "width") {
      for (const target of listOf("routes", [route])) {
        if (target !== route) await navigateAndReady(page, `${BASE_URL}${target}`);
        const rows = await measureWidths(page, target, sizes);
        console.log(`\n## ${target}`);
        for (const row of rows) {
          const used = row.container ? `${row.container.width}px used, main ${row.main?.width}px` : `main ${row.main?.width}px`;
          console.log(
            `  ${row.size.padEnd(5)} vp=${String(row.viewport).padEnd(5)} ${used.padEnd(34)} demo=${String(row.demo?.width ?? "-").padEnd(6)} overflowX=${row.overflowX}`,
          );
        }
      }
    } else if (mode === "shots") {
      const outDir = path.resolve(PACKAGE_ROOT, argOf("out", "docs/audits/phase-9-5/evidence"));
      await mkdir(outDir, { recursive: true });
      const label = argOf("label", "shot");
      const fullPage = argOf("full", "1") !== "0";
      for (const target of listOf("routes", [route])) {
        for (const key of sizes) {
          await page.setViewportSize(VIEWPORTS[key]);
          /* Load at the size: a resize would screenshot a chart that has not
           * followed its container yet. */
          await navigateAndReady(page, `${BASE_URL}${target}`);
          await page.evaluate(
            () =>
              new Promise((resolve) =>
                requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 350))),
              ),
          );
          const name = `${label}-${target.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}-${key}.png`;
          const file = path.join(outDir, name);
          await page.screenshot({ path: file, fullPage });
          console.log("shot", file);
        }
      }
    } else if (mode === "sheet") {
      for (const direction of listOf("directions", ["top", "right", "bottom", "left"])) {
        const result = await measureSheet(page, route, direction);
        console.log(`\n## ${route} — ${direction}`);
        for (const stage of result.stages) {
          const panel = stage.panels[0];
          console.log(
            `  ${stage.label.padEnd(8)} panels=${stage.panels.length} overlays=${stage.overlays} state=${panel?.state ?? "-"} top=${panel?.top} left=${panel?.left} w=${panel?.width} h=${panel?.height} transform=${panel?.transform} anim=${panel?.animation}`,
          );
        }
      }
    } else if (mode === "stable") {
      console.log(JSON.stringify(await measureStability(page), null, 1));
    } else if (mode === "navclip") {
      const vp = argOf("vp", "1440");
      if (VIEWPORTS[vp]) await page.setViewportSize(VIEWPORTS[vp]);
      const selector = argOf("selector", '[data-slot="container"]');
      console.log(JSON.stringify(await measureClipping(page, selector), null, 1));
    } else if (mode === "overflow") {
      const vp = argOf("vp", "1440");
      if (VIEWPORTS[vp]) await page.setViewportSize(VIEWPORTS[vp]);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      console.log(JSON.stringify(await measureViewportOverflow(page), null, 1));
    } else {
      throw new Error(`[probe-95] Unknown mode "${mode}"`);
    }
  } finally {
    await browser.close();
  }
}

await main();
