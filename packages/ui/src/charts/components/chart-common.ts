/**
 * Shared vocabulary for the Phase 4 chart packs.
 *
 * Every family in `statistical-charts`, `scientific-charts`,
 * `workflow-charts`, `quantitative-charts` and `multidimensional-charts` takes
 * the same shell props and answers the same three questions the same way:
 *
 *   · what is a *tone* (a semantic colour, never a hex value)
 *   · how is a value formatted (a `ChartFormat`, resolved by the theme layer)
 *   · what does "empty" mean (no rows, not no SVG)
 *
 * Keeping them in one internal module is what lets thirty new chart types read
 * as one system instead of thirty stickers on the same engine. It is
 * deliberately **not** exported from the package index: it is implementation
 * vocabulary, not public API.
 */

import type { ChartFormat } from "../types";
import type { EChartsInstance } from "../adapters/echarts/runtime";
import type { EChartEvent } from "../adapters/echarts/echart-surface";
import { axisFragment, type AxisFragmentOptions, type Option } from "../adapters/echarts/option";
import { formatChartValue } from "../core/formatters";
import type { ChartState } from "./chart";

export interface FamilyCommonProps {
  state?: ChartState;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
}

/** A point in a two-dimensional series. */
export interface XYPoint {
  x: number;
  y: number;
}

/** Anything with a label and a value. */
export interface LabelledValue {
  label: string;
  value: number;
}

/**
 * Format a 0–1 ratio as a percentage.
 *
 * `ChartFormat` deliberately expects an *already scaled* percentage (`42.5` →
 * `"42.5%"`), because that is what a price or a return already is. A probability
 * is the other convention: `0.425`. The renderer scales it, once, at the display
 * boundary — the caller keeps its ratio, and no chart in the library ever
 * silently multiplies a data value.
 */
export function formatRatio(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) return "—";
  const percent = value * 100;
  const rounded = Math.abs(percent) < 5 * 10 ** -decimals ? 0 : percent;
  return `${Number(rounded.toFixed(decimals))}%`;
}

/** A 0–1 value axis whose ticks are percentages (see `formatRatio`). */
export function ratioAxis(options: AxisFragmentOptions): Option {
  const axis = axisFragment(options) as Record<string, unknown>;
  const label = (axis.axisLabel ?? {}) as Record<string, unknown>;
  return {
    ...axis,
    axisLabel: {
      ...label,
      formatter: (value: number) => formatRatio(value, Number.isInteger(value * 100) ? 0 : 1),
    },
  };
}

/** A 0–1 axis: percentage by default, the caller's own format when given. */
export function ratioOrFormatAxis(format: ChartFormat | undefined, options: AxisFragmentOptions): Option {
  return format ? axisFragment({ ...options, format }) : ratioAxis(options);
}

/** A 0–1 value in a tooltip: percentage by default, the caller's format when given. */
export function formatRatioOrValue(value: number | null | undefined, format: ChartFormat | undefined): string {
  return format ? formatChartValue(value, format) : formatRatio(value);
}

export type { ChartFormat };
