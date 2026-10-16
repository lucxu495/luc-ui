//#region src/utils/format.d.ts
/**
 * Formatting helpers for data UI. They are intentionally independent of any
 * domain: the same formatter renders "Revenue $128,431" and "BTC Price $109,241".
 */
export type NumericFormatKind = "number" | "decimal" | "percent" | "currency" | "compact";
export interface NumericFormatOptions {
  kind?: NumericFormatKind;
  /** BCP-47 locale. Defaults to `en-US` for predictable, stable digit grouping. */
  locale?: string;
  /** ISO-4217 currency code, only used when `kind` is `currency`. */
  currency?: string;
  /** Fixed fraction digits. Omit to let the formatter choose. */
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Prefix/suffix applied after formatting, e.g. `%` is handled by `kind: "percent"`. */
  suffix?: string;
  /** Render an explicit `+` for positive values (useful for deltas). */
  signed?: boolean;
}
/**
 * Deterministic numeric formatting. Never throws on `NaN`/`Infinity` — an
 * unavailable metric renders as an em dash rather than "NaN" in a dashboard.
 */
export declare function formatNumber(value: number | null | undefined, options?: NumericFormatOptions): string;
/**
 * Splits a formatted number into sign / integer / fraction / unit so
 * `NumberTicker` can animate digits without animating punctuation.
 */
export interface NumberParts {
  sign: string;
  integer: string;
  fraction: string;
  unit: string;
  formatted: string;
}
export declare function splitNumberParts(value: number | null | undefined, options?: NumericFormatOptions): NumberParts;
export type DeltaTone = "positive" | "negative" | "neutral";
export declare function resolveDeltaTone(value: number | null | undefined, invert?: boolean): DeltaTone;
export interface DeltaFormatOptions extends NumericFormatOptions {
  /** Treat a fall as good (e.g. error rate, latency). */
  invert?: boolean;
}
export declare function formatDelta(value: number | null | undefined, options?: DeltaFormatOptions): string;
export declare function formatCompact(value: number | null | undefined, options?: NumericFormatOptions): string;
/**
 * Byte size for file lists. Binary units (KiB steps) with the familiar short
 * labels, because "1.4 MB" is what a person expects to read next to a file.
 */
export declare function formatBytes(bytes: number | null | undefined, options?: {
  decimals?: number;
}): string;
/** Clamp helper used by creative components; exported for consumers too. */
export declare function clamp(value: number, min: number, max: number): number;
//#endregion
//# sourceMappingURL=format.d.ts.map