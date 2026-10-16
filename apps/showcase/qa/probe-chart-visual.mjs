/**
 * Visual-correctness probe for one chart page.
 *
 * Phase 10A.1 exists because five hundred screenshots passed while a person could
 * see broken charts. This probe is the instrument that closes that gap: it captures
 * the *chart* rather than the page, and it measures what the renderer actually
 * produced — canvas size, the number of drawn marks (by sampling the bitmap, not by
 * trusting the DOM), ink coverage, and the geometry of every label the adapter
 * emitted.
 *
 *   node qa/probe-chart-visual.mjs --route=/charts/gantt-chart [--out=artifacts/chart-review]
 *                                 [--width=1440] [--theme=dark] [--lang=en]
 *
 * It is a *measuring device*, not an assertion: the numbers it prints are what a
 * reviewer reasons about, and what the report in `docs/audits/phase-10a-1/` quotes.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { navigateAndReady } from "./readiness.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const showcaseRoot = path.resolve(here, "..");

function arg(name, fallback) {
  const hit = process.argv.find((entry) => entry.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

const route = arg("route", "/charts/gantt-chart");
const width = Number.parseInt(arg("width", "1440"), 10);
const theme = arg("theme", "dark");
const lang = arg("lang", "en");
const outDir = path.resolve(showcaseRoot, arg("out", "artifacts/chart-review"));
const baseUrl = process.env.LUC_QA_BASE_URL ?? "http://127.0.0.1:3000";

await mkdir(outDir, { recursive: true });

const slug = `${route.replace(/^\/+/, "").replace(/[^a-z0-9]+/gi, "-")}-${theme}-${width}${lang === "zh" ? "-zh" : ""}`;
const pageUrl = `${baseUrl}${lang === "zh" ? "/zh" : ""}${route}`;

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width, height: Math.max(900, Math.round(width * 0.62)) },
  deviceScaleFactor: 1,
});
/*
 * The theme is chosen before the app boots: `lucThemeInitScript` reads the stored
 * choice (or the media query) on the first paint, so setting it afterwards would
 * capture a chart the visitor never sees.
 */
await context.addInitScript((value) => {
  window.localStorage.setItem("luc-ui:theme", value);
}, theme);
const page = await context.newPage();
await navigateAndReady(page, pageUrl, { allowProviderTimeout: true });

/* The first Demo stage on a chart page is the chart itself. */
const stage = page.locator('[data-slot="demo"]').first();
await stage.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);

const measurement = await stage.evaluate((node) => {
  const canvas = node.querySelector("canvas");
  const svg = node.querySelector("svg");
  const labelNodes = Array.from(node.querySelectorAll("text, .luc-chart-label"));
  const labels = labelNodes.map((element) => {
    const box = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      text: (element.textContent ?? "").trim().slice(0, 48),
      x: Math.round(box.x),
      y: Math.round(box.y),
      w: Math.round(box.width),
      h: Math.round(box.height),
      rx: Math.round(box.right),
      by: Math.round(box.bottom),
      size: Number.parseFloat(style.fontSize || "0"),
    };
  });
  /*
   * Label collisions, measured rather than eyeballed.
   *
   * The user's reports for the sunburst, the hierarchy tree, the historical
   * position and the calendar legend are all "labels overlap". A pair of rectangles
   * that intersect by more than a couple of pixels is that defect in numbers — and
   * it is the metric that decides whether a fix worked.
   */
  const overlaps = [];
  const visible = labels.filter((label) => label.w > 0 && label.h > 0 && label.text);
  for (let i = 0; i < visible.length; i += 1) {
    for (let j = i + 1; j < visible.length; j += 1) {
      const a = visible[i];
      const b = visible[j];
      const dx = Math.min(a.rx, b.rx) - Math.max(a.x, b.x);
      const dy = Math.min(a.by, b.by) - Math.max(a.y, b.y);
      if (dx <= 1 || dy <= 1) continue;
      overlaps.push({ a: a.text, b: b.text, area: Math.round(dx * dy) });
    }
  }
  const paths = node.querySelectorAll("path").length;
  const stageBox = node.getBoundingClientRect();
  return {
    stage: {
      w: Math.round(stageBox.width),
      h: Math.round(stageBox.height),
    },
    canvas: canvas
      ? {
          cssW: Math.round(canvas.getBoundingClientRect().width),
          cssH: Math.round(canvas.getBoundingClientRect().height),
          bitmapW: canvas.width,
          bitmapH: canvas.height,
        }
      : null,
    svg: svg
      ? {
          cssW: Math.round(svg.getBoundingClientRect().width),
          cssH: Math.round(svg.getBoundingClientRect().height),
          nodes: svg.querySelectorAll("path, rect, circle, line, polyline, polygon").length,
        }
      : null,
    paths,
    labels,
    labelCount: visible.length,
    labelOverlaps: overlaps.sort((a, b) => b.area - a.area).slice(0, 8),
    overlapCount: overlaps.length,
    smallestLabelPx: visible.length ? Math.min(...visible.map((label) => label.size || 0)) : null,
    /* A label outside the stage is clipped by the frame — the hierarchy-tree report. */
    clippedLabels: visible.filter(
      (label) =>
        label.x < stageBox.x - 1 ||
        label.rx > stageBox.right + 1 ||
        label.y < stageBox.y - 1 ||
        label.by > stageBox.bottom + 1,
    ).length,
    overflowX: node.scrollWidth - node.clientWidth,
  };
});

