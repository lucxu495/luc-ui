"use client";

import { createParser } from "nuqs";
import type { ParamCodec } from "@luc/ui/url-state";

/**
 * The framework adapter, and the whole nuqs story in this repository.
 *
 * `@luc/ui` owns the *vocabulary* of a shareable view — the codecs, the
 * ordering, the "omit the default" rule — and stays router-agnostic. Next.js
 * owns the *plumbing*: shallow updates, the App Router cache, scroll policy.
 * This file is the four-line bridge between them, and it is the only place nuqs
 * appears.
 *
 * nuqs is a Showcase dependency, never a `@luc/ui` dependency: a product on
 * another router implements `UrlStateAdapter` and skips nuqs entirely.
 */
export function nuqsParser<T>(codec: ParamCodec<T>, fallback: T) {
  return createParser<T>({
    // An unreadable value falls back to the default instead of throwing. The
    // URL is user input; `?range=garbage` must render the default view.
    parse: (value) => codec.decode(value) ?? fallback,
    serialize: (value) => codec.encode(value),
    eq: (a, b) => (codec.equals ? codec.equals(a, b) : Object.is(a, b)),
    // `parse` never returns null — an unreadable value becomes the default — so
    // this is a strict "not null" to the type system, not to the runtime.
  }).withDefault(fallback as NonNullable<T>);
}
