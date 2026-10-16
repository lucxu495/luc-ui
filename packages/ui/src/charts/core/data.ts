/**
 * Chart data normalisation.
 *
 * The contract is deliberately small: rows in, a typed x vector and per-series
 * value vectors out. Nothing here computes analytics — it converts, filters by
 * a time window, and guards the engine boundary against `NaN`/`Infinity`, which
 * is where a bad series otherwise takes a whole page down.
 */

import type { AxisSpec, ChartXValue, ChartRangeSpec, SeriesSpec } from "../types";

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
export const DEFAULT_RANGE_DURATIONS: Readonly<Record<string, number>> = {
  "1h": 3_600_000,
  "6h": 6 * 3_600_000,
  "1d": 86_400_000,
  "1w": 7 * 86_400_000,
  "1m": 30 * 86_400_000,
  "3m": 91 * 86_400_000,
  "6m": 182 * 86_400_000,
  ytd: -1,
  "1y": 365 * 86_400_000,
  "3y": 3 * 365 * 86_400_000,
  "5y": 5 * 365 * 86_400_000,
  all: -1,
};

const MS_THRESHOLD = 1e11;

/** Read a cell from a row of any shape. The one place the loose typing lands. */
export function cell(row: object, key: string): unknown {
  return (row as Record<string, unknown>)[key];
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Coerce a raw cell into an engine-safe number, or `null` for a gap. */
export function toNumber(value: unknown): number | null {
  if (isFiniteNumber(value)) return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) && value.trim() !== "" ? parsed : null;
  }
  return null;
}

function toTime(value: unknown): number | null {
  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (isFiniteNumber(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function inferKind(values: readonly unknown[], spec?: AxisSpec): AxisKind {
  if (spec?.type === "time") return "time";
  if (spec?.type === "category") return "category";
  if (spec?.type === "value" || spec?.type === "log") return "value";
  if (values.some((value) => value instanceof Date)) return "time";
  if (values.every((value) => isFiniteNumber(value))) {
    const anyLarge = values.some((value) => Math.abs(value as number) >= MS_THRESHOLD);
    // Only genuinely large numbers read as epoch milliseconds; anything else is
    // a plain numeric axis. Callers pass `x.type: "time"` when in doubt.
    return anyLarge ? "time" : "value";
  }
  return "category";
}

/**
 * Normalise rows against an x field. Time axes become millisecond numbers so
 * every adapter — and the sync bus — speaks one currency.
 */
export function normalizeTabular(
  rows: readonly object[],
  xKey: string | undefined,
  spec?: AxisSpec,
): NormalizedTabular {
  const key = xKey ?? "x";
  const raw = rows.map((row) => cell(row, key));
  const kind = inferKind(raw, spec);

  const x: ChartXValue[] = [];
  const numericX: number[] = [];
  for (const value of raw) {
    if (kind === "time") {
      const time = toTime(value);
      x.push(time ?? Number.NaN);
      numericX.push(time ?? Number.NaN);
    } else if (kind === "value") {
      const num = toNumber(value);
      x.push(num ?? Number.NaN);
      numericX.push(num ?? Number.NaN);
    } else {
      x.push(typeof value === "string" ? value : String(value ?? ""));
      numericX.push(Number.NaN);
    }
  }

  return { rows, x, kind, numericX };
}

/** Values for one series, aligned to the row order, gaps preserved as null. */
export function seriesValues(series: SeriesSpec, rows: readonly object[]): (number | null)[] {
  if (series.data) {
    return series.data.map((entry) => {
      if (Array.isArray(entry)) return toNumber((entry as readonly unknown[])[1]);
      return toNumber(entry);
    });
  }
  return rows.map((row) => toNumber(cell(row, series.key)));
}

/** `[x, y]` pairs, dropping rows whose x could not be parsed. */
export function seriesPairs(
  series: SeriesSpec,
  normalized: NormalizedTabular,
): Array<[ChartXValue, number | null]> {
  const values = seriesValues(series, normalized.rows);
  const pairs: Array<[ChartXValue, number | null]> = [];
  for (let index = 0; index < normalized.x.length; index += 1) {
    const x = normalized.x[index];
    if (x === undefined) continue;
    if (typeof x === "number" && Number.isNaN(x)) continue;
    pairs.push([x, values[index] ?? null]);
  }
  return pairs;
}

export function extent(values: readonly (number | null | undefined)[]): [number, number] | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  for (const value of values) {
    if (!isFiniteNumber(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (min === Number.POSITIVE_INFINITY) return null;
  return [min, max];
}

export interface ChartWindow {
  from: number;
  to: number;
}

/**
 * The trailing window for a range token, anchored to the newest data point
 * rather than wall-clock time so a demo with fixed data never renders empty.
 */
export function resolveRangeWindow(
  numericX: readonly number[],
  range: string,
  ranges?: ChartRangeSpec,
): ChartWindow | null {
  const durations = ranges?.durations ?? DEFAULT_RANGE_DURATIONS;
  const duration = durations[range];
  if (duration === undefined || duration <= 0) return null;
  let to = Number.NEGATIVE_INFINITY;
  for (const value of numericX) {
    if (Number.isFinite(value) && value > to) to = value;
  }
  if (!Number.isFinite(to)) return null;
  return { from: to - duration, to };
}

export function sliceWindow<T>(
  rows: readonly T[],
  numericX: readonly number[],
  window: ChartWindow | null,
): T[] {
  if (!window) return [...rows];
  const result: T[] = [];
  for (let index = 0; index < rows.length; index += 1) {
    const x = numericX[index];
    if (x === undefined || !Number.isFinite(x)) continue;
    if (x >= window.from && x <= window.to) result.push(rows[index]!);
  }
  return result;
}

/** Nearest x value to a target — the shared-cursor lookup for sync groups. */
export function nearestIndex(x: readonly number[], target: number): number {
  if (x.length === 0) return -1;
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let index = 0; index < x.length; index += 1) {
    const value = x[index];
    if (value === undefined || !Number.isFinite(value)) continue;
    const distance = Math.abs(value - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }
  return best;
}

/** True when every series is empty — the chart should render the empty state. */
export function isSeriesEmpty(
  series: readonly SeriesSpec[],
  rows: readonly object[],
): boolean {
  if (rows.length === 0) return true;
  return series.every((item) => extent(seriesValues(item, rows)) === null);
}
