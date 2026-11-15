import { ChartTheme } from "../../core/theme-tokens.js";
import { LightweightChart, LightweightModule, LightweightSeries, LightweightSeriesData, LightweightSeriesKind } from "./runtime.js";
//#region src/charts/adapters/lightweight/chart-controller.d.ts
export interface LightweightController {
  chart: LightweightChart;
  module: LightweightModule;
  theme: ChartTheme;
  /** Create or update a named series in place. */
  upsertSeries: (id: string, kind: LightweightSeriesKind, options: Record<string, unknown>, data: readonly LightweightSeriesData[], paneIndex?: number) => LightweightSeries;
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
//#endregion
//# sourceMappingURL=chart-controller.d.ts.map