import { AxisSpec, ChartRangeSpec, ChartXValue, SeriesSpec } from "../types.js";
//#region src/charts/core/data.d.ts
export type AxisKind = "time" | "category" | "value";
export interface NormalizedTabular {
  rows: readonly object[];
  /** x values, already coerced: ms numbers for time, strings for category. */
  x: ChartXValue[];
  kind: AxisKind;
  /** Present when the x axis is numeric/time. */
  numericX: number[];
}
/** Default windows for the conventional range tokens, in milliseconds. */
export declare const DEFAULT_RANGE_DURATIONS: Readonly<Record<string, number>>;
/** Read a cell from a row of any shape. The one place the loose typing lands. */
export declare function cell(row: object, key: string): unknown;
export declare function isFiniteNumber(value: unknown): value is number;
/** Coerce a raw cell into an engine-safe number, or `null` for a gap. */
export declare function toNumber(value: unknown): number | null;
/**
 * Normalise rows against an x field. Time axes become millisecond numbers so
 * every adapter — and the sync bus — speaks one currency.
 */
export declare function normalizeTabular(rows: readonly object[], xKey: string | undefined, spec?: AxisSpec): NormalizedTabular;
/** Values for one series, aligned to the row order, gaps preserved as null. */
export declare function seriesValues(series: SeriesSpec, rows: readonly object[]): (number | null)[];
/** `[x, y]` pairs, dropping rows whose x could not be parsed. */
export declare function seriesPairs(series: SeriesSpec, normalized: NormalizedTabular): Array<[ChartXValue, number | null]>;
export declare function extent(values: readonly (number | null | undefined)[]): [number, number] | null;
export interface ChartWindow {
  from: number;
  to: number;
}
/**
 * The trailing window for a range token, anchored to the newest data point
 * rather than wall-clock time so a demo with fixed data never renders empty.
 */
export declare function resolveRangeWindow(numericX: readonly number[], range: string, ranges?: ChartRangeSpec): ChartWindow | null;
export declare function sliceWindow<T>(rows: readonly T[], numericX: readonly number[], window: ChartWindow | null): T[];
/** Nearest x value to a target — the shared-cursor lookup for sync groups. */
export declare function nearestIndex(x: readonly number[], target: number): number;
/** True when every series is empty — the chart should render the empty state. */
export declare function isSeriesEmpty(series: readonly SeriesSpec[], rows: readonly object[]): boolean;
//#endregion
//# sourceMappingURL=data.d.ts.map