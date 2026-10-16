/**
 * Chart theme resolution.
 *
 * Canvas engines cannot read CSS variables, so the adapter resolves the
 * `--chart-*` semantic tokens once per theme into a plain object of colour
 * strings. Two details matter:
 *
 *  - `getComputedStyle(el).getPropertyValue("--x")` returns the custom
 *    property's token stream, not a resolved colour. Tokens built with
 *    `color-mix()` would reach the canvas as `color-mix(...)`. We therefore
 *    normalise every colour through a probe element's computed `color`, which
 *    the browser resolves to a concrete value the canvas understands.
 *  - The result is cached per theme mode, so a chart re-render never touches
 *    the DOM. Theme switching is the only thing that invalidates it.
 */

import type { SeriesTone } from "../types";
import {
  CHART_THEME_TOKEN_NAMES,
  chartThemeFromTokens,
  DEFAULT_CHART_THEME_METRICS,
  darkChartTheme,
  type ChartTheme,
  type ChartThemeMode,
  type ChartThemeTokenName,
} from "./theme-tokens";

export type { ChartTheme, ChartThemeMode, ChartThemeTokenName };

/**
 * A dark fallback so option builders are total even before the DOM is ready.
 *
 * The value now comes from the token bridge (`theme-tokens.ts`) rather than a
 * literal in this file, because `resolveChartTheme()` below and the DOM-free
 * path must agree about what every token is — and the only way to guarantee
 * that is for both to be built by the same mapper from the same table.
 */
export const defaultChartTheme: ChartTheme = darkChartTheme;



/** A dark fallback so option builders are total even before the DOM is ready. */

/** Probe reused for every colour resolution; a single style recalc per token. */
let probe: HTMLSpanElement | null = null;
let canvasProbe: CanvasRenderingContext2D | null = null;

function context2d(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") return null;
  if (!canvasProbe) {
    canvasProbe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    if (canvasProbe) {
      canvasProbe.canvas.width = 1;
      canvasProbe.canvas.height = 1;
    }
  }
  return canvasProbe;
}

/**
 * CSS colour to `rgb()`/`rgba()`.
 *
 * Reading `fillStyle` back is not enough: Chrome returns `lab(...)` for an
 * `oklch()` input, and neither engine's colour parser understands `lab()`,
 * `oklch()` or `color-mix()`. Painting one pixel and reading it back is the
 * only conversion that always lands on a form both renderers accept — including
 * inside gradient stops, where a failed parse silently paints black.
 */
export function normalizeCssColor(value: string): string {
  if (!value) return value;
  try {
    const context = context2d();
    if (!context) return value;
    context.clearRect(0, 0, 1, 1);
    context.fillStyle = "#000000";
    context.fillStyle = value;
    context.fillRect(0, 0, 1, 1);
    const pixel = context.getImageData(0, 0, 1, 1).data;
    const r = pixel[0] ?? 0;
    const g = pixel[1] ?? 0;
    const b = pixel[2] ?? 0;
    const a = pixel[3] ?? 0;
    if (a === 0) return "rgba(0, 0, 0, 0)";
    if (a === 255) return `rgb(${r}, ${g}, ${b})`;
    return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`;
  } catch {
    return value;
  }
}

function toColor(styles: CSSStyleDeclaration, name: string): string {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return "";
  if (!probe) {
    probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "absolute";
    probe.style.pointerEvents = "none";
    probe.style.opacity = "0";
    document.body.appendChild(probe);
  }
  probe.style.color = "";
  probe.style.color = raw;
  const resolved = getComputedStyle(probe).color;
  return normalizeCssColor(resolved || raw);
}

/**
 * Attach an alpha channel to a normalised colour string.
 * Handles `#rrggbb` and `rgb()`; anything else is returned unchanged.
 */
export function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const hex = /^#([0-9a-f]{6})$/i.exec(color);
  if (hex?.[1]) {
    const value = Number.parseInt(hex[1], 16);
    const r = (value >> 16) & 255;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return `rgba(${r}, ${g}, ${b}, ${clamped})`;
  }
  const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color);
  if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${clamped})`;
  return color;
}

/* -------------------------------------------------------------------------- */
/* Colour maths for contrast-aware labels                                      */
/* -------------------------------------------------------------------------- */

export interface RgbColor {
  r: number;
  g: number;
  b: number;
  /** 0–1. */
  a: number;
}

/**
 * Parse the colour forms the chart layer produces (`rgb()`, `rgba()`,
 * `#rrggbb`) and `oklch()`, which is what the token layer declares. Everything
 * else returns `null` so callers can fall back rather than guess.
 *
 * `oklch()` matters for two reasons: the dark/light fallback theme is authored
 * in oklch, so a ramp built before the DOM is ready must still resolve to real
 * channels; and a canvas engine cannot parse `oklch(...)` at all.
 */
