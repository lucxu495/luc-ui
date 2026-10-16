"use client";

import { useMemo } from "react";
import { SegmentedControl, SegmentedItem } from "../../components/segmented-control";
import { DataTable } from "../../table/data-table";
import { DataTablePagination } from "../../table/data-table-pagination";
import { numericColumn } from "../../table/columns";
import type { DataTableColumn } from "../../table/types";
import { formatChartValue } from "../core/formatters";
import type { ChartFormat } from "../types";
import { cn } from "../../utils/cn";

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

export function ChartDataTable({
  rows,
  xKey,
  xLabel = "Date",
  xFormat = { kind: "date" },
  series,
  caption,
  pageSize = 10,
  maxHeight = 320,
  className,
}: ChartDataTableProps) {
  const columns = useMemo(() => {
    // The x value is a timestamp in milliseconds — a number — so it sorts
    // numerically and is rendered with the chart's own formatter, which is what
    // keeps the table and the tooltip from disagreeing.
    const xColumn = numericColumn<ChartDataRow, string>(xKey, {
      header: xLabel,
      align: "left",
      locked: true,
      cellClassName: "text-fg-secondary",
      formatter: (value) => formatChartValue(value, xFormat),
    });

    const valueColumns = series.map((spec) =>
      numericColumn<ChartDataRow, string>(spec.key, {
        header: spec.label,
        tone: spec.tone,
        kind: "decimal",
        formatter: (value) =>
          spec.formatter
            ? spec.formatter(value)
            : formatChartValue(value, spec.format ?? { kind: "decimal", decimals: 2 }),
      }),
    );

    return [xColumn, ...valueColumns] as Array<DataTableColumn<ChartDataRow>>;
  }, [series, xFormat, xKey, xLabel]);

  const data = useMemo(
    () => (pageSize === 0 ? rows.slice(0, 500) : (rows as ChartDataRow[])),
    [pageSize, rows],
  );

  return (
    <DataTable<ChartDataRow>
      ariaLabel={caption ?? "Chart data table"}
      caption={caption}
      columns={columns}
      data={data}
      getRowId={(row, index) => `${String(row[xKey] ?? index)}-${index}`}
      density="compact"
      stickyHeader
      maxHeight={maxHeight}
      defaultSorting={[{ id: xKey, desc: true }]}
      enableRowSelection={false}
      pageSize={pageSize === 0 ? Math.max(data.length, 1) : pageSize}
      className={className}
      footer={
        pageSize === 0 ? null : (
          <DataTablePagination className="rounded-b-lg border-x border-b border-line-subtle bg-surface-default" />
        )
      }
    />
  );
}

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
  labels?: { chart: string; table: string };
  className?: string;
}

/**
 * The chart/table switch. A segmented control rather than two buttons because
 * the choice is exclusive, and it is the control that makes the table reachable
 * by keyboard.
 */
export function ChartDataViewToggle({
  value,
  onValueChange,
  label = "Chart or table view",
  labels = { chart: "Chart", table: "Table" },
  className,
}: ChartDataViewToggleProps) {
  return (
    <SegmentedControl
      className={className}
      size="sm"
      aria-label={label}
      value={value}
      onValueChange={(next) => next && onValueChange(next as "chart" | "table")}
    >
      <SegmentedItem size="sm" value="chart">
        {labels.chart}
      </SegmentedItem>
      <SegmentedItem size="sm" value="table">
        {labels.table}
      </SegmentedItem>
    </SegmentedControl>
  );
}

export interface ChartDataViewProps {
  view: "chart" | "table";
  /** The chart. Rendered when `view === "chart"`. */
  chart: React.ReactNode;
  /** Props for the paired table. */
  table: ChartDataTableProps;
}

/** Renders one of the two views. Keeps both in the same card frame. */
export function ChartDataView({ view, chart, table }: ChartDataViewProps) {
  if (view === "chart") return <div className={cn("h-full min-h-0 w-full")}>{chart}</div>;
  return <ChartDataTable {...table} />;
}
