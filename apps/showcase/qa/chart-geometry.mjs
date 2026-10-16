/**
 * Phase 7C — rendered-output verification for every public chart.
 *
 * The existing chart smoke check asks whether a `<canvas>` exists and is larger
 * than 20 px. A chart that throws inside its own `renderItem`, receives a shape
 * it cannot fold, or projects its geometry outside the clip rect still produces
 * a correctly sized, completely blank canvas — which is exactly the failure the
 * previous phases shipped three times.
 *
 * So this probe reads the pixels. For every plot it reports:
 *
 *   inkRatio    fraction of plot pixels that differ from the modal background
 *   inkBox      bounding box of the ink, as a fraction of the plot
 *   colors      number of distinct quantised colours (1 == a flat fill)
 *   bands       ink present in the axis margins (bottom strip, left strip)
 *   marks       rendered SVG marks, for the charts that draw with SVG
 *
 * A plot fails when it has no ink, when the ink is a single flat colour, when
 * the ink box is implausibly thin, or when the axis margin is empty — the four
 * signatures of "the canvas exists and says nothing".
 *
 * It also probes the container: a plot whose host has a scrollWidth greater
 * than its clientWidth is clipped, and clipping is how a chart ends up with a
 * cut-off axis that no assertion above would notice.
 *
 *   node qa/chart-geometry.mjs
 *   node qa/chart-geometry.mjs --routes=charts-surfaces --json=out.json
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

import { DESKTOP } from "./constants.mjs";
import { parseOptions } from "./config.mjs";
import { navigateAndReady, readThrough } from "./readiness.mjs";
import { ROUTES, selectRoutes, slugsInGroup } from "./routes.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");

/** Thresholds. Deliberately loose: a sparse scatter is still not a blank plot. */
export const INK_MIN = 0.004;
export const COLORS_MIN = 3;
export const INK_SPAN_MIN = 0.15;

