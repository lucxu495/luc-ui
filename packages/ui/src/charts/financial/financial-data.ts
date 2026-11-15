import type { ChartFormat, SeriesTone } from "../types";
import { toChartTime, type LightweightSeriesKind } from "../adapters/lightweight/runtime";

export type FinancialTime = number | string | Date;

export interface Candle {
  /** Epoch milliseconds, a `Date`, or an ISO-8601 string. */
  time: FinancialTime;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface VolumePoint {
  time: FinancialTime;
  value: number;
  direction?: "up" | "down" | "neutral";
}

export interface OverlayPoint {
  time: FinancialTime;
  /**
   * `null` is explicit whitespace. It becomes a time-only item for Lightweight
   * Charts; it is never interpolated or replaced with a nearby value.
   */
  value: number | null;
}

export interface FinancialOverlay {
  id: string;
  label: string;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  lineType?: "solid" | "dashed" | "dotted";
  /**
   * `0` shares the price pane. A positive value selects an additional pane
   * lane after the optional volume pane; lanes are packed continuously.
   */
  paneIndex?: number;
  referenceLines?: readonly number[];
}

export interface IndicatorSeries {
  id: string;
  label?: string;
  kind: Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "baseline">;
  data: readonly OverlayPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  /** Format only the values this pane series contributes to the tooltip. */
  format?: ChartFormat;
}

export interface IndicatorPane {
  id: string;
  label: string;
  series: readonly IndicatorSeries[];
  /** Horizontal guides, e.g. 30/70 for an oscillator. */
  referenceLines?: readonly number[];
  /** Share of the chart height. Price pane defaults to 3. */
  stretch?: number;
}

/**
 * These native series consume one close value per time. Bar and candlestick
 * remain available through the typed `onReady`/`LightweightSurface` escape
 * hatch when the caller actually has OHLC rows.
 */
export type PriceSeriesKind = Extract<LightweightSeriesKind, "line" | "area" | "histogram" | "baseline">;

export interface PriceSeriesPoint {
  time: FinancialTime;
  /** `null` is whitespace, exactly as in an overlay series. */
  close: number | null;
}

/**
 * A clean close-only price series for comparison charts and notebook output.
 *
 * A financial chart takes either `candles` or `series`, not both. Indicators
 * remain separate prepared panes, so the price input never has to pretend to be
 * OHLC data merely to get a lower Sharpe pane.
 */
export interface PriceSeriesData {
  /** Stable across renders. Defaults to `price-${index}` when omitted. */
  id?: string;
  label?: string;
  kind?: PriceSeriesKind;
  data: readonly PriceSeriesPoint[];
  tone?: SeriesTone;
  color?: string;
  lineWidth?: number;
  /** `0` is the price pane; positive values choose a packed additional lane. */
  paneIndex?: number;
  referenceLines?: readonly number[];
}

export class FinancialDataError extends Error {
  readonly code:
    | "time"
    | "order"
    | "duplicate-time"
    | "value"
    | "ohlc"
    | "range"
    | "reference"
    | "identity";

