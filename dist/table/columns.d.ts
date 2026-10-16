import { NumericFormatOptions } from "../utils/format.js";
import { SparkTone } from "../charts/components/sparkline.js";
import { StatusPreset } from "../data/status-badge.js";
import { ColumnAlign, DataTableColumn } from "./types.js";
import { ReactNode } from "react";
import { RowData } from "@tanstack/react-table";
//#region src/table/columns.d.ts
/**
 * LUC column helpers.
 *
 * These exist so a product writes intent — `numericColumn("sharpe")` — instead
 * of re-deriving alignment, tabular figures, em-dash handling and tone from
 * scratch on every screen. Formatting only: no helper computes a value, and
 * none of them silently changes units. `format: { kind: "percent" }` renders
 * `0.0001` as `0.01%` *because it was asked to*.
 */
export interface BaseColumnOptions {
  /** Overrides the header-derived id. Useful for stable pinning/prefs keys. */
  id?: string;
  header: ReactNode;
  align?: ColumnAlign;
  size?: number;
  minSize?: number;
  maxSize?: number;
  /** `false` for decorative/derived columns. Default `true`. */
  sortable?: boolean;
  /**
   * `true` makes the first click sort descending. LUC defaults to ascending so
   * a click means the same thing on a text and a numeric column.
   */
  sortDescFirst?: boolean;
  /** Adds the column to the filter state. Default `false`. */
  filterable?: boolean;
  /**
   * Named filter predicate. `arrIncludesSome` is the one facet filters use;
   * `inNumberRange` / `inDateRange` take a `[min, max]` tuple.
   */
  filterFn?: DataTableFilterFn;
  /** Starts hidden. The column stays available in the visibility menu. */
  hiddenByDefault?: boolean;
  /** Always visible; cannot be hidden. */
  locked?: boolean;
  pin?: "start" | "end";
  headerClassName?: string;
  cellClassName?: string;
  /** Tooltip/title for the header, for units and definitions. */
  description?: string;
}
/** Built-in predicates LUC exposes by name. Custom predicates stay TanStack's job. */
export type DataTableFilterFn = "auto" | "arrIncludes" | "arrIncludesAll" | "arrIncludesSome" | "arrHas" | "between" | "betweenInclusive" | "empty" | "endsWith" | "equals" | "equalsString" | "equalsStringSensitive" | "inDateRange" | "inNumberRange" | "includesString" | "includesStringSensitive" | "notEmpty" | "startsWith" | "weakEquals";
export interface TextColumnOptions<TData extends RowData> extends BaseColumnOptions {
  /** Truncate to one line with an ellipsis. */
  truncate?: boolean;
  /** Emphasise the cell as the row's identity. */
  emphasis?: boolean;
  /** Render the value with a monospaced, tabular face (ids, tickers, hashes). */
  mono?: boolean;
  cell?: (value: string, row: TData) => ReactNode;
}
export declare function textColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: TextColumnOptions<TData>): DataTableColumn<TData>;
export interface NumericColumnOptions<TData extends RowData> extends BaseColumnOptions, Omit<NumericFormatOptions, "kind"> {
  kind?: NumericFormatOptions["kind"];
  /** Fixed decimal places. Shorthand for min/max fraction digits. */
  decimals?: number;
  /** `signed` paints positive/negative with the semantic foreground tokens. */
  tone?: "none" | "signed";
  /** Unit appended after the number, never converted. */
  unit?: string;
  /** Chart-style `ChartFormat` conversion is out of scope here on purpose. */
  formatter?: (value: number, row: TData) => string;
}
export declare function numericColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: NumericColumnOptions<TData>): DataTableColumn<TData>;
export declare function currencyColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: NumericColumnOptions<TData>): DataTableColumn<TData>;
export declare function percentColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: NumericColumnOptions<TData>): DataTableColumn<TData>;
export declare function integerColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: NumericColumnOptions<TData>): DataTableColumn<TData>;
export declare function compactColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: NumericColumnOptions<TData>): DataTableColumn<TData>;
export interface DateColumnOptions extends BaseColumnOptions {
  style?: "date" | "time" | "datetime";
  timeZone?: string;
  locale?: string;
}
export declare function dateColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: DateColumnOptions): DataTableColumn<TData>;
export interface StatusColumnOptions<TData extends RowData> extends BaseColumnOptions {
  /**
   * Maps a cell value to a preset + optional label. Keep the mapping in the
   * product: LUC knows how a status *looks*, not what the statuses are.
   */
  map: (value: string, row: TData) => {
    status: StatusPreset;
    label?: string;
  };
}
export declare function statusColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: StatusColumnOptions<TData>): DataTableColumn<TData>;
export interface BooleanColumnOptions extends BaseColumnOptions {
  trueLabel?: string;
  falseLabel?: string;
}
export declare function booleanColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: BooleanColumnOptions): DataTableColumn<TData>;
export interface SparklineColumnOptions extends BaseColumnOptions {
  tone?: SparkTone;
  autoTone?: boolean;
  /** Fixed width; the cell stays right-aligned either way. */
  width?: number;
  height?: number;
}
export declare function sparklineColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: SparklineColumnOptions): DataTableColumn<TData>;
export interface LinkColumnOptions<TData extends RowData> extends BaseColumnOptions {
  href: (value: string, row: TData) => string;
  label?: (value: string, row: TData) => ReactNode;
}
export declare function linkColumn<TData extends RowData, TKey extends keyof TData & string>(key: TKey, options: LinkColumnOptions<TData>): DataTableColumn<TData>;
export interface DisplayColumnOptions<TData extends RowData> extends Omit<BaseColumnOptions, "id"> {
  id: string;
  cell: (row: TData) => ReactNode;
}
/** A column with no accessor: actions, expanders, selection. */
export declare function displayColumn<TData extends RowData>(options: DisplayColumnOptions<TData>): DataTableColumn<TData>;
//#endregion
//# sourceMappingURL=columns.d.ts.map