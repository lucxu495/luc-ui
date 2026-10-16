//#region src/utils/color.d.ts
/**
 * Colour maths for controls that hand a colour back to the caller.
 *
 * Deliberately tiny and dependency-free, and deliberately **not** a colour
 * engine: it converts between the two notations a UI actually exchanges (a hex
 * string a form submits, and HSV the picker manipulates) and computes a WCAG
 * contrast ratio so a swatch can pick its own ink. It does not model colour
 * spaces, gamut mapping or perceptual distance — those belong in the product
 * that needs them, not in a component library.
 *
 * Every function is pure and total: an unparseable string returns `null` rather
 * than a plausible-looking wrong colour.
 */
export interface Rgb {
  r: number;
  g: number;
  b: number;
  /** 0–1. */
  a: number;
}
export interface Hsv {
  /** 0–360. */
  h: number;
  /** 0–1. */
  s: number;
  /** 0–1. */
  v: number;
}
/** Parse `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. Returns `null` on anything else. */
export declare function parseHexColor(input: string): Rgb | null;
/** Serialise back to `#rrggbb`, or `#rrggbbaa` when the colour is translucent. */
export declare function formatHexColor({ r, g, b, a }: Rgb, alpha?: number): string;
export declare function rgbToHsv({ r, g, b }: Rgb): Hsv;
export declare function hsvToRgb({ h, s, v }: Hsv, a?: number): Rgb;
/** WCAG relative luminance. */
export declare function relativeLuminance({ r, g, b }: Rgb): number;
/** WCAG contrast ratio, 1–21. Used to pick readable ink for a swatch. */
export declare function contrastRatio(a: string | Rgb, b: string | Rgb): number;
/** The ink a swatch should print in: near-black or near-white, whichever wins. */
export declare function readableInk(color: string | Rgb): "#0b0b0c" | "#f7f7f8";
//#endregion
//# sourceMappingURL=color.d.ts.map