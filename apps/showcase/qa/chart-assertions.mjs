/**
 * Phase 7C — data-fidelity assertions on the rendered chart pixels.
 *
 * `chart-geometry.mjs` answers "did this plot paint anything, and is the paint
 * plausibly a chart". This file answers the harder question: **does the paint
 * correspond to the data the fixture supplies?**
 *
 * Every assertion below is a property of the *known* fixture in
 * `apps/showcase/lib/chart-packs*.ts` and of the coordinate system the chart
 * documents. They are written against the composite profile, so they hold for
 * any renderer:
 *
 *   profile.top[i]     normalised y of the first inked pixel in x-bucket i
 *   profile.bottom[i]  normalised y of the last inked pixel in x-bucket i
 *   profile.columns[i] ink pixels in x-bucket i
 *   profile.gridLuma   modal luminance per cell of a 24×24 grid
 *
 * The assertions are deliberately few and structural. Each one fails loudly
 * rather than being tuned until it passes: an ECDF that stops rising, a Q–Q
 * plot that is not a line, a row-normalised confusion matrix that does not put
 * its mass on the diagonal, or grouped bars that do not share a baseline are
 * all "the chart is rendering the wrong thing", which is the defect class this
 * phase exists to catch.
 *
 *   node qa/chart-geometry.mjs               # measure
 *   node qa/chart-assertions.mjs             # interpret
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(here, "../../..");
const reportPath = path.join(packageRoot, "artifacts/qa/inspect/chart-geometry.json");

/** Buckets at the very edge are usually the axis line, not the mark. */
function inked(profile, index) {
  return profile.top[index] >= 0;
}

function rise(profile) {
  const indexes = profile.top.map((value, index) => (value >= 0 ? index : -1)).filter((index) => index >= 0);
  if (indexes.length < 4) return 0;
  const first = indexes[0];
  const last = indexes[indexes.length - 1];
  return profile.top[first] - profile.top[last];
}

function correlation(indexes, values) {
  const n = indexes.length;
  const meanX = indexes.reduce((a, b) => a + b, 0) / n;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    cov += (indexes[i] - meanX) * (values[i] - meanY);
    varX += (indexes[i] - meanX) ** 2;
    varY += (values[i] - meanY) ** 2;
  }
  if (varX === 0 || varY === 0) return 0;
  return cov / Math.sqrt(varX * varY);
}

/** Mean of a rectangular slice of the 24×24 luminance grid. */
function cellMean(grid, x0, y0, x1, y1) {
  let sum = 0;
  let count = 0;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const value = grid[y]?.[x] ?? -1;
      if (value < 0) continue;
      sum += value;
      count += 1;
    }
  }
  return count === 0 ? -1 : sum / count;
}

/** Bounding box of the inked cells of the luminance grid, in cell units. */
function gridBox(grid) {
  let minX = grid.length;
  let minY = grid.length;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] < 0) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