  constructor(code: FinancialDataError["code"], message: string) {
    super(message);
    this.name = "FinancialDataError";
    this.code = code;
  }
}

export interface CandleData {
  time: ReturnType<typeof toChartTime>;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface ValueData {
  time: ReturnType<typeof toChartTime>;
  value?: number;
}

export interface PreparedCandles {
  rows: readonly (Candle & { ms: number })[];
  data: readonly CandleData[];
}

export interface PreparedVolume {
  source: readonly VolumePoint[];
  data: readonly (ValueData & { colorDirection?: VolumePoint["direction"] })[];
}

export interface PreparedValueSeries<T> {
  source: T;
  data: readonly ValueData[];
}

export interface PreparedPriceSeries {
  source: PriceSeriesData;
  id: string;
  label: string;
  kind: PriceSeriesKind;
  data: readonly ValueData[];
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATE_TIME =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d+))?)?(Z|[+-]\d{2}:\d{2})$/;

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseIsoTime(value: string, context: string): number {
  const dateOnly = ISO_DATE.exec(value);
  if (dateOnly) {
    const year = Number(dateOnly[1]);
    const month = Number(dateOnly[2]);
    const day = Number(dateOnly[3]);
    if (!validCalendarDate(year, month, day)) {
      throw new FinancialDataError("time", `${context}: invalid ISO date "${value}"`);
    }
    return Date.UTC(year, month - 1, day);
  }

  const dateTime = ISO_DATE_TIME.exec(value);
  if (!dateTime) {
    throw new FinancialDataError(
      "time",
      `${context}: use epoch milliseconds, a Date, an ISO date, or an ISO datetime with Z/offset`,
    );
  }
  const year = Number(dateTime[1]);
  const month = Number(dateTime[2]);
  const day = Number(dateTime[3]);
  const hour = Number(dateTime[4]);
  const minute = Number(dateTime[5]);
  const second = Number(dateTime[6] ?? "0");
  if (
    !validCalendarDate(year, month, day) ||
    hour > 23 ||
    minute > 59 ||
    second > 59
  ) {
    throw new FinancialDataError("time", `${context}: invalid ISO datetime "${value}"`);
  }
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    throw new FinancialDataError("time", `${context}: invalid ISO datetime "${value}"`);
  }
  return parsed;
}

/**
 * Parse one chart time as epoch milliseconds.
 *
 * Numeric inputs are epoch milliseconds by contract. ISO datetimes without a
 * timezone are rejected because `Date.parse` would otherwise make the result
 * depend on the host timezone. Date-only strings are UTC calendar days.
 */
export function financialTimeToMs(value: FinancialTime, context = "time"): number {
  if (value instanceof Date) {
    const time = value.getTime();
    if (!Number.isFinite(time)) {
      throw new FinancialDataError("time", `${context}: received an invalid Date`);
    }
    return time;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new FinancialDataError("time", `${context}: epoch milliseconds must be finite`);
    }
    return value;
  }
  return parseIsoTime(value, context);
}

function assertFinite(value: unknown, context: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FinancialDataError("value", `${context}: value must be a finite number`);
  }
}

function assertNonNegativeInteger(value: number | undefined, context: string, fallback = 0): number {
  if (value === undefined) return fallback;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new FinancialDataError("identity", `${context}: paneIndex must be a non-negative integer`);
  }
  return value;
}

export function validateReferenceLines(levels: readonly number[] | undefined, context: string): void {
  const seen = new Set<number>();
  for (const [index, level] of (levels ?? []).entries()) {
    if (!Number.isFinite(level)) {
      throw new FinancialDataError("reference", `${context}.referenceLines[${index}]: level must be finite`);
    }
    if (seen.has(level)) {
      throw new FinancialDataError("reference", `${context}.referenceLines[${index}]: duplicate level ${level}`);
    }
    seen.add(level);
  }
}

function nextChartTime(time: number, previous: number | null, context: string): number {
  if (previous !== null && time < previous) {
    throw new FinancialDataError("order", `${context}: time must be ordered from earliest to latest`);
  }
  if (previous !== null && time === previous) {
    throw new FinancialDataError(
      "duplicate-time",
      `${context}: two rows resolve to the same second after Lightweight Charts truncation`,
    );
  }
  return time;
}

export function prepareCandles(candles: readonly Candle[]): PreparedCandles {
  const rows: (Candle & { ms: number })[] = [];
  const data: CandleData[] = [];
  let previousSecond: number | null = null;

  candles.forEach((candle, index) => {
    const context = `candles[${index}]`;
    const ms = financialTimeToMs(candle.time, `${context}.time`);
    const time = toChartTime(ms);
    previousSecond = nextChartTime(time, previousSecond, context);
    assertFinite(candle.open, `${context}.open`);
    assertFinite(candle.high, `${context}.high`);
    assertFinite(candle.low, `${context}.low`);
    assertFinite(candle.close, `${context}.close`);
    if (
      candle.high < candle.low ||
      candle.high < candle.open ||
      candle.high < candle.close ||
      candle.low > candle.open ||
      candle.low > candle.close
    ) {
      throw new FinancialDataError(
        "ohlc",
        `${context}: require low <= open/close <= high`,
      );
    }
    rows.push({ ...candle, ms });
    data.push({
      time,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
    });
  });

  return { rows, data };
}