export function parseColor(value: string): RgbColor | null {
  const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
  if (hex?.[1]) {
    const parsed = Number.parseInt(hex[1], 16);
    return { r: (parsed >> 16) & 255, g: (parsed >> 8) & 255, b: parsed & 255, a: 1 };
  }
  const oklch = parseOklch(value);
  if (oklch) return oklch;
  const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(
    value.trim(),
  );
  if (!match) return null;
  const alpha = match[4];
  return {
    r: Number(match[1]),
    g: Number(match[2]),
    b: Number(match[3]),
    a: alpha === undefined ? 1 : alpha.endsWith("%") ? Number.parseFloat(alpha) / 100 : Number(alpha),
  };
}

/** Linear-light sRGB channel → gamma-encoded 0–255. */
function encodeSrgb(channel: number): number {
  const clamped = Math.max(0, Math.min(1, channel));
  const encoded = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - 0.055;
  return Math.round(encoded * 255);
}

/**
 * Parse `oklch(L C H [/ A])` into 8-bit sRGB.
 *
 * `L` may be a fraction (0–1) or a percentage; `H` is degrees. The conversion
 * goes oklch → oklab → LMS → linear sRGB → sRGB, which is what a browser does,
 * so a fallback ramp built here matches the one the DOM would resolve.
 */
export function parseOklch(value: string): RgbColor | null {
  const match = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg|rad|turn)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i.exec(
    value.trim(),
  );
  if (!match) return null;
  const channel = (raw: string, scale = 1) =>
    raw.endsWith("%") ? (Number.parseFloat(raw) / 100) * scale : Number.parseFloat(raw);
  const lightness = channel(match[1]!);
  const chroma = channel(match[2]!, 0.4);
  let hue = Number.parseFloat(match[3]!);
  if (Number.isNaN(lightness) || Number.isNaN(chroma) || Number.isNaN(hue)) return null;
  hue = ((hue % 360) + 360) % 360;
  const alphaRaw = match[4];
  const alpha = alphaRaw === undefined ? 1 : alphaRaw.endsWith("%") ? Number.parseFloat(alphaRaw) / 100 : Number(alphaRaw);

  const hueRadians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(hueRadians);
  const b = chroma * Math.sin(hueRadians);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return { r: encodeSrgb(r), g: encodeSrgb(g), b: encodeSrgb(blue), a: Math.max(0, Math.min(1, alpha)) };
}

