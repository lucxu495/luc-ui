/**
 * LUC URL codecs.
 *
 * A codec is the whole vocabulary a URL parameter needs: how to read a string
 * from the address bar, how to write it back, and when two values are the same.
 * The codecs are pure and framework-free on purpose — `@luc/ui` never imports a
 * router, and the same codec is reused by the optional Next/nuqs adapter.
 *
 * Two rules keep a shared link honest:
 *
 *  1. **Invalid input is not an error.** A codec returns `undefined` for a
 *     value it cannot read, and the caller falls back to the default. A URL is
 *     user input; `?range=garbage` must render the default view, never crash.
 *  2. **Every value is bounded.** Raw strings, lists and numbers are clamped,
 *     so a pasted megabyte-long query string cannot reach a component.
 */

import { parseDate } from "@internationalized/date";
import type { CalendarDate } from "@internationalized/date";

export interface ParamCodec<T> {
  /** Read a parameter. `undefined` means "missing or not usable". */
  decode(raw: string | null | undefined): T | undefined;
  /** Write a parameter. Must be deterministic and round-trip with `decode`. */
  encode(value: T): string;
  /** Equality, so a default value can be omitted from the URL. */
  equals?(a: T, b: T): boolean;
}

/** A pasted URL should never be able to move more than this much text. */
const MAX_RAW_LENGTH = 512;

function usable(raw: string | null | undefined, maxLength = MAX_RAW_LENGTH): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  if (raw.length === 0 || raw.length > maxLength) return undefined;
  return raw;
}

/** Structural equality for the object/array-shaped codecs below. */
export function structuralEquals(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => structuralEquals(item, b[index]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => structuralEquals(left[key], right[key]));
  }
  return false;
}

export interface StringParamOptions {
  maxLength?: number;
}

export function stringParam(options: StringParamOptions = {}): ParamCodec<string> {
  return {
    decode: (raw) => usable(raw, options.maxLength),
    encode: (value) => value,
  };
}

export function booleanParam(): ParamCodec<boolean> {
  return {
    decode: (raw) => {
      if (raw === "1" || raw === "true") return true;
      if (raw === "0" || raw === "false") return false;
      return undefined;
    },
    encode: (value) => (value ? "1" : "0"),
  };
}

export interface NumberParamOptions {
  min?: number;
  max?: number;
  /** Reject fractional input, e.g. a page cursor. */
  integer?: boolean;
}

export function numberParam(options: NumberParamOptions = {}): ParamCodec<number> {
  const { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, integer = false } = options;
  return {
    decode: (raw) => {
      if (!usable(raw, 48)) return undefined;
      const value = Number(raw);
      if (!Number.isFinite(value)) return undefined;
      if (integer && !Number.isInteger(value)) return undefined;
      if (value < min || value > max) return undefined;
      return value;
    },
    encode: (value) => String(value),
  };
}

/** A closed set of strings — a view mode, a range preset, a sort key. */
export function enumParam<const V extends readonly string[]>(values: V): ParamCodec<V[number]> {
  const allowed = new Set<string>(values);
  return {
    decode: (raw) => {
      const value = usable(raw, 64);
      return value !== undefined && allowed.has(value) ? (value as V[number]) : undefined;
    },
    encode: (value) => value,
  };
}

export interface ListParamOptions {
  /** Comma is the separator; a value containing one is therefore not valid. */
  separator?: string;
  maxItems?: number;
  itemMaxLength?: number;
}

/**
 * A compact list — `series=close,sma50,sma200`.
 *
 * Order is preserved (a table's column order is meaningful) and duplicates are
 * dropped so a link with the same series twice cannot render it twice.
 */
export function listParam<T>(item: ParamCodec<T>, options: ListParamOptions = {}): ParamCodec<T[]> {
  const { separator = ",", maxItems = 24, itemMaxLength = 64 } = options;
  return {
    decode: (raw) => {
      const value = usable(raw);
      if (value === undefined) return undefined;
      const parts = value
        .split(separator)
        .slice(0, maxItems)
        .map((part) => item.decode(part.slice(0, itemMaxLength)))
        .filter((entry): entry is T => entry !== undefined);
      return parts.length > 0 ? dedupe(parts, item.equals) : undefined;
    },
    encode: (value) => value.slice(0, maxItems).map((entry) => item.encode(entry)).join(separator),
    equals: (a, b) => structuralEquals(a, b),
  };
}

