import { AxisSide, YScaleMode } from "../../core/axis.js";
import { ChartTheme } from "../../core/theme-tokens.js";
import { LightweightChart, LightweightModule, LightweightSeries } from "./runtime.js";
//#region src/charts/adapters/lightweight/lightweight-surface.d.ts
export type LightweightSeriesKind = "candlestick" | "line" | "area" | "histogram" | "baseline" | "bar";
export interface LightweightController {
  chart: LightweightChart;
  module: LightweightModule;
  theme: ChartTheme;
  /**
   * Create or update a named series. Calling it again with the same id updates
   * in place, so a theme or data change never resets the visible range.
   */
  upsertSeries: (id: string, kind: LightweightSeriesKind, options: Record<string, unknown>, data: readonly unknown[], paneIndex?: number) => LightweightSeries;
  removeSeries: (id: string) => void;
  fit: () => void;
  setVisibleRange: (fromMs: number, toMs: number) => void;
}
export interface LightweightSurfaceProps {
  build: (controller: LightweightController) => void;
  syncGroup?: string | null;
  /**
   * Price at a given millisecond timestamp, used to place a *remote* crosshair.
   * Supplied by the consumer so the surface never reaches into engine data.
   */
  resolvePrice?: (ms: number) => number | null;
  className?: string;
  ariaLabel?: string;
  ariaDescription?: string;
  /**
   * Which price scale the plate uses and how it maps values.
   *
   * `mode` is the same `linear` / `log` contract the ECharts lane uses — the
   * engine maps the *same* real values, nothing upstream is transformed. The
   * gutter is reserved at the shared `CHART_PLOT_LAYOUT.axisGutter` width so a
   * stacked research column shares one plot rectangle with the analytical lane
   * instead of each chart sizing its plate from its own longest label.
   */
  priceScale?: {
    side?: AxisSide;
    mode?: YScaleMode;
  };
  /**
   * The unit-aware plate formatters.
   *
   * Lightweight Charts' own price formats are unit-blind (`83402.01`), which is
   * how a currency chart ended up without a `$`. The consumer passes the LUC
   * formatter: `priceFormatter` renders the crosshair/last-value label at full
   * precision, `tickFormatter` renders the axis ticks compactly.
   */
  priceFormatter?: (value: number) => string;
  tickFormatter?: (values: number[]) => string[];
  /**
   * The engine's own pointer position, normalised for a caller that draws an
   * overlay (an event tooltip, a pinned readout).
   *
   * Lightweight Charts has no annotation tooltip: a series marker prints a
   * permanent `text` and nothing else. The cursor is therefore published as a
   * plain value — the timestamp under the pointer plus the pointer's own
   * position in plot pixels — so the *consumer* decides what to show without
   * reaching into engine internals. It never carries data and never triggers a
   * React render of its own.
   */
  onCrosshair?: (position: CrosshairPosition) => void;
  onReady?: (chart: LightweightChart) => void;
  /**
   * Create the engine on mount instead of waiting for proximity/an idle period.
   * See `useChartArm`: the plate is in the layout either way.
   */
  eager?: boolean;
}
/** The pointer's position on the plate, in the chart's own pixel space. */
export interface CrosshairPosition {
  /** The timestamp under the pointer, or `null` when the pointer left. */
  timeMs: number | null;
  /** Pointer x within the plate, in CSS pixels. */
  x: number | null;
  /** Pointer y within the plate, in CSS pixels. */
  y: number | null;
}
/**
 * The one place Lightweight Charts is created, synchronised and disposed.
 *
 * `build` runs on mount and again whenever the consumer's data or theme
 * changes. It updates series in place, so a theme flip keeps the user's zoom
 * and never flashes. Pointer handling stays inside the engine and reaches the
 * sync bus as a normalised cursor — a mousemove never triggers a React render.
 */
export declare function LightweightSurface({ build, syncGroup, resolvePrice, className, ariaLabel, ariaDescription, priceScale, priceFormatter, tickFormatter, onCrosshair, onReady, eager }: LightweightSurfaceProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=lightweight-surface.d.ts.map