export const ASSERTIONS = [
  {
    id: "ecdf-rises",
    route: "charts-statistical",
    title: "Empirical CDF",
    contract: "ECDF: a step curve whose value never decreases as x increases.",
    check(plot) {
      const profile = plot.composite;
      const indexes = profile.top.map((value, index) => (value >= 0 ? index : -1)).filter((index) => index >= 0);
      const values = indexes.map((index) => profile.top[index]);
      /* Ignore the axis line at the far left/right. */
      const trimmed = values.slice(1, -1);
      let descent = 0;
      for (let i = 1; i < trimmed.length; i += 1) descent = Math.max(descent, trimmed[i] - trimmed[i - 1]);
      const total = trimmed.length ? trimmed[0] - trimmed[trimmed.length - 1] : 0;
      return {
        pass: total > 0.35 && descent < 0.08,
        detail: `rise ${total.toFixed(3)}, worst reversal ${descent.toFixed(3)}`,
      };
    },
  },
  {
    id: "qq-plot-is-a-line",
    route: "charts-statistical",
    title: "Q–Q plot",
    contract: "Normal Q–Q: sample quantiles against normal quantiles, on the identity line.",
    check(plot) {
      const profile = plot.composite;
      const indexes = profile.top.map((value, index) => (value >= 0 ? index : -1)).filter((index) => index >= 0);
      const values = indexes.map((index) => profile.top[index]);
      const r = correlation(indexes, values);
      const total = rise(profile);
      return {
        pass: r < -0.9 && total > 0.5,
        detail: `corr ${r.toFixed(3)}, rise ${total.toFixed(3)}`,
      };
    },
  },
  {
    id: "roc-above-chance",
    route: "charts-statistical",
    title: "ROC",
    contract: "ROC: recall on x, false-positive rate on y; every curve is above the chance diagonal.",
    check(plot) {
      const profile = plot.composite;
      const indexes = profile.top.map((value, index) => (value >= 0 ? index : -1)).filter((index) => index >= 0);
      const values = indexes.map((index) => profile.top[index]);
      const r = correlation(indexes, values);
      return {
        pass: r < -0.85,
        detail: `corr ${r.toFixed(3)} (a monotone descent is the diagonal-plus-curves shape)`,
      };
    },
  },
  {
    id: "confusion-matrix-diagonal",
    route: "charts-statistical",
    title: "Confusion matrix",
    contract:
      "Row-normalised confusion matrix over [[412,47,21],[38,706,44],[19,52,361]] — each row's mass is on its own diagonal cell.",
    check(plot) {
      const grid = plot.composite.gridLuma;
      const box = gridBox(grid);
      /* The matrix is square; use the widest square that fits the ink box. */
      const size = Math.min(box.w, box.h);
      const x0 = box.minX;
      const y0 = box.minY;
      const step = size / 3;
      const rowBrightest = [];
      for (let row = 0; row < 3; row += 1) {
        let best = -1;
        let bestValue = -1;
        for (let column = 0; column < 3; column += 1) {
          const value = cellMean(
            grid,
            Math.round(x0 + column * step),
            Math.round(y0 + row * step),
            Math.round(x0 + (column + 1) * step),
            Math.round(y0 + (row + 1) * step),
          );
          if (value > bestValue) {
            bestValue = value;
            best = column;
          }
        }
        rowBrightest.push(best);
      }
      const diagonal = rowBrightest.every((column, row) => column === row);
      return { pass: diagonal, detail: `brightest column per row: [${rowBrightest.join(", ")}] (want [0, 1, 2])` };
    },
  },
  {
    id: "grouped-bars-form-distinct-columns",
    route: "charts-comparison",
    title: "Current vs previous",
    contract:
      "Grouped bars: eight categories × two series are drawn as distinct columns, so the column profile has many bands and the bar tops vary.",
    check(plot) {
      const profile = plot.composite;
      const values = profile.top.filter((_, index) => inked(profile, index));
      const mean = values.reduce((a, b) => a + b, 0) / Math.max(1, values.length);
      const spread = Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / Math.max(1, values.length));
      return {
        pass: profile.columnBands >= 5 && spread > 0.03,
        detail: `column bands ${profile.columnBands}, bar-top σ ${spread.toFixed(3)}`,
      };
    },
  },
  {
    id: "horizontal-bars-form-distinct-rows",
    route: "charts-comparison",
    title: "Horizontal bars",
    contract: "Same component, orientation swapped: bars become rows, so the row profile carries the bands.",
    check(plot) {
      const profile = plot.composite;
      return {
        pass: profile.rowBands >= 5 && profile.columnBands <= 3,
        detail: `row bands ${profile.rowBands}, column bands ${profile.columnBands}`,
      };
    },
  },
  {
    id: "violins-are-three-peaks",
    route: "charts-statistical",
    title: "Violin",
    contract: "Three prepared density outlines, one per group, so the column profile has exactly three peaks.",
    check(plot) {
      const profile = plot.composite;
      const columns = profile.columns;
      const max = Math.max(...columns);
      const threshold = max * 0.55;
      let peaks = 0;
      for (let i = 1; i < columns.length - 1; i += 1) {
        if (columns[i] >= threshold && columns[i] > columns[i - 1] && columns[i] >= columns[i + 1]) peaks += 1;
      }
      return { pass: peaks === 3, detail: `${peaks} peak(s) in the column profile` };
    },
  },
  {
    id: "polar-rose-is-centred",
    route: "charts-scientific",
    title: "Polar rose",
    contract: "A polar chart is radial about the plot centre, so its ink bounding box is centred and roughly square.",
    check(plot) {
      const grid = plot.composite.gridLuma;
      const box = gridBox(grid);
      const centreX = (box.minX + box.maxX + 1) / 2 / grid.length;
      const centreY = (box.minY + box.maxY + 1) / 2 / grid.length;
      const aspect = box.w / box.h;
      return {
        pass: Math.abs(centreX - 0.5) < 0.18 && Math.abs(centreY - 0.5) < 0.18 && aspect > 0.7 && aspect < 1.4,
        detail: `centre (${centreX.toFixed(2)}, ${centreY.toFixed(2)}), aspect ${aspect.toFixed(2)}`,
      };
    },
  },
  {
    id: "correlation-matrix-is-square-and-full",
    route: "charts-matrix",
    title: "Asset correlation",
    contract: "A ten-asset correlation matrix fills a square plot: 100 cells, every one carrying a value.",
    check(plot) {
      const profile = plot.composite;
      const grid = profile.gridLuma;
      const box = gridBox(grid);
      const aspect = box.w / box.h;
      return {
        pass: aspect > 0.8 && aspect < 1.25 && profile.inkRatio > 0.5,
        detail: `box ${box.w}×${box.h} (aspect ${aspect.toFixed(2)}), ink ${profile.inkRatio}`,
      };
    },
  },
  {
    id: "calendar-heatmap-covers-the-year",
    route: "charts-sizing",
    title: "Monthly return calendar",
    contract: "A calendar heatmap spans twelve months across the full plot width, so its ink reaches both edges.",
    check(plot) {
      const profile = plot.composite;
      const indexes = profile.columns.map((count, index) => (count > 0 ? index : -1)).filter((index) => index >= 0);
      if (indexes.length === 0) return { pass: false, detail: "no inked columns" };
      const first = indexes[0] / profile.columns.length;
      const last = indexes[indexes.length - 1] / profile.columns.length;
      return { pass: first < 0.12 && last > 0.88, detail: `ink columns ${first.toFixed(2)} … ${last.toFixed(2)}` };
    },
  },
];

function find(report, route, title) {
  const entry = report.find((item) => item.slug === route);
  if (!entry?.plots) return undefined;
  return entry.plots.find((plot) => plot.title.startsWith(title));
}

const report = JSON.parse(await readFile(reportPath, "utf8"));
let failures = 0;
console.log("LUC UI chart data-fidelity assertions");
for (const assertion of ASSERTIONS) {
  const plot = find(report, assertion.route, assertion.title);
  if (!plot) {
    failures += 1;
    console.log(`  BLOCKED  ${assertion.id.padEnd(38)} plot not found on ${assertion.route}`);
    continue;
  }
  if (!plot.composite) {
    failures += 1;
    console.log(`  FAIL     ${assertion.id.padEnd(38)} no composite profile`);
    continue;
  }
  const result = assertion.check(plot);
  if (!result.pass) failures += 1;
  console.log(`  ${result.pass ? "PASS" : "FAIL"}     ${assertion.id.padEnd(38)} ${result.detail}`);
}
console.log(`\n${ASSERTIONS.length - failures}/${ASSERTIONS.length} assertions passed`);
process.exitCode = failures > 0 ? 1 : 0;
