/**
 * LUC chart system — public surface.
 *
 * Import from `@luc/ui` or `@luc/ui/charts`. Engine internals (option builders,
 * tooltip markup, family dispatch) are deliberately *not* exported: the public
 * API is specs, components, formatters, annotations and the sync bus.
 */

/* Contracts */
export * from "./types";

/* Chrome — engine independent */
export * from "./chart-card";

/* Core */
export * from "./core/axis";
export * from "./core/data";
export * from "./core/export";
export * from "./core/formatters";
export * from "./core/matrix-labels";
export * from "./core/palette";
export * from "./core/sizing";
export * from "./core/static-capture";
export * from "./core/sync";
export * from "./core/sync-context";
export * from "./core/range-group";
export { useRangeGroupState } from "./core/use-range-group";
export {
  watchPlateGesture,
  WHEEL_GESTURE_IDLE_MS,
  type PlateGesture,
} from "./core/gesture";
export * from "./core/inspection";
export { useChartTheme, useChartMotion, useElementSize, type ElementSize } from "./core/use-chart-theme";
export { CHART_ANIMATION_POINT_LIMIT, type ChartMotionBudget } from "./core/use-chart-theme";
export {
  defaultChartTheme,
  paletteColor,
  resolveChartTheme,
  toneColor,
  withAlpha,
  type ChartTheme,
} from "./core/theme";
export {
  CHART_THEME_TOKEN_NAMES,
  DEFAULT_CHART_THEME_METRICS,
  DARK_CHART_THEME_TOKEN_VALUES,
  chartThemeFromTokens,
  darkChartTheme,
  type ChartThemeMetrics,
  type ChartThemeMode,
  type ChartThemeTokenName,
} from "./core/theme-tokens";
export {
  CHART_THEME_TOKEN_VALUES,
  LIGHT_CHART_THEME_TOKEN_VALUES,
  chartThemeFallback,
  lightChartTheme,
} from "./core/theme-tokens-light";

/* Engine escape hatches (advanced) */
export {
  loadECharts,
  registerEChartsMap,
  type EChartsInstance,
  type EChartsModule,
} from "./adapters/echarts/runtime";
export {
  loadLightweightCharts,
  toChartTime,
  fromChartTime,
  type LightweightChart,
} from "./adapters/lightweight/runtime";
export {
  LightweightSurface,
  type LightweightController,
  type LightweightSeriesKind,
  type CrosshairPosition,
} from "./adapters/lightweight/lightweight-surface";

/* Components */
export * from "./components/chart";
export * from "./components/chart-common";
export * from "./components/chart-data-table";
export * from "./components/cartesian-charts";
export * from "./components/band-charts";
export * from "./components/chart-toolbar";
export * from "./components/composition-charts";
export * from "./components/curve-charts";
export * from "./components/distribution-charts";
export * from "./components/diagnostic-charts";
export * from "./components/flow-charts";
export * from "./components/fullscreen";
export * from "./components/geo-charts";
export * from "./components/matrix-charts";
export * from "./components/multidimensional-charts";
export * from "./components/network-charts";
export * from "./components/radial-charts";
export * from "./components/relationship-charts";
export * from "./components/position-charts";
export * from "./components/quantitative-charts";
export * from "./components/scientific-charts";
export * from "./components/sequence-charts";
export * from "./components/small-multiples";
export * from "./components/sparkline";
export * from "./components/statistical-charts";
export * from "./components/surface3d-charts";
export * from "./components/waterfall-chart";
export * from "./components/workflow-charts";

/* Financial */
export * from "./financial/financial-chart";
