/**
 * LUC URL parameter sets.
 *
 * A *parameter set* is the contract between a view and its address bar: a
 * codec, a default, and nothing else. It deliberately knows nothing about React,
 * Next.js or history — `decodeParams` and `encodeParams` are pure, so the same
 * set can be parsed on a server (RSC), in a test, or in the browser adapter.
 *
 * Design rules (see `docs/URL_STATE_GUIDE.md`):
 *
 *  1. **Defaults are omitted.** A link that matches the default view stays
 *     short, and `encodeParams` restores the default when the parameter is
 *     absent.
 *  2. **Unrelated parameters survive.** `mergeParams` only rewrites the keys the
 *     set owns, so a page can add its own `?utm=` or `?debug=` without our
 *     helper deleting it.
 *  3. **Order is deterministic.** Parameters are written in declaration order,
 *     so the same state always produces the same string — which is what makes a
 *     copied link stable.
 */

import { structuralEquals, type ParamCodec } from "./codecs";

export interface ParamSpec<T> {
  codec: ParamCodec<T>;
  /** The value used when the parameter is missing, empty or invalid. */
  default: T;
}

export type ParamSpecMap = Record<string, ParamSpec<unknown>>;

/** The decoded state of a parameter set, keyed exactly as it was declared. */
export type ParamState<M extends ParamSpecMap> = {
  [K in keyof M]: M[K] extends ParamSpec<infer T> ? T : never;
};

/**
 * Pair a codec with its default. Written as a function so TypeScript keeps the
 * codec's value type instead of widening it to `string`.
 */
export function param<T>(codec: ParamCodec<T>, fallback: T): ParamSpec<T> {
  return { codec, default: fallback };
}

/** Identity helper that preserves the literal type of a parameter set. */
export function params<Specs extends ParamSpecMap>(specs: Specs): Specs {
  return specs;
}

function toSearchParams(search: string | URLSearchParams): URLSearchParams {
  return typeof search === "string" ? new URLSearchParams(search) : search;
}

function sameValue<T>(spec: ParamSpec<T>, a: T, b: T): boolean {
  return spec.codec.equals ? spec.codec.equals(a, b) : structuralEquals(a, b);
}

/** Every value the set can hold, defaults included. */
export function defaultState<M extends ParamSpecMap>(specs: M): ParamState<M> {
  const state = {} as ParamState<M>;
  for (const key of Object.keys(specs)) {
    const spec = specs[key] as ParamSpec<unknown>;
    (state as Record<string, unknown>)[key] = spec.default;
  }
  return state;
}

/**
 * Read a parameter set out of a query string.
 *
 * Anything unreadable falls back to the default: this function is total, which
 * is the whole point. `?range=garbage` gives the default range.
 */
export function decodeParams<M extends ParamSpecMap>(
  search: string | URLSearchParams,
  specs: M,
): ParamState<M> {
  const source = toSearchParams(search);
  const state = {} as ParamState<M>;
  for (const key of Object.keys(specs)) {
    const spec = specs[key] as ParamSpec<unknown>;
    const raw = source.get(key);
    const decoded = raw === null ? undefined : spec.codec.decode(raw);
    (state as Record<string, unknown>)[key] = decoded === undefined ? spec.default : decoded;
  }
  return state;
}

/**
 * Write a parameter set. Defaults are omitted, and a value that serializes to
 * the empty string is treated as absent so no `?series=` stub is ever written.
 */
export function encodeParams<M extends ParamSpecMap>(
  state: Partial<ParamState<M>>,
  specs: M,
): URLSearchParams {
  const out = new URLSearchParams();
  for (const key of Object.keys(specs)) {
    const spec = specs[key] as ParamSpec<unknown>;
    const value = (state as Record<string, unknown>)[key];
    if (value === undefined) continue;
    if (sameValue(spec, value, spec.default)) continue;
    const raw = spec.codec.encode(value);
    if (raw.length === 0) continue;
    out.set(key, raw);
  }
  return out;
}

/**
 * Replace the set's own parameters and leave every other one alone.
 *
 * This is what keeps composition honest: a date filter and a table sort can own
 * separate sets on one page, and updating one never drops the other.
 */
export function mergeParams<M extends ParamSpecMap>(
  search: string | URLSearchParams,
  state: Partial<ParamState<M>>,
  specs: M,
): URLSearchParams {
  const merged = new URLSearchParams(toSearchParams(search).toString());
  for (const key of Object.keys(specs)) merged.delete(key);
  const encoded = encodeParams(state, specs);
  for (const [key, value] of encoded) merged.append(key, value);
  return merged;
}

/**
 * Apply a partial update on top of whatever the URL currently says.
 *
 * The current value is re-decoded from the URL rather than trusted from React
 * state, so an external navigation (Back, a pasted link, a second tab) cannot
 * leave the two out of step.
 */
export function patchParams<M extends ParamSpecMap>(
  search: string | URLSearchParams,
  specs: M,
  patch: Partial<ParamState<M>>,
): URLSearchParams {
  const current = decodeParams(search, specs);
  return mergeParams(search, { ...current, ...patch }, specs);
}

/** `URLSearchParams` → the `?a=b` form, or `""` when everything is default. */
export function searchToString(search: string | URLSearchParams): string {
  const value = toSearchParams(search).toString();
  return value.length > 0 ? `?${value}` : "";
}
