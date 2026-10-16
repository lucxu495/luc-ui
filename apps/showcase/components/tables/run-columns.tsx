"use client";

import {
  Badge,
  dateColumn,
  displayColumn,
  integerColumn,
  numericColumn,
  percentColumn,
  sparklineColumn,
  statusColumn,
  textColumn,
  type DataTableColumn,
  type StatusPreset,
} from "@luc/ui";
import type { ResearchRun } from "@/lib/table-data";
import { RowActionsMenu } from "./row-actions";

/**
 * The shared research-run column set.
 *
 * Every screen that shows runs uses this, so alignment, formatting and filter
 * semantics cannot drift between the DataTable page, the filter pattern and the
 * workspace composition. It is formatting only — no metric is computed here.
 */

const STATUS_PRESETS: Record<ResearchRun["status"], { status: StatusPreset; label: string }> = {
  live: { status: "live", label: "Live" },
  draft: { status: "pending", label: "Draft" },
  paused: { status: "stale", label: "Paused" },
  failed: { status: "down", label: "Failed" },
};

const REGIME_LABELS: Record<ResearchRun["regime"], string> = {
  trend: "Trend",
  range: "Range",
  stress: "Stress",
};

export function runColumns(): Array<DataTableColumn<ResearchRun>> {
  return [
    textColumn<ResearchRun, "symbol">("symbol", {
      header: "Symbol",
      locked: true,
      pin: "start",
      size: 132,
      emphasis: true,
      description: "Instrument the run was executed on",
    }),
    textColumn<ResearchRun, "strategy">("strategy", {
      header: "Strategy",
      size: 220,
      truncate: true,
    }),
    statusColumn<ResearchRun, "status">("status", {
      header: "Status",
      size: 132,
      filterable: true,
      filterFn: "arrHas",
      map: (value) => STATUS_PRESETS[value as ResearchRun["status"]] ?? { status: "unknown" },
    }),
    textColumn<ResearchRun, "regime">("regime", {
      header: "Regime",
      size: 120,
      hiddenByDefault: true,
      filterable: true,
      filterFn: "arrHas",
      cell: (value) => (
        <Badge size="sm" tone={value === "stress" ? "negative" : value === "trend" ? "positive" : "neutral"}>
          {REGIME_LABELS[value as ResearchRun["regime"]] ?? value}
        </Badge>
      ),
    }),
    numericColumn<ResearchRun, "sharpe">("sharpe", {
      header: "Sharpe",
      size: 104,
      decimals: 2,
      tone: "signed",
      description: "Provided by the study — the table never computes it",
    }),
    percentColumn<ResearchRun, "cagr">("cagr", {
      header: "CAGR",
      size: 104,
      decimals: 1,
      tone: "signed",
    }),
    percentColumn<ResearchRun, "maxDrawdown">("maxDrawdown", {
      header: "Max DD",
      size: 104,
      decimals: 1,
      hiddenByDefault: true,
    }),
    integerColumn<ResearchRun, "trades">("trades", {
      header: "Trades",
      size: 96,
      hiddenByDefault: true,
    }),
    percentColumn<ResearchRun, "exposure">("exposure", {
      header: "Exposure",
      size: 110,
      decimals: 1,
      hiddenByDefault: true,
    }),
    sparklineColumn<ResearchRun, "equity">("equity", {
      header: "Equity",
      size: 120,
      autoTone: true,
      width: 88,
      height: 22,
      description: "Prepared equity curve from the study",
    }),
    dateColumn<ResearchRun, "updated">("updated", {
      header: "Updated",
      size: 132,
      style: "date",
    }),
    displayColumn<ResearchRun>({
      id: "actions",
      header: "",
      size: 52,
      align: "right",
      locked: true,
      pin: "end",
      cell: (row) => <RowActionsMenu row={row} />,
    }),
  ];
}

export { STATUS_PRESETS, REGIME_LABELS };
