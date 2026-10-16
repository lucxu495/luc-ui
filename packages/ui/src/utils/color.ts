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

const HEX = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Parse `#rgb`, `#rgba`, `#rrggbb` or `#rrggbbaa`. Returns `null` on anything else. */
export function parseHexColor(input: string): Rgb | null {
  const match = HEX.exec(input.trim());
  if (!match) return null;
  const matched = match[1];
  if (!matched) return null;
  let hex = matched.toLowerCase();
  if (hex.length <= 4) hex = hex.replace(/./g, (char) => char + char);
  const r = Number.parseInt(hex.slice(0, 2), 16);
  const g = Number.parseInt(hex.slice(2, 4), 16);
  const b = Number.parseInt(hex.slice(4, 6), 16);
  const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

/** Serialise back to `#rrggbb`, or `#rrggbbaa` when the colour is translucent. */
export function formatHexColor({ r, g, b, a }: Rgb, alpha = a): string {
  const byte = (value: number) => Math.round(Math.min(Math.max(value, 0), 255)).toString(16).padStart(2, "0");
  const base = `#${byte(r)}${byte(g)}${byte(b)}`;
  return alpha >= 1 ? base : `${base}${byte(alpha * 255)}`;
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToRgb({ h, s, v }: Hsv, a = 1): Rgb {
  const hue = ((h % 360) + 360) % 360;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - chroma;
  const sector = ((Math.floor(hue / 60) % 6) + 6) % 6;
  const table: readonly (readonly [number, number, number])[] = [
    [chroma, x, 0],
    [x, chroma, 0],
    [0, chroma, x],
    [0, x, chroma],
    [x, 0, chroma],
    [chroma, 0, x],
  ];
  const [r1, g1, b1] = table[sector] ?? [0, 0, 0];
  return {
    r: Math.round((r1 + m) * 255),
    g: Math.round((g1 + m) * 255),
    b: Math.round((b1 + m) * 255),
    a,
  };
}

/** WCAG relative luminance. */
export function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio, 1–21. Used to pick readable ink for a swatch. */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const left = typeof a === "string" ? parseHexColor(a) : a;
  const right = typeof b === "string" ? parseHexColor(b) : b;
  if (!left || !right) return 1;
  const l1 = relativeLuminance(left);
  const l2 = relativeLuminance(right);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

/** The ink a swatch should print in: near-black or near-white, whichever wins. */
export function readableInk(color: string | Rgb): "#0b0b0c" | "#f7f7f8" {
  const rgb = typeof color === "string" ? parseHexColor(color) : color;
  if (!rgb) return "#0b0b0c";
  return contrastRatio(rgb, { r: 11, g: 11, b: 12, a: 1 }) >= contrastRatio(rgb, { r: 247, g: 247, b: 248, a: 1 })
    ? "#0b0b0c"
    : "#f7f7f8";
}
