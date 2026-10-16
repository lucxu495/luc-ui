"use client";

import type { ReactNode } from "react";
import type { RowData } from "@tanstack/react-table";
import { StatusBadge, type StatusPreset } from "../data/status-badge";
import { Sparkline, type SparkTone } from "../charts/components/sparkline";
import { cn } from "../utils/cn";
import { formatNumber, type NumericFormatOptions } from "../utils/format";
import { formatAbsoluteTime } from "../utils/time";
import type { ColumnAlign, DataTableColumn, DataTableColumnMeta } from "./types";

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

interface BuildConfig<TData extends RowData> {
  key: keyof TData & string;
  options: BaseColumnOptions;
  render: (value: unknown, row: TData) => ReactNode;
  meta?: Partial<DataTableColumnMeta>;
  valueGetter?: (row: TData) => unknown;
}

/** Built-in predicates LUC exposes by name. Custom predicates stay TanStack's job. */
export type DataTableFilterFn =
  | "auto"
  | "arrIncludes"
  | "arrIncludesAll"
  | "arrIncludesSome"
  | "arrHas"
  | "between"
  | "betweenInclusive"
  | "empty"
  | "endsWith"
  | "equals"
  | "equalsString"
  | "equalsStringSensitive"
  | "inDateRange"
  | "inNumberRange"
  | "includesString"
  | "includesStringSensitive"
  | "notEmpty"
  | "startsWith"
  | "weakEquals";

/**
 * Assembles a column definition. The `as` cast is deliberate: TanStack's
 * per-column `TValue` generic cannot be threaded through a runtime helper, and
 * the value is still checked at the call site via `keyof TData`.
 */
function buildColumn<TData extends RowData>(config: BuildConfig<TData>): DataTableColumn<TData> {
  const { key, options } = config;
  const meta: DataTableColumnMeta = {
    align: options.align,
    label: typeof options.header === "string" ? options.header : (options.id ?? key),
    locked: options.locked,
    pin: options.pin,
    headerClassName: options.headerClassName,
    cellClassName: options.cellClassName,
    ...config.meta,
  };

  return {
    id: options.id ?? key,
    accessorKey: key,
    header: options.description ? (
      <span title={options.description}>{options.header}</span>
    ) : (
      options.header
    ),
    enableSorting: options.sortable ?? true,
    sortDescFirst: options.sortDescFirst ?? false,
    enableColumnFilter: options.filterable ?? false,
    ...(options.filterFn ? { filterFn: options.filterFn } : {}),
    enableGlobalFilter: true,
    enableHiding: options.locked ? false : true,
    size: options.size,
    minSize: options.minSize,
    maxSize: options.maxSize,
    meta,
    cell: (context) => {
      const row = context.row.original as TData;
      const value = config.valueGetter ? config.valueGetter(row) : context.getValue();
      return config.render(value, row);
    },
  } as DataTableColumn<TData>;
}

const DASH = <span className="text-fg-disabled">—</span>;

function textOrDash(value: unknown): ReactNode {
  if (value === null || value === undefined || value === "") return DASH;
  return String(value);
}

/* -------------------------------------------------------------------------- */
/* Text and identity                                                           */
/* -------------------------------------------------------------------------- */

export interface TextColumnOptions<TData extends RowData> extends BaseColumnOptions {
  /** Truncate to one line with an ellipsis. */
  truncate?: boolean;
  /** Emphasise the cell as the row's identity. */
  emphasis?: boolean;
  /** Render the value with a monospaced, tabular face (ids, tickers, hashes). */
  mono?: boolean;
  cell?: (value: string, row: TData) => ReactNode;
}