function prepareValues(
  points: readonly OverlayPoint[],
  context: string,
): PreparedValueSeries<readonly OverlayPoint[]> {
  const data: ValueData[] = [];
  let previousSecond: number | null = null;
  points.forEach((point, index) => {
    const rowContext = `${context}[${index}]`;
    const time = toChartTime(financialTimeToMs(point.time, `${rowContext}.time`));
    previousSecond = nextChartTime(time, previousSecond, rowContext);
    if (point.value !== null) assertFinite(point.value, `${rowContext}.value`);
    data.push(point.value === null ? { time } : { time, value: point.value });
  });
  return { source: points, data };
}

export function prepareVolume(volume: readonly VolumePoint[] | undefined): PreparedVolume {
  const data: PreparedVolume["data"][number][] = [];
  let previousSecond: number | null = null;
  (volume ?? []).forEach((point, index) => {
    const context = `volume[${index}]`;
    const time = toChartTime(financialTimeToMs(point.time, `${context}.time`));
    previousSecond = nextChartTime(time, previousSecond, context);
    assertFinite(point.value, `${context}.value`);
    if (point.value < 0) {
      throw new FinancialDataError("value", `${context}.value: volume cannot be negative`);
    }
    data.push({ time, value: point.value, colorDirection: point.direction });
  });
  return { source: volume ?? [], data };
}

export function prepareOverlay(
  overlay: FinancialOverlay,
  index: number,
): PreparedValueSeries<FinancialOverlay> {
  if (!overlay.id.trim()) {
    throw new FinancialDataError("identity", `overlays[${index}].id: id must not be empty`);
  }
  validateReferenceLines(overlay.referenceLines, `overlays[${index}]`);
  assertNonNegativeInteger(overlay.paneIndex, `overlays[${index}]`);
  return {
    source: overlay,
    data: prepareValues(overlay.data, `overlays[${index}].data`).data,
  };
}

export function prepareIndicatorSeries(series: IndicatorSeries, context: string): PreparedValueSeries<IndicatorSeries> {
  if (!series.id.trim()) {
    throw new FinancialDataError("identity", `${context}.id: id must not be empty`);
  }
  return {
    source: series,
    data: prepareValues(series.data, `${context}.data`).data,
  };
}

export function preparePriceSeries(
  series: PriceSeriesData,
  index: number,
): PreparedPriceSeries {
  const context = `series[${index}]`;
  const data: ValueData[] = [];
  let previousSecond: number | null = null;
  series.data.forEach((point, pointIndex) => {
    const rowContext = `${context}.data[${pointIndex}]`;
    const time = toChartTime(financialTimeToMs(point.time, `${rowContext}.time`));
    previousSecond = nextChartTime(time, previousSecond, rowContext);
    if (point.close !== null) assertFinite(point.close, `${rowContext}.close`);
    data.push(point.close === null ? { time } : { time, value: point.close });
  });
  validateReferenceLines(series.referenceLines, context);
  assertNonNegativeInteger(series.paneIndex, context);
  const id = series.id ?? `price-${index}`;
  if (!id.trim()) {
    throw new FinancialDataError("identity", `${context}.id: id must not be empty`);
  }
  return {
    source: series,
    id,
    label: series.label ?? id,
    kind: series.kind ?? "line",
    data,
  };
}

export interface FinancialRange {
  from: number;
  to: number;
}

export function validateFinancialRange(range: FinancialRange | null | undefined): void {
  if (range === undefined || range === null) return;
  assertFinite(range.from, "range.from");
  assertFinite(range.to, "range.to");
  if (range.to <= range.from) {
    throw new FinancialDataError("range", "range: require finite epoch milliseconds with to > from");
  }
}

export function paneIndexFor(value: number | undefined): number {
  return assertNonNegativeInteger(value, "paneIndex");
}
