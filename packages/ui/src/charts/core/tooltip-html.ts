/**
 * LUC tooltip markup.
 *
 * The formatter is our chance to own the type, the swatches, the column
 * alignment and the positive/negative tone. Every tooltip in the system is
 * assembled from these fragments — there is no second tooltip style hiding in a
 * chart family.
 *
 * It lives in `core/` rather than under an adapter because it is **engine
 * agnostic**: the Lightweight Charts surface builds the same markup for its own
 * crosshair readout. Keeping it under `adapters/echarts/` implied a dependency
 * that does not exist, and the consumer harness rightly flagged a
 * `@luc/ui/financial-chart` consumer as "pulling echarts" when the only match
 * was this file's path. Position in the tree is a claim; this file has to be
 * where the claim is true.
 */

import type { ChartTheme } from "./theme";
import type { ChartFormatter } from "./formatters";
import { formatChartValue } from "./formatters";
import type { ChartFormat, SeriesTone } from "../types";

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function swatchHtml(color: string): string {
  return `<span class="luc-chart-tooltip__swatch" style="background-color:${color}"></span>`;
}

export function tooltipRowHtml(label: string, value: string, color?: string): string {
  return (
    `<div class="luc-chart-tooltip__row">` +
    `<span class="luc-chart-tooltip__label">${color ? swatchHtml(color) : ""}${escapeHtml(label)}</span>` +
    `<span class="luc-chart-tooltip__value">${escapeHtml(value)}</span>` +
    `</div>`
  );
}

export function tooltipGridHtml(rows: ReadonlyArray<readonly [string, string]>, tone?: string): string {
  const body = rows
    .map(
      ([label, value]) =>
        `<dt>${escapeHtml(label)}</dt><dd${tone ? ` style="color:${tone}"` : ""}>${escapeHtml(value)}</dd>`,
    )
    .join("");
  return `<dl class="luc-chart-tooltip__grid">${body}</dl>`;
}

export function tooltipShellHtml(title: string | undefined, body: string, subtitle?: string): string {
  return (
    `<div class="luc-chart-tooltip">` +
    (title ? `<span class="luc-chart-tooltip__title">${escapeHtml(title)}</span>` : "") +
    (subtitle ? `<span class="luc-chart-tooltip__subtitle">${escapeHtml(subtitle)}</span>` : "") +
    body +
    `</div>`
  );
}

export function tooltipRuleHtml(): string {
  return `<div class="luc-chart-tooltip__rule"></div>`;
}

/** Swatch colour for a legend-consistent tooltip row. */
export function resolveRowColor(theme: ChartTheme, tone: SeriesTone | undefined, fallback: string): string {
  switch (tone) {
    case "positive":
      return theme.positive;
    case "negative":
      return theme.negative;
    case "warning":
      return theme.warning;
    case "neutral":
      return theme.neutral;
    default:
      return fallback;
  }
}

export interface TooltipSeriesMeta {
  id: string;
  label: string;
  color: string;
  format: ChartFormatter;
  /** Skip the row for non-numeric series such as candle overlays drawn as lines. */
  hideValue?: boolean;
}

export interface AxisTooltipConfig {
  theme: ChartTheme;
  metaById: ReadonlyMap<string, TooltipSeriesMeta>;
  xFormat?: ChartFormat;
  /** Format the header as a timestamp. Numeric x axes keep their number. */
  xIsTime?: boolean;
  spanMs?: number;
  sort?: "none" | "asc" | "desc";
  total?: boolean;
  /**
   * Extra rows for the hovered point, supplied by the caller's own point
   * metadata (a period end, the form that carried a figure, when it became
   * public). They are drawn under the series rows and assigned no meaning.
   */
  pointDetail?: (item: AxisTooltipItem) => readonly (readonly [string, string])[] | undefined;
  /** Extra block rendered under the series rows (used by financial tooltips). */
  footer?: (params: unknown) => string;
}

