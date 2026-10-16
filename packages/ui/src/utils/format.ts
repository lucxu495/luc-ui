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

function resolveFractionDigits(
  value: number,
  options: NumericFormatOptions,
): Pick<Intl.NumberFormatOptions, "minimumFractionDigits" | "maximumFractionDigits"> {
  const { minimumFractionDigits, maximumFractionDigits, kind = "number" } = options;
  if (minimumFractionDigits !== undefined || maximumFractionDigits !== undefined) {
    return {
      minimumFractionDigits: minimumFractionDigits ?? 0,
      maximumFractionDigits: maximumFractionDigits ?? minimumFractionDigits ?? 0,
    };
  }
  if (kind === "percent") {
    // "+12.4%" and "+2.1%" read better than "+12.40%"; sub-0.1% keeps detail.
    const digits = value === 0 || Math.abs(value) >= 0.1 ? 1 : 2;
    return { minimumFractionDigits: digits, maximumFractionDigits: digits };
  }
  if (kind === "decimal") {
    const digits = Math.abs(value) >= 100 ? 1 : 2;
    return { minimumFractionDigits: digits, maximumFractionDigits: digits };
  }
  // Currency defaults to whole units ("$128,431"), which is what dashboards
  // want. Pass `minimumFractionDigits` when the instrument trades in cents.
  return { minimumFractionDigits: 0, maximumFractionDigits: 0 };
}

/**
 * Deterministic numeric formatting. Never throws on `NaN`/`Infinity` — an
 * unavailable metric renders as an em dash rather than "NaN" in a dashboard.
 */
export function formatNumber(value: number | null | undefined, options: NumericFormatOptions = {}): string {
  if (value === null || value === undefined || Number.isNaN(value) || !Number.isFinite(value)) {
    return "—";
  }

  const { kind = "number", locale = "en-US", currency = "USD", suffix, signed } = options;
  const fraction = resolveFractionDigits(value, { ...options, kind });
  /*
   * A value that rounds to zero must not print a minus sign.
   *
   * An engine computing a tick can land on `-0` or on `-1e-16`, and
   * `Intl.NumberFormat` renders both as "-0.0" — an axis or a table would then
   * claim a negative reading where the data has none. (`-0` is not `< 0`, hence
   * the explicit check.)
   */
  const digits = fraction.maximumFractionDigits ?? 0;
  let display = Object.is(value, -0) ? 0 : value;
  if (display < 0 && Math.round(-display * 10 ** digits) === 0) display = 0;

  const intlOptions: Intl.NumberFormatOptions = {
    ...fraction,
    useGrouping: true,
    signDisplay: signed ? "exceptZero" : "auto",
  };

  if (kind === "percent") {
    // `kind: "percent"` expects an already-scaled value (2.1 -> "2.1%").
    intlOptions.style = "decimal";
  } else if (kind === "currency") {
    intlOptions.style = "currency";
    intlOptions.currency = currency;
  } else if (kind === "compact") {
    intlOptions.notation = "compact";
    intlOptions.maximumFractionDigits = options.maximumFractionDigits ?? 1;
    // A compact figure keeps its unit when the caller named one: an axis tick
    // reads "$124.7K", not the unitless "124.7K". `currency` is only honoured
    // here when it was passed explicitly, so `formatCompact(1234)` is unchanged.
    if (options.currency !== undefined) {
      intlOptions.style = "currency";
      intlOptions.currency = currency;
    }
  }

  const formatted = new Intl.NumberFormat(locale, intlOptions).format(display);
  const withUnit = kind === "percent" ? `${formatted}%` : formatted;
  return suffix ? `${withUnit}${suffix}` : withUnit;
}

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

export function splitNumberParts(value: number | null | undefined, options: NumericFormatOptions = {}): NumberParts {
  const formatted = formatNumber(value, options);
  if (formatted === "—") {
    return { sign: "", integer: "—", fraction: "", unit: "", formatted };
  }
  const match = /^(?<sign>[-+])?(?<integer>[\d,]+)(?<fraction>\.\d+)?(?<unit>.*)$/.exec(formatted);
  if (!match?.groups) {
    return { sign: "", integer: formatted, fraction: "", unit: "", formatted };
  }
  return {
    sign: match.groups.sign ?? "",
    integer: match.groups.integer ?? "",
    fraction: match.groups.fraction ?? "",
    unit: match.groups.unit ?? "",
    formatted,
  };
}

export type DeltaTone = "positive" | "negative" | "neutral";

export function resolveDeltaTone(value: number | null | undefined, invert = false): DeltaTone {
  if (value === null || value === undefined || Number.isNaN(value) || value === 0) return "neutral";
  const isPositive = value > 0;
  if (invert) return isPositive ? "negative" : "positive";
  return isPositive ? "positive" : "negative";
}

export interface DeltaFormatOptions extends NumericFormatOptions {
  /** Treat a fall as good (e.g. error rate, latency). */
  invert?: boolean;
}

export function formatDelta(value: number | null | undefined, options: DeltaFormatOptions = {}): string {
  const { invert: _invert, ...formatOptions } = options;
  return formatNumber(value, { kind: "percent", signed: true, ...formatOptions });
}

export function formatCompact(value: number | null | undefined, options: NumericFormatOptions = {}): string {
  return formatNumber(value, { kind: "compact", ...options });
}

/**
 * Byte size for file lists. Binary units (KiB steps) with the familiar short
 * labels, because "1.4 MB" is what a person expects to read next to a file.
 */
export function formatBytes(bytes: number | null | undefined, options: { decimals?: number } = {}): string {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1000) return `${Math.round(bytes)} B`;
  const units = ["kB", "MB", "GB", "TB"];
  let value = bytes / 1000;
  let unitIndex = 0;
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex += 1;
  }
  const decimals = options.decimals ?? (value >= 100 ? 0 : 1);
  return `${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)} ${units[unitIndex]}`;
}

/** Clamp helper used by creative components; exported for consumers too. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