function dedupe<T>(values: T[], equals?: (a: T, b: T) => boolean): T[] {
  const seen: T[] = [];
  for (const value of values) {
    const isDuplicate = seen.some((entry) => (equals ? equals(entry, value) : Object.is(entry, value)));
    if (!isDuplicate) seen.push(value);
  }
  return seen;
}

/**
 * A date-only value.
 *
 * `CalendarDate` in, `YYYY-MM-DD` out — never through a JavaScript `Date`. That
 * is what stops `2026-09-27` from becoming the 26th west of Greenwich. See
 * `docs/DATE_TIME_GUIDE.md`.
 */
export function dateOnlyParam(): ParamCodec<CalendarDate> {
  return {
    decode: (raw) => {
      const value = usable(raw, 10);
      if (value === undefined || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
      try {
        return parseDate(value);
      } catch {
        return undefined;
      }
    },
    encode: (value) => value.toString(),
    equals: (a, b) => a.compare(b) === 0,
  };
}

/**
 * An absolute instant, serialized as ISO-8601 UTC and kept as epoch
 * milliseconds in state. Use it for a zoned/datetime cursor; a daily chart
 * wants `dateOnlyParam()`.
 */
export function instantParam(): ParamCodec<number> {
  return {
    decode: (raw) => {
      const value = usable(raw, 40);
      if (value === undefined) return undefined;
      const ms = Date.parse(value);
      return Number.isFinite(ms) ? ms : undefined;
    },
    encode: (value) => new Date(value).toISOString(),
  };
}

export interface SortValue {
  id: string;
  desc: boolean;
}

/**
 * One sort definition in the conventional compact form: `sharpe` ascending,
 * `-sharpe` descending.
 */
export function sortParam(): ParamCodec<SortValue> {
  const idPattern = /^[A-Za-z0-9_.:-]{1,64}$/;
  return {
    decode: (raw) => {
      const value = usable(raw, 96);
      if (value === undefined) return undefined;
      const desc = value.startsWith("-");
      const id = desc ? value.slice(1) : value;
      if (!idPattern.test(id)) return undefined;
      return { id, desc };
    },
    encode: (value) => `${value.desc ? "-" : ""}${value.id}`,
    equals: (a, b) => a.id === b.id && a.desc === b.desc,
  };
}

/** Multi-column sorting, most significant first: `-sharpe,symbol`. */
export function sortListParam(options: ListParamOptions = {}): ParamCodec<SortValue[]> {
  return listParam(sortParam(), options);
}

/** ISO-8601 currency/region code — a currency selector. */
export function currencyParam(): ParamCodec<string> {
  return {
    decode: (raw) => {
      const value = usable(raw, 3);
      return value !== undefined && /^[A-Za-z]{3}$/.test(value) ? value.toUpperCase() : undefined;
    },
    encode: (value) => value.toUpperCase(),
  };
}

/**
 * Make a value optional.
 *
 * A missing parameter reads as `null` rather than as "invalid", which is what
 * an optional filter needs: `?cursor=` and no `cursor` both mean "nothing
 * pinned". `null` serializes to the empty string, and the encoder drops empty
 * values, so an unset optional never leaves a stub in the URL.
 */
export function nullableParam<T>(codec: ParamCodec<T>): ParamCodec<T | null> {
  return {
    decode: (raw) => {
      if (raw === null || raw === undefined || raw.length === 0) return null;
      return codec.decode(raw) ?? null;
    },
    encode: (value) => (value === null ? "" : codec.encode(value)),
    equals: (a, b) => {
      if (a === null || b === null) return a === b;
      return codec.equals ? codec.equals(a, b) : Object.is(a, b);
    },
  };
}