/*
 * The renderer's own digest.
 *
 * A canvas chart's labels are pixels, so DOM queries see nothing and a bitmap read
 * can come back cleared (the browser is free to drop a committed frame). The
 * digest published by `EChartSurface` is the reliable reading: mark counts by kind
 * and the screen-space box of every text item the engine drew.
 */
const diagnostics = await stage.evaluate((node) => {
  const surface = node.querySelector("[data-luc-chart-diagnostics]");
  const raw = surface?.getAttribute("data-luc-chart-diagnostics");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
});

/** Overlaps and clipping, measured on the engine's own text geometry. */
function analyseTexts(texts) {
  let overlaps = 0;
  const worst = [];
  for (let i = 0; i < texts.length; i += 1) {
    for (let j = i + 1; j < texts.length; j += 1) {
      const a = texts[i];
      const b = texts[j];
      const dx = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const dy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
      if (dx <= 1 || dy <= 1) continue;
      overlaps += 1;
      if (worst.length < 6) {
        worst.push({ a: a.t, b: b.t, area: Math.round(dx * dy) });
      }
    }
  }
  return { overlaps, worst: worst.sort((x, y) => y.area - x.area) };
}

const text = diagnostics?.texts ?? [];
const textReport = analyseTexts(text);
const textSummary = {
  texts: text.length,
  dropped: diagnostics?.dropped ?? null,
  overlaps: textReport.overlaps,
  worstOverlaps: textReport.worst,
  /** Text items that the engine placed outside the chart's own box. */
  outside: text.filter((item) => item.x < -1 || item.y < -1 || item.x + item.w > 2000).length,
  marksTotal: diagnostics?.m ?? null,
  marks: diagnostics?.marks ?? null,
  shortest: text.length ? text.reduce((min, item) => Math.min(min, item.w), Infinity) : null,
};

/*
 * Ink analysis from the bitmap.
 *
 * A chart can render a canvas of the right size and still contain nothing — that is
 * exactly the Gantt report ("task names visible, bars missing"). Counting non-
 * background pixels and finding the bounding box of the marks is a crude measure,
 * and it is the crude measure that separates "drew something" from "drew the frame".
 */
const ink = await stage.evaluate((node) => {
  const canvas = node.querySelector("canvas");
  if (!canvas) return null;
  const context2d = canvas.getContext("2d", { willReadFrequently: true });
  if (!context2d) return null;
  const { width: w, height: h } = canvas;
  const data = context2d.getImageData(0, 0, w, h).data;
  /* The corner pixel is the background: ECharts paints an opaque surface. */
  const bg = [data[0], data[1], data[2]];
  let count = 0;
  let minX = w;
  let maxX = 0;
  let minY = h;
  let maxY = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const index = (y * w + x) * 4;
      const alpha = data[index + 3];
      if (alpha < 8) continue;
      const distance =
        Math.abs(data[index] - bg[0]) + Math.abs(data[index + 1] - bg[1]) + Math.abs(data[index + 2] - bg[2]);
      if (distance < 24) continue;
      count += 1;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const sampled = Math.ceil(w / 2) * Math.ceil(h / 2);
  return {
    inkRatio: Number((count / sampled).toFixed(4)),
    bounds: count ? { minX, minY, maxX, maxY } : null,
  };
});

const shot = path.join(outDir, `${slug}.png`);
await stage.screenshot({ path: shot });

const summary = {
  route,
  url: pageUrl,
  viewport: { width, theme, lang },
  ...measurement,
  ink,
  renderer: textSummary,
  screenshot: path.relative(showcaseRoot, shot),
};

await writeFile(path.join(outDir, `${slug}.json`), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary, null, 2));

await browser.close();
