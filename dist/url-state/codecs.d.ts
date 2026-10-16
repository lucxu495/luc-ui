import { CalendarDate } from "@internationalized/date";
//#region src/url-state/codecs.d.ts
export interface ParamCodec<T> {
  /** Read a parameter. `undefined` means "missing or not usable". */
  decode(raw: string | null | undefined): T | undefined;
  /** Write a parameter. Must be deterministic and round-trip with `decode`. */
  encode(value: T): string;
  /** Equality, so a default value can be omitted from the URL. */
  equals?(a: T, b: T): boolean;
}
/** Structural equality for the object/array-shaped codecs below. */
export declare function structuralEquals(a: unknown, b: unknown): boolean;
export interface StringParamOptions {
  maxLength?: number;
}
export declare function stringParam(options?: StringParamOptions): ParamCodec<string>;
export declare function booleanParam(): ParamCodec<boolean>;
export interface NumberParamOptions {
  min?: number;
  max?: number;
  /** Reject fractional input, e.g. a page cursor. */
  integer?: boolean;
}
export declare function numberParam(options?: NumberParamOptions): ParamCodec<number>;
/** A closed set of strings — a view mode, a range preset, a sort key. */
export declare function enumParam<const V extends readonly string[]>(values: V): ParamCodec<V[number]>;
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
export declare function listParam<T>(item: ParamCodec<T>, options?: ListParamOptions): ParamCodec<T[]>;
/**
 * A date-only value.
 *
 * `CalendarDate` in, `YYYY-MM-DD` out — never through a JavaScript `Date`. That
 * is what stops `2026-09-27` from becoming the 26th west of Greenwich. See
 * `docs/DATE_TIME_GUIDE.md`.
 */
export declare function dateOnlyParam(): ParamCodec<CalendarDate>;
/**
 * An absolute instant, serialized as ISO-8601 UTC and kept as epoch
 * milliseconds in state. Use it for a zoned/datetime cursor; a daily chart
 * wants `dateOnlyParam()`.
 */
export declare function instantParam(): ParamCodec<number>;
export interface SortValue {
  id: string;
  desc: boolean;
}
/**
 * One sort definition in the conventional compact form: `sharpe` ascending,
 * `-sharpe` descending.
 */
export declare function sortParam(): ParamCodec<SortValue>;
/** Multi-column sorting, most significant first: `-sharpe,symbol`. */
export declare function sortListParam(options?: ListParamOptions): ParamCodec<SortValue[]>;
/** ISO-8601 currency/region code — a currency selector. */
export declare function currencyParam(): ParamCodec<string>;
/**
 * Make a value optional.
 *
 * A missing parameter reads as `null` rather than as "invalid", which is what
 * an optional filter needs: `?cursor=` and no `cursor` both mean "nothing
 * pinned". `null` serializes to the empty string, and the encoder drops empty
 * values, so an unset optional never leaves a stub in the URL.
 */
export declare function nullableParam<T>(codec: ParamCodec<T>): ParamCodec<T | null>;
//#endregion
//# sourceMappingURL=codecs.d.ts.map