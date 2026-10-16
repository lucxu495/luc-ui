"use client";

import type { ChartSpec, ChartFamily } from "../types";
import { Chart, type ChartState } from "./chart";
import type { EChartEvent } from "../adapters/echarts/echart-surface";
import type { EChartsInstance } from "../adapters/echarts/runtime";

export interface CartesianChartProps<TRow extends object = Record<string, unknown>>
  extends Omit<ChartSpec<TRow>, "family"> {
  /** Override the family the wrapper defaults to. Advanced. */
  family?: ChartFamily;
  state?: ChartState;
  height?: number | string;
  className?: string;
  visibleSeries?: readonly string[];
  ariaLabel?: string;
  ariaDescription?: string;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}

function createFamilyChart(defaultFamily: ChartFamily) {
  return function FamilyChart<TRow extends object = Record<string, unknown>>({
    family,
    state,
    height,
    className,
    visibleSeries,
    ariaLabel,
    ariaDescription,
    onReady,
    onEvent,
    ...spec
  }: CartesianChartProps<TRow>) {
    return (
      <Chart
        spec={{ ...(spec as Omit<ChartSpec<TRow>, "family">), family: family ?? defaultFamily }}
        state={state}
        height={height}
        className={className}
        visibleSeries={visibleSeries}
        ariaLabel={ariaLabel}
        ariaDescription={ariaDescription}
        onReady={onReady}
        onEvent={onEvent}
      />
    );
  };
}

/**
 * Line chart. `series[].smooth` gives the smooth variant, `series[].step` the
 * step variant, and a series with `area: true` the area variant — all from the
 * same component so a "line family" page cannot drift into three styles.
 */
export const LineChart = createFamilyChart("line");

/** Same engine path as `LineChart` with area fills on by default. */
export const AreaChart = createFamilyChart("area");

/**
 * Bar chart. `orientation="horizontal"` swaps the axes; `series[].stack` groups
 * bars, and `series[].stackMode="percent"` normalises them to 100%.
 */
export const BarChart = createFamilyChart("bar");

/** Scatter plot. Data comes from `xKey` plus one numeric key per series. */
export const ScatterChart = createFamilyChart("scatter");

/** Bubble chart — the same as scatter with a larger, emphasis-friendly symbol. */
export const BubbleChart = createFamilyChart("bubble");

/** Line + bar + area + dual axis, in one plot. Axis ids make the split explicit. */
export const ComposedChart = createFamilyChart("composed");

export type { ChartSpec };
