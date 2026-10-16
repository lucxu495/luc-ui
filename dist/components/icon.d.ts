import { RemixiconComponentType } from "@remixicon/react";
//#region src/components/icon.d.ts
/**
 * LUC Icon — the library's own icon surface.
 *
 * What existed before this file: forty-six source files inside `@luc/ui`
 * importing `@remixicon/react` directly, and no way for a consumer to draw an
 * icon at the library's size. That is a dependency with no public face. A
 * consumer who wanted an icon matching the ones beside it had two options and
 * both were wrong: install Remix Icon themselves and guess the sizes, or ship an
 * SVG that drifts from everything around it.
 *
 * Three parts, and the boundaries between them matter:
 *
 *  1. **The asset source stays Remix Icon.** Redrawing three thousand glyphs is
 *     not what a design system is for, and a hand-drawn subset would be worse
 *     than the set it replaced. `@luc/ui` already depends on it; this file makes
 *     that dependency *public* rather than hidden.
 *  2. **`Icon` is the wrapper.** It owns size, tone and accessibility — the
 *     three things a caller gets wrong when they use the glyph component
 *     directly, because Remix Icon's own `size` takes a raw pixel number and
 *     knows nothing about `--fg-muted`.
 *  3. **`iconSet` is a named set, with search.** The wrapper makes an icon
 *     addressable by component (`icon={RiPlayLine}`); the set makes the thirty-
 *     nine the library itself draws with addressable by *name* (`name="play"`),
 *     which is what a config, a stored record or a person typing into a search
 *     box needs. It is not a re-export of the whole package, and it says so.
 *
 * Accessibility is derived rather than delegated: an icon with a `label` is an
 * image with that name, and an icon without one is `aria-hidden`, because a
 * glyph sitting next to the word "Close" is decoration and announcing it twice
 * is worse than silence.
 */
/**
 * The glyph type, re-exported from the asset source.
 *
 * Aliased rather than declared so it cannot drift from Remix Icon's real props,
 * and so a consumer writing their own component can check it against the same
 * type instead of guessing. A different icon set renders its own node: this API
 * says "Remix Icon" out loud rather than pretending to be icon-set agnostic.
 */
export type IconGlyph = RemixiconComponentType;
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";
export type IconTone = "inherit" | "muted" | "secondary" | "primary" | "accent" | "positive" | "negative" | "warning" | "info";
export interface IconProps extends Omit<React.ComponentPropsWithRef<"span">, "children"> {
  /**
   * The glyph: pass the imported component, `icon={RiPlayLine}`. Or address it
   * by name from the curated set, `name="play"`. One of the two is required.
   */
  icon?: IconGlyph;
  /** A name from `iconSet`, for callers that cannot import a component. */
  name?: string;
  size?: IconSize;
  /** Defaults to `inherit`, so an icon inside a Button takes the button's tone. */
  tone?: IconTone;
  /** The icon's own name, for a glyph that carries meaning by itself. */
  label?: string;
  /** Rotate continuously — a refresh in flight, a job still running. */
  spin?: boolean;
}
export declare function Icon({ className, icon, name, size, tone, label, spin, ...props }: IconProps): import("react").JSX.Element;
/** One glyph in the curated set: a name to address it by, and how to find it. */
export interface IconEntry {
  name: string;
  glyph: IconGlyph;
  /**
   * Extra search terms, lower case, in both languages — a reader may type
   * either one into the search box on `/components/icon`.
   */
  keywords: readonly string[];
}
/**
 * The glyphs the library draws with, addressable by name.
 *
 * Curated rather than generated on purpose. A set mirroring all of Remix Icon
 * would bloat every bundle that imports it and would be a copy of a package
 * rather than an API; this is the set `@luc/ui` itself uses, so `name="close"`
 * and the `RiCloseLine` inside `Alert` are literally the same glyph.
 */
export declare const iconSet: readonly IconEntry[];
/** Every name in the set, in the order it is curated in. */
export declare const iconNames: readonly string[];
/** The glyph for a name, or `undefined` — for a caller resolving a stored value. */
export declare function iconFor(name: string): IconGlyph | undefined;
/**
 * The names matching a search box's text.
 *
 * Name and keywords only — no fuzzy matching and no ranking. A thirty-nine item
 * list does not need either, and a false positive here is a reader choosing the
 * wrong icon. Case-insensitive, substring ("down" finds `download` and
 * `arrow-down`), and an empty query returns the whole set in curated order.
 */
export declare function searchIcons(query: string): readonly string[];
//#endregion
//# sourceMappingURL=icon.d.ts.map