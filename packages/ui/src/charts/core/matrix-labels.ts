/**
 * Value-label policy for matrix charts (heatmap, correlation).
 *
 * A correlation matrix is read from two channels at once: the colour and the
 * coefficient. Printing every coefficient into a 30×30 grid produces noise, and
 * printing none of them throws away half the information, so the decision is
 * explicit and made from the *rendered cell size* rather than the row count —
 * a 10×10 matrix in a wide research card has larger cells than a 6×6 in a
 * narrow one, and it is the cell that has to hold the text.
 *
 * This module is deliberately pure: it takes numbers and returns a boolean, so
 * the policy can be unit-tested without an engine or a DOM.
 */

export type MatrixLabelMode = "auto" | "always" | "never";

/**
 * The smallest cell that keeps a coefficient readable.
 *
 * `width` fits `-0.42` (five glyphs) at `--text-micro` in the mono face plus a
 * little breathing room; `height` is the same text's line box. Below either
 * number the label stops being information and becomes texture.
 */
export const MATRIX_LABEL_MIN_CELL = { width: 44, height: 18 } as const;

export interface MatrixPlotArea {
  rows: number;
  columns: number;
  /** Rendered plot size, excluding the axis gutters, in CSS pixels. */
  plotWidth: number;
  plotHeight: number;
}

export interface MatrixLabelPolicy extends Partial<MatrixPlotArea> {
  mode: MatrixLabelMode;
  minCellWidth?: number;
  minCellHeight?: number;
}

/**
 * Should the coefficients be drawn?
 *
 * `always` trusts the caller; `never` is honoured unconditionally; `auto`
 * requires a real measurement. An unmeasured chart (zero or non-finite size —
 * before layout, or inside a hidden container) stays unlabelled rather than
 * guessing, and ECharts re-asks on every resize.
 */
export function shouldShowMatrixValues(policy: MatrixLabelPolicy): boolean {
  if (policy.mode === "never") return false;
  if (policy.mode === "always") return true;

  const { rows, columns, plotWidth, plotHeight } = policy;
  if (!rows || !columns || rows < 1 || columns < 1) return false;
  if (!Number.isFinite(plotWidth) || !Number.isFinite(plotHeight)) return false;
  if (!plotWidth || !plotHeight || plotWidth <= 0 || plotHeight <= 0) return false;

  const minCellWidth = policy.minCellWidth ?? MATRIX_LABEL_MIN_CELL.width;
  const minCellHeight = policy.minCellHeight ?? MATRIX_LABEL_MIN_CELL.height;
  return plotWidth / columns >= minCellWidth && plotHeight / rows >= minCellHeight;
}

/**
 * The axis gutter the correlation grid reserves, used to turn a chart size into
 * a plot size. It mirrors `gridFragment({ top: 12, bottom: 40, left: 10, right: 14 })`
 * plus the label extents `containLabel` adds (84px of y labels + 8px margin).
 */
export const CORRELATION_PLOT_INSET = { left: 102, top: 12, right: 14, bottom: 48 } as const;

/**
 * The axis gutter the categorical heatmap reserves, mirroring
 * `gridFragment({ top: 12, bottom: 56, left: 8, right: 12 })` plus the label
 * extents `containLabel` adds (an 80px y band + 8px margin, and the category
 * labels + legend beneath the grid).
 */
export const HEATMAP_PLOT_INSET = { left: 96, top: 12, right: 12, bottom: 72 } as const;

/** Turn a rendered chart box into a plot area for a given inset. */
export function matrixPlotArea(
  width: number,
  height: number,
  rows: number,
  columns: number,
  inset: { left: number; top: number; right: number; bottom: number },
): MatrixPlotArea {
  return {
    rows,
    columns,
    plotWidth: width - inset.left - inset.right,
    plotHeight: height - inset.top - inset.bottom,
  };
}

export function correlationPlotArea(
  width: number,
  height: number,
  rows: number,
  columns: number,
): MatrixPlotArea {
  return matrixPlotArea(width, height, rows, columns, CORRELATION_PLOT_INSET);
}

/** The plot area a categorical heatmap's rendered size implies. */
export function heatmapPlotArea(
  width: number,
  height: number,
  rows: number,
  columns: number,
): MatrixPlotArea {
  return matrixPlotArea(width, height, rows, columns, HEATMAP_PLOT_INSET);
}
