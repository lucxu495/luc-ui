import { ChartRenderer, ChartSpec, SeriesSpec } from "../types.js";
import { EChartsInstance } from "../adapters/echarts/runtime.js";
import { EChartEvent } from "../adapters/echarts/echart-surface.js";
import { ReactNode } from "react";
//#region src/charts/components/chart.d.ts
export type ChartState = "ready" | "loading" | "empty" | "error";
export interface ChartStateCopy {
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  errorAction?: ReactNode;
}
export interface ChartSurfaceProps {
  option: Record<string, unknown>;
  xValues?: readonly number[];
  syncGroup?: string | null;
  state?: ChartState;
  /** Box height. Omit to fill the parent (`ChartPlot` supplies one). */
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  copy?: ChartStateCopy;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
  /** Create the engine on mount rather than when the surface is approached. */
  eager?: boolean;
  /** Drawing layer. Defaults to `canvas`; `svg` is for capture pipelines. */
  renderer?: ChartRenderer;
  /**
   * The span the engine currently shows, in ms (`null` before it is known).
   *
   * A time axis has to label the window the reader is looking at, not the whole
   * loaded history — the surface reports the applied window here so the caller
   * can re-choose the label granularity when it materially changes.
   */
  onVisibleSpan?: (spanMs: number | null) => void;
}
/**
 * The engine boundary.
 *
 * Nothing below this point knows about loading, empty or error — and, more
 * importantly, a chart in one of those states never initialises an engine at
 * all. That is why the states take precedence over the surface rather than
 * rendering on top of it.
 */
export declare function ChartSurface({ option, xValues, syncGroup, state, height, className, ariaLabel, ariaDescription, copy, onReady, onEvent, eager, onVisibleSpan, renderer }: ChartSurfaceProps): import("react").JSX.Element;
export interface ChartProps extends ChartStateCopy {
  spec: ChartSpec<object>;
  state?: ChartState;
  height?: number | string;
  className?: string;
  /** Restrict which series are drawn. Toggling this must not refetch data. */
  visibleSeries?: readonly string[];
  ariaLabel?: string;
  ariaDescription?: string;
  emptyWhenNoData?: boolean;
  /**
   * Create the engine on mount rather than when the plot approaches the
   * viewport. Set this in a capture pipeline — an off-screen chart never arms
   * on its own, and a deferred surface captures an empty box.
   */
  eager?: boolean;
  onReady?: (chart: EChartsInstance) => void;
  onEvent?: (event: EChartEvent) => void;
}
/**
 * Declarative chart. Given a `ChartSpec`, it normalises data, applies the series
 * selection, builds the engine option and renders the right state.
 */
export declare function Chart({ spec, state, height, className, visibleSeries, ariaLabel, ariaDescription, emptyWhenNoData, eager, onReady, onEvent, ...copy }: ChartProps): import("react").JSX.Element;
/** Standalone plot box for charts that compose their own chrome. */
export declare function ChartBox({ height, className, children }: {
  height?: number | string;
  className?: string;
  children: ReactNode;
}): import("react").JSX.Element;
/**
 * Local series-visibility state for chart toolbars. Presentation state stays in
 * the component that owns it; nothing here reaches a global store.
 */
export declare function useSeriesVisibility(series: readonly SeriesSpec[], initial?: readonly string[]): {
  visible: string[];
  toggle: (key: string) => void;
  setOnly: (keys: readonly string[]) => void;
  setVisible: import("react").Dispatch<import("react").SetStateAction<string[]>>;
};
/** Local range state for a `ChartSpec.ranges` definition. */
export declare function useChartRange(spec: Pick<ChartSpec, "ranges">, initial?: string): {
  range: string;
  setRange: import("react").Dispatch<import("react").SetStateAction<string>>;
  ranges: readonly string[];
};
//#endregion
//# sourceMappingURL=chart.d.ts.map