import { AnimatedIconComponentType } from "../icons/animated.js";
import { RemixiconComponentType } from "@remixicon/react";
//#region src/components/icon.d.ts
/**
 * Public LUC Icon wrapper. All built-in UI glyphs now use animated AnimateIcons
 * via ../icons/animated; consumers with existing Remix glyphs may still inject
 * them through the legacy icon={...} API to preserve backwards compatibility.
 * The name-based 39-glyph catalog resolves animated glyphs only.
 * This is a presentational surface; charts/plots and brand logos are not icons.
 */
export type IconGlyph = AnimatedIconComponentType | RemixiconComponentType;
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
 * The animated glyphs the library draws with, addressable by name.
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