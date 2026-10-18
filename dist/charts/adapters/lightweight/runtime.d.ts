import * as LightweightCharts from "lightweight-charts";
//#region src/charts/adapters/lightweight/runtime.d.ts
export type LightweightModule = typeof LightweightCharts;
export type LightweightChart = ReturnType<LightweightModule["createChart"]>;
export type LightweightSeries = ReturnType<LightweightChart["addSeries"]>;
export declare function loadLightweightCharts(): Promise<LightweightModule>;
/** Chart engines take seconds; Luc UI's canonical time unit is milliseconds. */
export declare function toChartTime(ms: number): LightweightCharts.UTCTimestamp;
export declare function fromChartTime(time: LightweightCharts.Time): number | null;
//#endregion
//# sourceMappingURL=runtime.d.ts.map