import { ChartFormat } from "../types.js";
//#region src/charts/components/chart-data-table.d.ts
/**
 * "View data table" — the honest accessibility answer for canvas charts.
 *
 * A canvas has no text to expose, so the chart is paired with a real semantic
 * table of the same numbers. It is not shown by default (it would clutter the
 * plot) and it is not a CSV export: no new data, no recomputation, just the
 * series the reader can currently see rendered as rows.
 *
 * Accessibility note: this improves the situation but does not fix canvas
 * charts. The table must be reachable through a real control, and the chart
 * still needs its own `ariaLabel`; see docs/ACCESSIBILITY.md.
 */
export type ChartDataRow = Record<string, unknown>;
export interface ChartDataSeriesSpec {
  /** Row key holding the prepared value. */
  key: string;
  /** Column header. */
  label: string;
  /** Reuse the chart's own formatter so the two views cannot disagree. */
  format?: ChartFormat;
  /** Custom formatter; wins over `format`. */
  formatter?: (value: number | null | undefined) => string;
  /** Paint positive/negative with the semantic tokens. */
  tone?: "none" | "signed";
}
export interface ChartDataTableProps {
  /** Prepared rows — the same array the chart was given. */
  rows: ReadonlyArray<ChartDataRow>;
  /** Row key for the x value (usually a timestamp). */
  xKey: string;
  xLabel?: string;
  xFormat?: ChartFormat;
  /** Visible series, in legend order. Pass the filtered list. */
  series: ReadonlyArray<ChartDataSeriesSpec>;
  caption?: string;
  /** Rows per page. `0` disables pagination and renders the first 500 rows. */
  pageSize?: number;
  maxHeight?: number | string;
  className?: string;
}
export declare function ChartDataTable({ rows, xKey, xLabel, xFormat, series, caption, pageSize, maxHeight, className }: ChartDataTableProps): import("react").JSX.Element;
export interface ChartDataViewToggleProps {
  value: "chart" | "table";
  onValueChange: (value: "chart" | "table") => void;
  /** Accessible name. Default `"Chart or table view"`. */
  label?: string;
  /**
   * The two visible labels.
   *
   * A library cannot translate itself: it has no dictionary and no locale. A
   * caller that does have one passes its own words here instead of being forced
   * to reimplement the control. The English defaults are what a consumer with no
   * localizer sees, which is the same bargain every other prop makes.
   */
  labels?: {
    chart: string;
    table: string;
  };
  className?: string;
}
/**
 * The chart/table switch. A segmented control rather than two buttons because
 * the choice is exclusive, and it is the control that makes the table reachable
 * by keyboard.
 */
export declare function ChartDataViewToggle({ value, onValueChange, label, labels, className }: ChartDataViewToggleProps): import("react").JSX.Element;
export interface ChartDataViewProps {
  view: "chart" | "table";
  /** The chart. Rendered when `view === "chart"`. */
  chart: React.ReactNode;
  /** Props for the paired table. */
  table: ChartDataTableProps;
}
/** Renders one of the two views. Keeps both in the same card frame. */
export declare function ChartDataView({ view, chart, table }: ChartDataViewProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=chart-data-table.d.ts.map