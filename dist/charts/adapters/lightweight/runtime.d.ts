import * as LightweightCharts from "lightweight-charts";
//#region src/charts/adapters/lightweight/runtime.d.ts
export type LightweightModule = typeof LightweightCharts;
export type LightweightChart = ReturnType<LightweightModule["createChart"]>;
export type LightweightSeries = ReturnType<LightweightChart["addSeries"]>;
export type LightweightPane = ReturnType<LightweightChart["panes"]>[number];
export type LightweightPriceLine = ReturnType<LightweightSeries["createPriceLine"]>;
export type LightweightSeriesKind = "candlestick" | "line" | "area" | "histogram" | "baseline" | "bar";
export type LightweightTime = LightweightCharts.Time;
export type LightweightUTCTimestamp = LightweightCharts.UTCTimestamp;
export type LightweightSeriesData = LightweightCharts.CandlestickData<LightweightCharts.Time> | LightweightCharts.LineData<LightweightCharts.Time> | LightweightCharts.AreaData<LightweightCharts.Time> | LightweightCharts.HistogramData<LightweightCharts.Time> | LightweightCharts.BaselineData<LightweightCharts.Time> | LightweightCharts.BarData<LightweightCharts.Time> | LightweightCharts.WhitespaceData<LightweightCharts.Time>;
export type LightweightMouseEvent = LightweightCharts.MouseEventParams<LightweightCharts.Time>;
export declare function loadLightweightCharts(): Promise<LightweightModule>;
/** Chart engines take seconds; Luc UI's canonical time unit is milliseconds. */
export declare function toChartTime(ms: number): LightweightCharts.UTCTimestamp;
export declare function fromChartTime(time: LightweightCharts.Time): number | null;
//#endregion
//# sourceMappingURL=runtime.d.ts.map