function plotProbeSource() {
  /** Runs in the page. */
  const quantise = (value) => Math.round(value / 8) * 8;

  /** Per-canvas raw read, reused by both the per-layer report and the composite. */
  function readCanvas(canvas) {
    const width = canvas.width;
    const height = canvas.height;
    if (!width || !height) return { error: "zero-size canvas", width, height };
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return { error: "no 2d context", width, height };
    let data;
    try {
      data = context.getImageData(0, 0, width, height).data;
    } catch (error) {
      return { error: `getImageData failed: ${String(error)}`, width, height };
    }
    return { width, height, data };
  }

  function analyseCanvas(canvas) {
    const read = readCanvas(canvas);
    if (read.error) return read;
    const { width, height, data } = read;
    const counts = new Map();
    const total = width * height;
    for (let i = 0; i < total; i += 1) {
      const offset = i * 4;
      const key = `${quantise(data[offset])},${quantise(data[offset + 1])},${quantise(data[offset + 2])},${quantise(data[offset + 3])}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let background = "";
    let backgroundCount = -1;
    for (const [key, count] of counts) {
      if (count > backgroundCount) {
        background = key;
        backgroundCount = count;
      }
    }
    const bg = background.split(",").map(Number);
    let ink = 0;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    /* Axis margins: ECharts paints tick labels and the axis line there, so an
       empty margin means the axis never drew. */
    let bottomInk = 0;
    let leftInk = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        const differs =
          Math.abs(data[offset] - bg[0]) > 12 ||
          Math.abs(data[offset + 1] - bg[1]) > 12 ||
          Math.abs(data[offset + 2] - bg[2]) > 12 ||
          Math.abs(data[offset + 3] - bg[3]) > 12;
        if (!differs) continue;
        ink += 1;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        if (y > height * 0.86) bottomInk += 1;
        if (x < width * 0.12) leftInk += 1;
      }
    }
    const colours = new Set();
    for (const key of counts.keys()) colours.add(key);
    return {
      width,
      height,
      cssWidth: Math.round(canvas.getBoundingClientRect().width),
      cssHeight: Math.round(canvas.getBoundingClientRect().height),
      inkRatio: Number((ink / total).toFixed(5)),
      colors: colours.size,
      inkBox:
        ink === 0
          ? null
          : {
              x: Number((minX / width).toFixed(3)),
              y: Number((minY / height).toFixed(3)),
              w: Number(((maxX - minX + 1) / width).toFixed(3)),
              h: Number(((maxY - minY + 1) / height).toFixed(3)),
            },
      bottomInkRatio: Number((bottomInk / total).toFixed(5)),
      leftInkRatio: Number((leftInk / total).toFixed(5)),
    };
  }

  /**
   * Composite every canvas of one plot into a single ink mask.
   *
   * ECharts and Lightweight Charts both split a chart across canvases by
   * z-level, so a per-canvas measurement answers a question nobody asked: the
   * "blank" canvas is usually an idle crosshair layer. The composite is what a
   * reader sees, and it is what the geometry assertions below run against.
   */
  function composite(canvases) {
    const reads = canvases.map(readCanvas).filter((read) => read.data);
    if (reads.length === 0) return null;
    const width = Math.max(...reads.map((read) => read.width));
    const height = Math.max(...reads.map((read) => read.height));
    /*
     * Paint the layers in order, onto the CSS backdrop behind the plot.
     *
     * Both engines clear their canvases and paint only what they draw, so a
     * region chart's fill arrives as `rgba(255,131,124,0.16)` and everything
     * else is `rgba(0,0,0,0)`. Comparing raw channels against the canvas's own
     * modal colour therefore treats the semi-transparent *fill* as the
     * background — which is exactly how a drawdown whose area covers 55 % of
     * the plot measured 0.4 % ink and failed the blankness check. The backdrop
     * is a real colour (the panel the plot sits on); compositing onto it is
     * what makes "is this pixel painted?" answerable.
     */
    const backdrop = (() => {
      let node = canvases[0]?.parentElement ?? null;
      while (node) {
        const match = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (match) {
          const parts = match[1].split(",").map(Number);
          if (parts.length < 4 || parts[3] > 0.9) return parts.slice(0, 3);
        }
        node = node.parentElement;
      }
      return [0, 0, 0];
    })();
    const buffer = new Float32Array(width * height * 3);
    for (let i = 0; i < width * height; i += 1) {
      buffer[i * 3] = backdrop[0];
      buffer[i * 3 + 1] = backdrop[1];
      buffer[i * 3 + 2] = backdrop[2];
    }
    for (const read of reads) {
      for (let y = 0; y < read.height; y += 1) {
        for (let x = 0; x < read.width; x += 1) {
          const source = (y * read.width + x) * 4;
          const alpha = read.data[source + 3] / 255;
          if (alpha <= 0) continue;
          const target = (y * width + x) * 3;
          buffer[target] = read.data[source] * alpha + buffer[target] * (1 - alpha);
          buffer[target + 1] = read.data[source + 1] * alpha + buffer[target + 1] * (1 - alpha);
          buffer[target + 2] = read.data[source + 2] * alpha + buffer[target + 2] * (1 - alpha);
        }
      }
    }
    const painted = new Uint8Array(width * height * 3);
    for (let i = 0; i < width * height * 3; i += 1) {
      painted[i] = Math.max(0, Math.min(255, Math.round(buffer[i])));
    }
    const histogram = new Map();
    for (let i = 0; i < width * height; i += 1) {
      const key = `${Math.min(255, quantise(painted[i * 3]))},${Math.min(255, quantise(painted[i * 3 + 1]))},${Math.min(255, quantise(painted[i * 3 + 2]))}`;
      histogram.set(key, (histogram.get(key) ?? 0) + 1);
    }
    let background = "";
    let backgroundCount = -1;
    for (const [key, count] of histogram) {
      if (count > backgroundCount) {
        background = key;
        backgroundCount = count;
      }
    }
    const bg = background.split(",").map(Number);
    /*
     * Two masks, for two different questions.
     *
     * `mask` keeps anything that differs measurably from the fill — that is what
     * "did this paint?" needs. The *profile* is a shape measurement, and a shape
     * measurement cannot include the gridlines: they cross every column, so they
     * pin `top` to the topmost gridline and turn an ECDF into a flat line.
     * `strong` keeps pixels that differ by a fifth of the range *and* pass a
     * chroma test, because LUC draws its gridlines light enough on a dark
     * surface to clear any brightness threshold that still keeps a muted series.
     * Gridlines, axis lines and tick labels are neutral; every series carries a
     * tone, so saturation is what separates them.
     */
    const mask = new Uint8Array(width * height);
    const strong = new Uint8Array(width * height);
    const rgb = new Uint8Array(width * height * 3);
    const STRONG = 46;
    for (let i = 0; i < width * height; i += 1) {
      const r = painted[i * 3];
      const g = painted[i * 3 + 1];
      const b = painted[i * 3 + 2];
      const differs = Math.max(Math.abs(r - bg[0]), Math.abs(g - bg[1]), Math.abs(b - bg[2]));
      if (differs > 12) {
        mask[i] = 1;
        rgb[i * 3] = r;
        rgb[i * 3 + 1] = g;
        rgb[i * 3 + 2] = b;
      }
      if (differs > STRONG) {
        const saturation = Math.max(r, g, b) - Math.min(r, g, b);
        const bgSaturation = Math.max(bg[0], bg[1], bg[2]) - Math.min(bg[0], bg[1], bg[2]);
        if (saturation - bgSaturation > 22) strong[i] = 1;
      }
    }
    const BUCKETS = 64;
    const columns = new Array(BUCKETS).fill(0);
    const top = new Array(BUCKETS).fill(-1);
    const bottom = new Array(BUCKETS).fill(-1);
    const rows = new Array(BUCKETS).fill(0);
    let strongInk = 0;
    for (let i = 0; i < strong.length; i += 1) strongInk += strong[i];
    /* A chart drawn entirely in a colour close to its fill (a pale ghost line)
       keeps the weak mask so the profile is still populated. */
    const shape = strongInk > 40 ? strong : mask;
    for (let x = 0; x < width; x += 1) {
      const bucket = Math.min(BUCKETS - 1, Math.floor((x / width) * BUCKETS));
      for (let y = 0; y < height; y += 1) {
        if (!shape[y * width + x]) continue;
        columns[bucket] += 1;
        if (top[bucket] === -1) top[bucket] = Number((y / height).toFixed(4));
        bottom[bucket] = Number((y / height).toFixed(4));
      }
    }
    for (let y = 0; y < height; y += 1) {
      const bucket = Math.min(BUCKETS - 1, Math.floor((y / height) * BUCKETS));
      for (let x = 0; x < width; x += 1) {
        if (shape[y * width + x]) rows[bucket] += 1;
      }
    }
    const bands = (profile) => {
      const max = Math.max(...profile);
      if (max <= 0) return 0;
      const threshold = Math.max(1, max * 0.12);
      let count = 0;
      let open = false;
      for (const value of profile) {
        if (value >= threshold) {
          if (!open) count += 1;
          open = true;
        } else {
          open = false;
        }
      }
      return count;
    };
    let ink = 0;
    for (let i = 0; i < mask.length; i += 1) ink += mask[i];

    /*
     * A coarse luminance grid, for the charts whose *meaning* is a colour
     * scale rather than a shape: a heatmap, a confusion matrix, a calendar.
     * Assertion code can then ask "is the brightest cell the largest value?"
     * instead of only "did anything paint?".
     */
    /*
     * The value stored per cell is the cell's **modal** luminance, not its mean.
     * Every heatmap in the library draws a value label on top of the fill, so a
     * mean would mix the fill with the label's own colour and could rank a
     * bright labelled cell below a dim unlabelled one. The mode is the fill.
     */
    const CELLS = 24;
    const gridLuma = [];
    for (let cy = 0; cy < CELLS; cy += 1) {
      const row = [];
      for (let cx = 0; cx < CELLS; cx += 1) {
        const histogram = new Map();
        let count = 0;
        const x0 = Math.floor((cx / CELLS) * width);
        const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) / CELLS) * width));
        const y0 = Math.floor((cy / CELLS) * height);
        const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) / CELLS) * height));
        for (let y = y0; y < y1 && y < height; y += 1) {
          for (let x = x0; x < x1 && x < width; x += 1) {
            if (!mask[y * width + x]) continue;
            const target = (y * width + x) * 3;
            const luma = 0.2126 * rgb[target] + 0.7152 * rgb[target + 1] + 0.0722 * rgb[target + 2];
            const bucket = Math.round(luma / 4) * 4;
            histogram.set(bucket, (histogram.get(bucket) ?? 0) + 1);
            count += 1;
          }
        }
        let mode = 0;
        let modeCount = -1;
        for (const [luma, hits] of histogram) {
          if (hits > modeCount || (hits === modeCount && luma > mode)) {
            mode = luma;
            modeCount = hits;
          }
        }
        row.push(count === 0 ? -1 : mode);
      }
      gridLuma.push(row);
    }
    return {
      width,
      height,
      layers: reads.length,
      inkRatio: Number((ink / (width * height)).toFixed(5)),
      columns,
      top,
      bottom,
      rows,
      columnBands: bands(columns),
      rowBands: bands(rows),
      shape: shape === strong ? "strong" : "weak",
      gridLuma,
    };
  }

  /*
   * A plot host is either the standard plot box (`ChartPlot`, what the chart
   * pages and `ChartBox` produce) or — when a caller composes its own chrome —
   * the engine surface itself. The old selector only knew the first shape, so a
   * chart rendered inside a product's own Card was invisible to this probe:
   * `/experiences/vertical/science` reported `plots=0` while two charts were on
   * screen and painting. A surface whose nearest plot-box ancestor exists is
   * attributed to that ancestor, so nothing is counted twice.
   */
  const hosts = [];
  for (const surface of document.querySelectorAll(
    '[data-slot="echart-surface"], [data-slot="n-surface"]',
  )) {
    const box = surface.closest('[data-slot="chart-plot"]');
    if (box) {
      if (!hosts.includes(box)) hosts.push(box);
    } else {
      hosts.push(surface);
    }
  }
  for (const box of document.querySelectorAll('[data-slot="chart-plot"]')) {
    if (!hosts.includes(box)) hosts.push(box);
  }

  return hosts.map((plot, index) => {
    const rect = plot.getBoundingClientRect();
    const canvases = Array.from(plot.querySelectorAll("canvas"));
    const svgs = Array.from(plot.querySelectorAll("svg"));
    const card = plot.closest('[data-slot="chart-card"]');
    const title = card?.querySelector('[data-slot="chart-header"]')?.textContent?.trim().slice(0, 80) ?? "";
    return {
      index,
      title,
      cssWidth: Math.round(rect.width),
      cssHeight: Math.round(rect.height),
      clippedX: plot.scrollWidth - plot.clientWidth,
      clippedY: plot.scrollHeight - plot.clientHeight,
      canvases: canvases.map(analyseCanvas),
      composite: composite(canvases),
      svg: svgs.map((svg) => ({
        marks:
          svg.querySelectorAll("path, polygon, polyline, line, rect, circle, ellipse").length,
        labels: svg.querySelectorAll("text").length,
      })),
      /* Any text the chart engine writes into the DOM (legend, empty state). */
      text: (plot.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 160),
    };
  });
}

/**
 * A plot is judged as a whole, not canvas by canvas.
 *
 * Both engines split a chart across several canvases by z-level: ECharts puts
 * the series, the axis lines and the tooltip layer on separate elements, and
 * Lightweight Charts keeps a permanently transparent overlay canvas for the
 * crosshair. Measuring each canvas alone therefore reports the *idle overlay*
 * as a blank chart. The question that matters is whether the plot, taken
 * together, has painted anything at all.
 */
function verdict(plot) {
  const reasons = [];
  const warnings = [];
  const canvases = (plot.canvases ?? []).filter((canvas) => !canvas.error);
  const errors = (plot.canvases ?? []).filter((canvas) => canvas.error);
  const svgMarks = (plot.svg ?? []).reduce((sum, entry) => sum + entry.marks, 0);
  const composite = plot.composite;

  if (canvases.length === 0 && svgMarks === 0) {
    reasons.push("no canvas and no svg marks");
    return { reasons, warnings };
  }
  for (const canvas of errors) reasons.push(canvas.error);

  /*
   * The verdict is taken on the composite: what a reader actually sees. Both
   * engines split a chart across canvases by z-level, so a per-canvas floor
   * would fail an idle crosshair layer on every Lightweight Charts plot.
   */
  const bestColors = canvases.reduce((max, canvas) => Math.max(max, canvas.colors), 0);

  if (svgMarks === 0) {
    if (!composite) reasons.push("no readable canvas");
    else if (composite.inkRatio < INK_MIN) reasons.push(`composite ink ${composite.inkRatio} < ${INK_MIN}`);
    if (bestColors < COLORS_MIN) reasons.push(`no canvas has structure (best ${bestColors} colors < ${COLORS_MIN})`);
  }
  if (plot.clippedX > 2) reasons.push(`plot clipped horizontally by ${plot.clippedX}px`);
  if (plot.clippedY > 2) reasons.push(`plot clipped vertically by ${plot.clippedY}px`);
  if (!plot.cssWidth || !plot.cssHeight) reasons.push("plot has no layout box");

  const inked = canvases.filter((canvas) => canvas.inkRatio >= INK_MIN);
  for (const canvas of inked) {
    if (canvas.inkBox && Math.min(canvas.inkBox.w, canvas.inkBox.h) < INK_SPAN_MIN && canvas.width > 200) {
      warnings.push(`canvas ${canvas.width}×${canvas.height} ink box ${canvas.inkBox.w}×${canvas.inkBox.h}`);
    }
  }
  if (
    composite &&
    composite.inkRatio >= INK_MIN &&
    inked.length > 0 &&
    inked.every((canvas) => canvas.bottomInkRatio === 0 && canvas.leftInkRatio === 0)
  ) {
    warnings.push("no ink in either axis margin");
  }
  return { reasons, warnings };
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const jsonArg = process.argv.find((entry) => entry.startsWith("--json="));
  const selected = options.slugs.length
    ? options.slugs
    : options.routeGroups.length
      ? options.routeGroups.flatMap((group) => slugsInGroup(group))
      : ROUTES.filter((route) => route.groups.includes("charts")).map((route) => route.slug);
  const routes = selectRoutes(selected);

  const browser = await chromium.launch();
  const report = [];
  let failures = 0;
  for (const route of routes) {
    const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const consoleProblems = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleProblems.push(message.text());
    });
    page.on("pageerror", (error) => consoleProblems.push(`pageerror: ${error.message}`));
    try {
      await navigateAndReady(page, `${options.baseUrl}${route.path}`);
      await readThrough(page, { stepDelayMs: 50, tailMs: 400, endMs: 150 });
      /* Chart engines animate in; the settle below is what makes the pixels
         stable enough for a deterministic ink measurement. */
      await page.waitForTimeout(900);
      const plots = await page.evaluate(plotProbeSource);
      const entries = plots.map((plot) => ({ ...plot, ...verdict(plot) }));
      const bad = entries.filter((entry) => entry.reasons.length > 0);
      failures += bad.length;
      const warned = entries.filter((entry) => entry.warnings.length > 0);
      report.push({ slug: route.slug, path: route.path, consoleProblems, plots: entries });
      console.log(
        `  ${route.slug.padEnd(28)} plots=${String(entries.length).padStart(2)} ${
          bad.length ? `FAIL ${bad.map((entry) => `#${entry.index}: ${entry.reasons.join("; ")}`).join(" | ")}` : "ok"
        }${
          warned.length ? ` WARN ${warned.map((entry) => `#${entry.index}: ${entry.warnings.join("; ")}`).join(" | ")}` : ""
        }${consoleProblems.length ? ` console=${JSON.stringify(consoleProblems.slice(0, 2))}` : ""}`,
      );
    } catch (error) {
      failures += 1;
      report.push({ slug: route.slug, path: route.path, error: String(error) });
      console.log(`  ${route.slug.padEnd(28)} ERROR ${error}`);
    } finally {
      await context.close();
    }
  }
  await browser.close();

  const dir = path.join(packageRoot, "artifacts/qa/inspect");
  await mkdir(dir, { recursive: true });
  const file = jsonArg ? path.resolve(packageRoot, jsonArg.slice("--json=".length)) : path.join(dir, "chart-geometry.json");
  await writeFile(file, JSON.stringify(report, null, 2));
  const totalPlots = report.reduce((sum, entry) => sum + (entry.plots?.length ?? 0), 0);
  console.log(`\nplots ${totalPlots} · failing ${failures} · report ${path.relative(packageRoot, file)}`);
  process.exitCode = failures > 0 ? 1 : 0;
}

await main();