export interface AxisTooltipItem {
  seriesId?: string;
  seriesName?: string;
  color?: string;
  value?: unknown;
  axisValue?: unknown;
  axisValueLabel?: string;
  dataIndex?: number;
}

function numericFromItem(item: AxisTooltipItem): number | null {
  const value = item.value;
  if (Array.isArray(value)) {
    const candidate = value[1];
    return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return null;
}

/**
 * The standard time-series / multi-series tooltip: one date header, one row per
 * visible series, values right-aligned in tabular figures.
 */
export function axisTooltipFormatter(config: AxisTooltipConfig): (params: unknown) => string {
  return (params: unknown) => {
    const items = (Array.isArray(params) ? params : [params]) as AxisTooltipItem[];
    if (items.length === 0) return "";
    const first = items[0]!;
    const rawX = first.axisValue ?? (Array.isArray(first.value) ? first.value[0] : undefined);
    let title: string;
    if (typeof rawX === "number" && Number.isFinite(rawX)) {
      title = config.xIsTime
        ? formatChartValue(rawX, config.xFormat ?? { kind: "date" })
        : formatChartValue(rawX, config.xFormat ?? {});
    } else if (rawX === undefined || rawX === null) {
      title = first.axisValueLabel ?? "";
    } else {
      title = first.axisValueLabel ?? String(rawX);
    }

    const rows = items
      .map((item, index) => {
        const meta =
          (item.seriesId ? config.metaById.get(item.seriesId) : undefined) ??
          (item.seriesName ? config.metaById.get(item.seriesName) : undefined);
        const value = numericFromItem(item);
        if (meta?.hideValue || value === null) return null;
        const formatter = meta?.format ?? ((v: number | null | undefined) => formatChartValue(v));
        return {
          label: meta?.label ?? item.seriesName ?? `Series ${index + 1}`,
          color: meta?.color ?? item.color ?? config.theme.accent,
          value,
          formatted: formatter(value),
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (config.sort && config.sort !== "none") {
      rows.sort((a, b) => (config.sort === "asc" ? a.value - b.value : b.value - a.value));
    }

    let body = `<div class="luc-chart-tooltip__rows">${rows
      .map((row) => tooltipRowHtml(row.label, row.formatted, row.color))
      .join("")}</div>`;

    if (config.total && rows.length > 1) {
      const total = rows.reduce((sum, row) => sum + row.value, 0);
      body += tooltipRuleHtml();
      body += `<div class="luc-chart-tooltip__rows">${tooltipRowHtml("Total", formatChartValue(total))}</div>`;
    }

    /*
     * The caller's own point context — the served fields behind the x value
     * (a period end, a filing form). The engine is told which point is hovered
     * and prints the rows it is handed; it decides nothing about them.
     */
    if (config.pointDetail) {
      const detail = config.pointDetail(first);
      if (detail && detail.length > 0) {
        body += tooltipRuleHtml();
        body += tooltipGridHtml(detail);
      }
    }

    if (config.footer) body += config.footer(params);

    return tooltipShellHtml(title, body);
  };
}

/** Single-value tooltip for item-triggered charts (scatter, heatmap, flow). */
export function itemTooltipFormatter(
  build: (
    params: AxisTooltipItem,
  ) => { title?: string; subtitle?: string; rows: ReadonlyArray<readonly [string, string]> } | null,
): (params: unknown) => string {
  return (params: unknown) => {
    const item = (Array.isArray(params) ? params[0] : params) as AxisTooltipItem;
    const content = build(item);
    if (!content) return "";
    return tooltipShellHtml(content.title, tooltipGridHtml(content.rows), content.subtitle);
  };
}

export function toneForSign(value: number): "up" | "down" | "flat" {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "flat";
}

export function signedHtml(value: number, formatted: string): string {
  const tone = toneForSign(value);
  return `<span class="luc-chart-tooltip__delta luc-chart-tooltip__delta--${tone}">${escapeHtml(formatted)}</span>`;
}