export function textColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: TextColumnOptions<TData>,
): DataTableColumn<TData> {
  return buildColumn<TData>({
    key,
    options,
    render: (raw, row) => {
      const value = raw === null || raw === undefined ? "" : String(raw);
      if (options.cell) return options.cell(value, row);
      return (
        <span
          className={cn(
            options.truncate && "block truncate",
            options.mono && "font-mono text-caption",
            options.emphasis && "font-medium text-fg-primary",
          )}
        >
          {textOrDash(value)}
        </span>
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Numeric                                                                     */
/* -------------------------------------------------------------------------- */

export interface NumericColumnOptions<TData extends RowData>
  extends BaseColumnOptions,
    Omit<NumericFormatOptions, "kind"> {
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

export function numericColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: NumericColumnOptions<TData>,
): DataTableColumn<TData> {
  const {
    kind = "decimal",
    tone = "none",
    unit,
    formatter,
    decimals,
    locale,
    currency,
    suffix,
    signed,
    minimumFractionDigits,
    maximumFractionDigits,
    ...base
  } = options;
  const formatOptions: NumericFormatOptions = {
    kind,
    locale,
    currency,
    suffix: unit ?? suffix,
    signed,
    minimumFractionDigits: decimals ?? minimumFractionDigits,
    maximumFractionDigits: decimals ?? maximumFractionDigits,
  };

  return buildColumn<TData>({
    key,
    options: { ...base, align: base.align ?? "right" },
    meta: { numeric: true, align: base.align ?? "right" },
    render: (raw, row) => {
      const value = typeof raw === "number" ? raw : raw === null || raw === undefined ? null : Number(raw);
      if (value === null || Number.isNaN(value)) return DASH;
      const text = formatter ? formatter(value, row) : formatNumber(value, formatOptions);
      return (
        <span
          data-numeric=""
          className={cn(
            "text-fg-primary",
            tone === "signed" && value > 0 && "text-fg-positive",
            tone === "signed" && value < 0 && "text-fg-negative",
          )}
        >
          {text}
        </span>
      );
    },
  });
}

export function currencyColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: NumericColumnOptions<TData>,
): DataTableColumn<TData> {
  return numericColumn(key, { kind: "currency", ...options });
}

export function percentColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: NumericColumnOptions<TData>,
): DataTableColumn<TData> {
  return numericColumn(key, { kind: "percent", ...options });
}

export function integerColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: NumericColumnOptions<TData>,
): DataTableColumn<TData> {
  return numericColumn(key, { kind: "number", maximumFractionDigits: 0, ...options });
}

export function compactColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: NumericColumnOptions<TData>,
): DataTableColumn<TData> {
  return numericColumn(key, { kind: "compact", ...options });
}

/* -------------------------------------------------------------------------- */
/* Time                                                                        */
/* -------------------------------------------------------------------------- */

export interface DateColumnOptions extends BaseColumnOptions {
  style?: "date" | "time" | "datetime";
  timeZone?: string;
  locale?: string;
}

export function dateColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: DateColumnOptions,
): DataTableColumn<TData> {
  const { style = "date", timeZone, locale, ...base } = options;
  return buildColumn<TData>({
    key,
    options: base,
    render: (raw) => {
      if (raw === null || raw === undefined) return DASH;
      const text = formatAbsoluteTime(raw as Date | number | string, { style, timeZone, locale });
      return (
        <span data-numeric="" className="text-fg-secondary">
          {text}
        </span>
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Semantics                                                                   */
/* -------------------------------------------------------------------------- */

export interface StatusColumnOptions<TData extends RowData> extends BaseColumnOptions {
  /**
   * Maps a cell value to a preset + optional label. Keep the mapping in the
   * product: LUC knows how a status *looks*, not what the statuses are.
   */
  map: (value: string, row: TData) => { status: StatusPreset; label?: string };
}

export function statusColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: StatusColumnOptions<TData>,
): DataTableColumn<TData> {
  const { map, ...base } = options;
  return buildColumn<TData>({
    key,
    options: base,
    render: (raw, row) => {
      const value = raw === null || raw === undefined ? "" : String(raw);
      const mapped = map(value, row);
      return <StatusBadge size="sm" status={mapped.status} label={mapped.label} />;
    },
  });
}

export interface BooleanColumnOptions extends BaseColumnOptions {
  trueLabel?: string;
  falseLabel?: string;
}

export function booleanColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: BooleanColumnOptions,
): DataTableColumn<TData> {
  return buildColumn<TData>({
    key,
    options,
    render: (raw) => {
      if (raw === null || raw === undefined) return DASH;
      const truthy = Boolean(raw);
      return (
        <span className={cn("text-label", truthy ? "text-fg-positive" : "text-fg-disabled")}>
          {truthy ? (options.trueLabel ?? "Yes") : (options.falseLabel ?? "No")}
        </span>
      );
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Cell renderers                                                              */
/* -------------------------------------------------------------------------- */

export interface SparklineColumnOptions extends BaseColumnOptions {
  tone?: SparkTone;
  autoTone?: boolean;
  /** Fixed width; the cell stays right-aligned either way. */
  width?: number;
  height?: number;
}

export function sparklineColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: SparklineColumnOptions,
): DataTableColumn<TData> {
  const { tone = "accent", autoTone, width = 96, height = 24, ...base } = options;
  return buildColumn<TData>({
    key,
    // A sparkline is decoration over a series the reader already has; sorting it
    // by first element would be meaningless.
    options: { align: "right", sortable: false, ...base },
    meta: { align: "right" },
    render: (raw) => {
      if (!Array.isArray(raw) || raw.length === 0) return DASH;
      return (
        <Sparkline
          values={raw as number[]}
          tone={tone}
          autoTone={autoTone}
          width={width}
          height={height}
          className="inline-block"
        />
      );
    },
  });
}

export interface LinkColumnOptions<TData extends RowData> extends BaseColumnOptions {
  href: (value: string, row: TData) => string;
  label?: (value: string, row: TData) => ReactNode;
}

export function linkColumn<TData extends RowData, TKey extends keyof TData & string>(
  key: TKey,
  options: LinkColumnOptions<TData>,
): DataTableColumn<TData> {
  const { href, label, ...base } = options;
  return buildColumn<TData>({
    key,
    options: base,
    render: (raw, row) => {
      if (raw === null || raw === undefined || raw === "") return DASH;
      const value = String(raw);
      return (
        <a
          href={href(value, row)}
          className="text-fg-accent underline decoration-line-accent/60 underline-offset-2 hover:decoration-line-accent"
        >
          {label ? label(value, row) : value}
        </a>
      );
    },
  });
}

export interface DisplayColumnOptions<TData extends RowData> extends Omit<BaseColumnOptions, "id"> {
  id: string;
  cell: (row: TData) => ReactNode;
}

/** A column with no accessor: actions, expanders, selection. */
export function displayColumn<TData extends RowData>(
  options: DisplayColumnOptions<TData>,
): DataTableColumn<TData> {
  const { id, cell, ...base } = options;
  return {
    id,
    header: base.header,
    enableSorting: base.sortable ?? false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    enableHiding: base.locked ? false : true,
    size: base.size,
    minSize: base.minSize,
    maxSize: base.maxSize,
    meta: {
      align: base.align ?? "left",
      label: typeof base.header === "string" ? base.header : id,
      locked: base.locked,
      pin: base.pin,
      headerClassName: base.headerClassName,
      cellClassName: base.cellClassName,
    },
    cell: (context) => cell(context.row.original as TData),
  } as DataTableColumn<TData>;
}
