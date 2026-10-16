import { ParamCodec } from "./codecs.js";
//#region src/url-state/params.d.ts
export interface ParamSpec<T> {
  codec: ParamCodec<T>;
  /** The value used when the parameter is missing, empty or invalid. */
  default: T;
}
export type ParamSpecMap = Record<string, ParamSpec<unknown>>;
/** The decoded state of a parameter set, keyed exactly as it was declared. */
export type ParamState<M extends ParamSpecMap> = { [K in keyof M]: M[K] extends ParamSpec<infer T> ? T : never; };
/**
 * Pair a codec with its default. Written as a function so TypeScript keeps the
 * codec's value type instead of widening it to `string`.
 */
export declare function param<T>(codec: ParamCodec<T>, fallback: T): ParamSpec<T>;
/** Identity helper that preserves the literal type of a parameter set. */
export declare function params<Specs extends ParamSpecMap>(specs: Specs): Specs;
/** Every value the set can hold, defaults included. */
export declare function defaultState<M extends ParamSpecMap>(specs: M): ParamState<M>;
/**
 * Read a parameter set out of a query string.
 *
 * Anything unreadable falls back to the default: this function is total, which
 * is the whole point. `?range=garbage` gives the default range.
 */
export declare function decodeParams<M extends ParamSpecMap>(search: string | URLSearchParams, specs: M): ParamState<M>;
/**
 * Write a parameter set. Defaults are omitted, and a value that serializes to
 * the empty string is treated as absent so no `?series=` stub is ever written.
 */
export declare function encodeParams<M extends ParamSpecMap>(state: Partial<ParamState<M>>, specs: M): URLSearchParams;
/**
 * Replace the set's own parameters and leave every other one alone.
 *
 * This is what keeps composition honest: a date filter and a table sort can own
 * separate sets on one page, and updating one never drops the other.
 */
export declare function mergeParams<M extends ParamSpecMap>(search: string | URLSearchParams, state: Partial<ParamState<M>>, specs: M): URLSearchParams;
/**
 * Apply a partial update on top of whatever the URL currently says.
 *
 * The current value is re-decoded from the URL rather than trusted from React
 * state, so an external navigation (Back, a pasted link, a second tab) cannot
 * leave the two out of step.
 */
export declare function patchParams<M extends ParamSpecMap>(search: string | URLSearchParams, specs: M, patch: Partial<ParamState<M>>): URLSearchParams;
/** `URLSearchParams` → the `?a=b` form, or `""` when everything is default. */
export declare function searchToString(search: string | URLSearchParams): string;
//#endregion
//# sourceMappingURL=params.d.ts.map