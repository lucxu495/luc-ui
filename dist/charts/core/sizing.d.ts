//#region src/charts/core/sizing.d.ts
/**
 * Semantic chart sizing.
 *
 * A chart's height is an *analytical* decision, not a cosmetic one. A calendar
 * heatmap with fifteen year-rows and a single bounded oscillator answer
 * different questions, and forcing both into the same 240px box either crushes
 * the matrix into unreadable slivers or balloons a one-line reading into empty
 * space. This module is the single, engine-independent vocabulary callers use
 * instead of hard-coding pixels per chart:
 *
 * - **named sizes** (`compact` / `medium` / `large`) for shape-driven charts;
 * - **row-derived sizes** for matrix and categorical charts, where the height
 *   has to follow the number of rows so every row stays readable;
 * - **content-derived** helpers for the two common matrix/bar cases.
 *
 * It is deliberately pure (numbers in, numbers out) so the policy is unit
 * testable without a DOM, and product-agnostic: nothing here knows what a
 * calendar month or a moving average is. Product code decides *which* size a
 * chart wants; this module only turns that decision into a number.
 */
/** The named sizes a shape-driven chart can ask for. */
export type ChartSizeName = "compact" | "medium" | "large";
export interface ChartSizeScale {
  compact: number;
  medium: number;
  large: number;
}
/**
 * The default pixel heights for the named sizes.
 *
 * These sit beside the pre-existing 160/240/320/440 chart presets but express a
 * different thing: a *shape* (a strip, an oscillator, a hero comparison) rather
 * than an arbitrary configuration step. `compact` is a readout/strip height, not
 * a squeezed chart; `large` is a focal, multi-series surface.
 */
export declare const DEFAULT_CHART_SIZE_SCALE: ChartSizeScale;
/** Resolve a named size to pixels, with an optional scale override. */
export declare function chartSizeHeight(size: ChartSizeName | undefined, scale?: ChartSizeScale): number;
export interface RowHeightOptions {
  /** The number of rows (years, categories, ranked items) the chart must show. */
  rows: number;
  /** The minimum readable height of one row, in CSS pixels. */
  rowHeight?: number;
  /** Fixed space above the rows (axis band, title). */
  header?: number;
  /** Fixed space below the rows (axis band, legend, scroll affordance). */
  footer?: number;
  /** A floor, so a two-row chart never collapses to a hairline. */
  min?: number;
  /** A ceiling, so a pathological row count cannot produce an unusable page. */
  max?: number;
}
/** Default per-row height for a matrix (heatmap / calendar) row. */
export declare const DEFAULT_MATRIX_ROW_HEIGHT = 26;
/** Default per-row height for a horizontal bar row (a year of returns). */
export declare const DEFAULT_BAR_ROW_HEIGHT = 24;
/** Default header/footer bands for row-derived charts. */
export declare const DEFAULT_ROW_HEADER = 24;
export declare const DEFAULT_ROW_FOOTER = 48;
export declare const DEFAULT_ROW_MIN = 140;
export declare const DEFAULT_ROW_MAX = 960;
/**
 * A height that grows with the number of rows.
 *
 * `rows` is clamped to at least one so an empty grid still reserves a readable
 * band. The result is clamped to `[min, max]`; the caller can tighten either
 * end. The arithmetic is intentionally simple and stable — no measurement, no
 * DOM — so SSR and the client agree on the box before the engine measures.
 */
export declare function rowsHeight(options: RowHeightOptions): number;
/** A matrix/heatmap height derived from the number of rows. */
export declare function matrixHeight(rows: number, options?: Omit<RowHeightOptions, "rows">): number;
/** A horizontal bar height derived from the number of category rows. */
export declare function horizontalBarHeight(rows: number, options?: Omit<RowHeightOptions, "rows">): number;
/**
 * The smallest number of rows a matrix may show before it is asked to scroll
 * rather than shrink — a companion to {@link matrixHeight} for the responsive
 * rule that a dense matrix keeps legible cells and scrolls instead of becoming
 * illegible text.
 */
export declare function matrixMinReadableRows(availableHeight: number, minRowHeight?: number): number;
//#endregion
//# sourceMappingURL=sizing.d.ts.map