/** A parsed colour back to an `rgb()`/`rgba()` string a canvas understands. */
export function toRgbString(color: RgbColor): string {
  const r = Math.round(color.r);
  const g = Math.round(color.g);
  const b = Math.round(color.b);
  return color.a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${Math.round(color.a * 1000) / 1000})`;
}

/** Straight (non-premultiplied) alpha compositing: `foreground` over `background`. */
export function compositeOver(foreground: RgbColor, background: RgbColor): RgbColor {
  const a = foreground.a + background.a * (1 - foreground.a);
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
  const channel = (fg: number, bg: number) => (fg * foreground.a + bg * background.a * (1 - foreground.a)) / a;
  return { r: channel(foreground.r, background.r), g: channel(foreground.g, background.g), b: channel(foreground.b, background.b), a };
}

/** Linear RGB interpolation — the same space ECharts interpolates `inRange` stops in. */
export function mixColor(from: RgbColor, to: RgbColor, t: number): RgbColor {
  const clamped = Math.max(0, Math.min(1, t));
  const lerp = (a: number, b: number) => a + (b - a) * clamped;
  return {
    r: lerp(from.r, to.r),
    g: lerp(from.g, to.g),
    b: lerp(from.b, to.b),
    a: lerp(from.a, to.a),
  };
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(color: RgbColor): number {
  const channel = (value: number) => {
    const v = Math.max(0, Math.min(255, value)) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
}

/** WCAG 2.x contrast ratio, 1–21. Opacity should already be resolved. */
export function contrastRatio(a: RgbColor, b: RgbColor): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [high, low] = la > lb ? [la, lb] : [lb, la];
  return (high + 0.05) / (low + 0.05);
}

/**
 * Pick the more readable of two inks for text sitting on `background`.
 *
 * A diverging ramp necessarily passes through mid-lightness colours, where
 * neither a dark nor a light ink reaches 4.5:1 — a fixed `textPrimary` ink
 * fails at one end or the other (measured: 3.0:1 on a saturated light-theme
 * red). Choosing per mark by contrast ratio keeps the worse end above 4:1 and
 * the rest well above 4.5:1. `background` may be translucent; it is composited
 * over `surface` first, because that is what the reader actually sees.
 */
export function readableInk(
  background: string,
  options: { dark: string; light: string; surface?: string },
): string {
  const bg = parseColor(background);
  const dark = parseColor(options.dark);
  const light = parseColor(options.light);
  if (!bg || !dark || !light) return options.light;
  const resolved = flattenOver(bg, options.surface) ?? bg;
  return contrastRatio(resolved, dark) >= contrastRatio(resolved, light) ? options.dark : options.light;
}

/**
 * Flatten a (possibly translucent) colour onto the surface behind it, which is
 * what the reader's eye integrates. Returns `null` when either colour is
 * unparseable so callers can fall back instead of inventing a value.
 */
export function flattenColor(color: string, surface?: string): RgbColor | null {
  const parsed = parseColor(color);
  if (!parsed) return null;
  return flattenOver(parsed, surface);
}

function flattenOver(color: RgbColor, surface?: string): RgbColor | null {
  if (color.a >= 1) return color;
  const behind = surface ? parseColor(surface) : null;
  return compositeOver(color, behind ?? { r: 0, g: 0, b: 0, a: 1 });
}

function toLength(styles: CSSStyleDeclaration, name: string, fallback: number): number {
  const raw = styles.getPropertyValue(name).trim();
  if (!raw) return fallback;
  const value = Number.parseFloat(raw);
  if (Number.isNaN(value)) return fallback;
  if (raw.endsWith("rem")) return value * 16;
  if (raw.endsWith("ms")) return value;
  if (raw.endsWith("s")) return value * 1000;
  return value;
}

/**
 * Read the chart token layer for the element's current theme.
 *
 * Safe to call on the server: it returns the mode's default theme from the
 * token bridge, with no DOM touched. Every value falls back per token, so a
 * partially-loaded stylesheet degrades to a readable chart rather than to
 * `""`, which every engine paints as black.
 */
export function resolveChartTheme(root?: HTMLElement | null): ChartTheme {
  /*
   * Server render: the dark reference theme. `modeOf` cannot read a document
   * that does not exist, and the light table deliberately does not travel in
   * this module (see `theme-tokens-light.ts`) — a server render has no way to
   * know which theme the page will be in, so it renders the reference one and
   * the client resolves the real one on hydration.
   */
  const mode: ChartThemeMode = modeOf(root);
  if (typeof window === "undefined") return darkChartTheme;
  const el = root ?? document.documentElement;
  const styles = getComputedStyle(el);
  const resolved = new Map<ChartThemeTokenName, string>();
  for (const token of CHART_THEME_TOKEN_NAMES) {
    resolved.set(token, toColor(styles, token));
  }
  return chartThemeFromTokens((token) => resolved.get(token), mode, {
    fontFamily: styles.getPropertyValue("--font-sans").trim() || DEFAULT_CHART_THEME_METRICS.fontFamily,
    monoFamily: styles.getPropertyValue("--font-mono").trim() || DEFAULT_CHART_THEME_METRICS.monoFamily,
    fontMicro: toLength(styles, "--text-micro", DEFAULT_CHART_THEME_METRICS.fontMicro),
    fontCaption: toLength(styles, "--text-caption", DEFAULT_CHART_THEME_METRICS.fontCaption),
    fontLabel: toLength(styles, "--text-label", DEFAULT_CHART_THEME_METRICS.fontLabel),
    radius: toLength(styles, "--radius-md", DEFAULT_CHART_THEME_METRICS.radius),
    motionFast: toLength(styles, "--motion-fast", DEFAULT_CHART_THEME_METRICS.motionFast),
    motionNormal: toLength(styles, "--motion-normal", DEFAULT_CHART_THEME_METRICS.motionNormal),
    motionSlow: toLength(styles, "--motion-slow", DEFAULT_CHART_THEME_METRICS.motionSlow),
  });
}

/** The palette slot for a series index, wrapping after twelve tones. */
export function paletteColor(theme: ChartTheme, index: number): string {
  const slot = theme.palette[index % theme.palette.length];
  return slot ?? theme.accent;
}

/** Semantic tone → resolved colour. Falls back to the palette by index. */
export function toneColor(theme: ChartTheme, tone: SeriesTone | undefined, index: number): string {
  switch (tone) {
    case "accent":
      return theme.palette[0] ?? theme.accent;
    case "positive":
      return theme.positive;
    case "negative":
      return theme.negative;
    case "warning":
      return theme.warning;
    case "neutral":
      return theme.neutral;
    case "info":
      return theme.palette[6] ?? theme.accent;
    default:
      return paletteColor(theme, index);
  }
}

export function modeOf(root?: HTMLElement | null): "dark" | "light" {
  if (typeof document === "undefined") return "dark";
  const el = root ?? document.documentElement;
  return el.classList.contains("dark") || el.dataset.theme === "dark" ? "dark" : "light";
}
