import type { ChartTheme } from "../../core/theme";
import type {
  LightweightChart,
  LightweightModule,
  LightweightSeries,
  LightweightSeriesData,
  LightweightSeriesKind,
} from "./runtime";
import { toChartTime } from "./runtime";

export interface LightweightBinding {
  kind: LightweightSeriesKind;
  series: LightweightSeries;
  paneIndex: number;
  /**
   * The last data reference written through this controller.
   *
   * A theme, pane option or scale update rebuilds the option objects but does
   * not replace the prepared data. Remembering the reference avoids calling
   * `setData()` for history that has not changed.
   */
  data: readonly LightweightSeriesData[];
}

export interface LightweightController {
  chart: LightweightChart;
  module: LightweightModule;
  theme: ChartTheme;
  /** Create or update a named series in place. */
  upsertSeries: (
    id: string,
    kind: LightweightSeriesKind,
    options: Record<string, unknown>,
    data: readonly LightweightSeriesData[],
    paneIndex?: number,
  ) => LightweightSeries;
  /** Full-history replacement, matching the engine's `setData` contract. */
  setSeriesData: (id: string, data: readonly LightweightSeriesData[]) => LightweightSeries;
  /**
   * Incremental append / latest-point replacement, matching the engine's
   * `update` contract. Time must be greater than or equal to the last point.
   */
  updateSeries: (id: string, item: LightweightSeriesData) => LightweightSeries;
  getSeries: (id: string) => LightweightSeries | null;
  removeSeries: (id: string) => void;
  fit: () => void;
  setVisibleRange: (fromMs: number, toMs: number) => void;
}

export interface LightweightControllerState {
  controller: LightweightController;
  bindings: Map<string, LightweightBinding>;
}

function seriesDefinitions(module: LightweightModule): Record<LightweightSeriesKind, unknown> {
  return {
    candlestick: module.CandlestickSeries,
    line: module.LineSeries,
    area: module.AreaSeries,
    histogram: module.HistogramSeries,
    baseline: module.BaselineSeries,
    bar: module.BarSeries,
  };
}

function restoreViewport(chart: LightweightChart, range: ReturnType<ReturnType<LightweightChart["timeScale"]>["getVisibleRange"]>): void {
  if (!range) return;
  try {
    chart.timeScale().setVisibleRange(range);
  } catch {
    /* A replacement during teardown may race the engine's private state. */
  }
}

export function createLightweightController(
  chart: LightweightChart,
  module: LightweightModule,
  theme: ChartTheme,
): LightweightControllerState {
  const bindings = new Map<string, LightweightBinding>();
  const definitions = seriesDefinitions(module);

  const requireSeries = (id: string): LightweightBinding => {
    const binding = bindings.get(id);
    if (!binding) throw new Error(`[luc-ui] Unknown Lightweight Charts series "${id}"`);
    return binding;
  };

  const controller: LightweightController = {
    chart,
    module,
    theme,
    upsertSeries(id, kind, options, data, paneIndex = 0) {
      let binding = bindings.get(id);
      if (binding && (binding.kind !== kind || binding.paneIndex !== paneIndex)) {
        const visibleRange = chart.timeScale().getVisibleRange();
        chart.removeSeries(binding.series);
        bindings.delete(id);
        binding = undefined;
        const series = chart.addSeries(definitions[kind] as never, options as never, paneIndex);
        series.setData(data as never);
        bindings.set(id, { kind, series, paneIndex, data });
        restoreViewport(chart, visibleRange);
        return series;
      }
      if (!binding) {
        const series = chart.addSeries(definitions[kind] as never, options as never, paneIndex);
        series.setData(data as never);
        bindings.set(id, { kind, series, paneIndex, data });
        return series;
      }
      binding.series.applyOptions(options as never);
      if (binding.data !== data) {
        binding.series.setData(data as never);
        binding.data = data;
      }
      return binding.series;
    },
    setSeriesData(id, data) {
      const binding = requireSeries(id);
      binding.series.setData(data as never);
      binding.data = data;
      return binding.series;
    },
    updateSeries(id, item) {
      const { series } = requireSeries(id);
      series.update(item as never);
      return series;
    },
    getSeries(id) {
      return bindings.get(id)?.series ?? null;
    },
    removeSeries(id) {
      const binding = bindings.get(id);
      if (!binding) return;
      chart.removeSeries(binding.series);
      bindings.delete(id);
    },
    fit() {
      chart.timeScale().fitContent();
    },
    setVisibleRange(fromMs, toMs) {
      chart.timeScale().setVisibleRange({ from: toChartTime(fromMs), to: toChartTime(toMs) });
    },
  };

  return { controller, bindings };
}
