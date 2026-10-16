import { CHART_THEME_TOKEN_NAMES, DEFAULT_CHART_THEME_METRICS, chartThemeFromTokens, darkChartTheme } from "./theme-tokens.js";
//#region src/charts/core/theme.ts
/**
* A dark fallback so option builders are total even before the DOM is ready.
*
* The value now comes from the token bridge (`theme-tokens.ts`) rather than a
* literal in this file, because `resolveChartTheme()` below and the DOM-free
* path must agree about what every token is — and the only way to guarantee
* that is for both to be built by the same mapper from the same table.
*/
const defaultChartTheme = darkChartTheme;
/** A dark fallback so option builders are total even before the DOM is ready. */
/** Probe reused for every colour resolution; a single style recalc per token. */
let probe = null;
let canvasProbe = null;
function context2d() {
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
function normalizeCssColor(value) {
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
		return `rgba(${r}, ${g}, ${b}, ${Math.round(a / 255 * 1e3) / 1e3})`;
	} catch {
		return value;
	}
}
function toColor(styles, name) {
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
function withAlpha(color, alpha) {
	const clamped = Math.max(0, Math.min(1, alpha));
	const hex = /^#([0-9a-f]{6})$/i.exec(color);
	if (hex?.[1]) {
		const value = Number.parseInt(hex[1], 16);
		return `rgba(${value >> 16 & 255}, ${value >> 8 & 255}, ${value & 255}, ${clamped})`;
	}
	const rgb = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/i.exec(color);
	if (rgb) return `rgba(${rgb[1]}, ${rgb[2]}, ${rgb[3]}, ${clamped})`;
	return color;
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
function parseColor(value) {
	const hex = /^#([0-9a-f]{6})$/i.exec(value.trim());
	if (hex?.[1]) {
		const parsed = Number.parseInt(hex[1], 16);
		return {
			r: parsed >> 16 & 255,
			g: parsed >> 8 & 255,
			b: parsed & 255,
			a: 1
		};
	}
	const oklch = parseOklch(value);
	if (oklch) return oklch;
	const match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/i.exec(value.trim());
	if (!match) return null;
	const alpha = match[4];
	return {
		r: Number(match[1]),
		g: Number(match[2]),
		b: Number(match[3]),
		a: alpha === void 0 ? 1 : alpha.endsWith("%") ? Number.parseFloat(alpha) / 100 : Number(alpha)
	};
}
/** Linear-light sRGB channel → gamma-encoded 0–255. */
function encodeSrgb(channel) {
	const clamped = Math.max(0, Math.min(1, channel));
	const encoded = clamped <= .0031308 ? clamped * 12.92 : 1.055 * clamped ** (1 / 2.4) - .055;
	return Math.round(encoded * 255);
}
/**
* Parse `oklch(L C H [/ A])` into 8-bit sRGB.
*
* `L` may be a fraction (0–1) or a percentage; `H` is degrees. The conversion
* goes oklch → oklab → LMS → linear sRGB → sRGB, which is what a browser does,
* so a fallback ramp built here matches the one the DOM would resolve.
*/
function parseOklch(value) {
	const match = /^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg|rad|turn)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i.exec(value.trim());
	if (!match) return null;
	const channel = (raw, scale = 1) => raw.endsWith("%") ? Number.parseFloat(raw) / 100 * scale : Number.parseFloat(raw);
	const lightness = channel(match[1]);
	const chroma = channel(match[2], .4);
	let hue = Number.parseFloat(match[3]);
	if (Number.isNaN(lightness) || Number.isNaN(chroma) || Number.isNaN(hue)) return null;
	hue = (hue % 360 + 360) % 360;
	const alphaRaw = match[4];
	const alpha = alphaRaw === void 0 ? 1 : alphaRaw.endsWith("%") ? Number.parseFloat(alphaRaw) / 100 : Number(alphaRaw);
	const hueRadians = hue * Math.PI / 180;
	const a = chroma * Math.cos(hueRadians);
	const b = chroma * Math.sin(hueRadians);
	const l = (lightness + .3963377774 * a + .2158037573 * b) ** 3;
	const m = (lightness - .1055613458 * a - .0638541728 * b) ** 3;
	const s = (lightness - .0894841775 * a - 1.291485548 * b) ** 3;
	const r = 4.0767416621 * l - 3.3077115913 * m + .2309699292 * s;
	const g = -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s;
	const blue = -.0041960863 * l - .7034186147 * m + 1.707614701 * s;
	return {
		r: encodeSrgb(r),
		g: encodeSrgb(g),
		b: encodeSrgb(blue),
		a: Math.max(0, Math.min(1, alpha))
	};
}
/** Straight (non-premultiplied) alpha compositing: `foreground` over `background`. */
function compositeOver(foreground, background) {
	const a = foreground.a + background.a * (1 - foreground.a);
	if (a <= 0) return {
		r: 0,
		g: 0,
		b: 0,
		a: 0
	};
	const channel = (fg, bg) => (fg * foreground.a + bg * background.a * (1 - foreground.a)) / a;
	return {
		r: channel(foreground.r, background.r),
		g: channel(foreground.g, background.g),
		b: channel(foreground.b, background.b),
		a
	};
}
/** Linear RGB interpolation — the same space ECharts interpolates `inRange` stops in. */
function mixColor(from, to, t) {
	const clamped = Math.max(0, Math.min(1, t));
	const lerp = (a, b) => a + (b - a) * clamped;
	return {
		r: lerp(from.r, to.r),
		g: lerp(from.g, to.g),
		b: lerp(from.b, to.b),
		a: lerp(from.a, to.a)
	};
}
/** WCAG 2.x relative luminance. */
function relativeLuminance(color) {
	const channel = (value) => {
		const v = Math.max(0, Math.min(255, value)) / 255;
		return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
	};
	return .2126 * channel(color.r) + .7152 * channel(color.g) + .0722 * channel(color.b);
}
/** WCAG 2.x contrast ratio, 1–21. Opacity should already be resolved. */
function contrastRatio(a, b) {
	const la = relativeLuminance(a);
	const lb = relativeLuminance(b);
	const [high, low] = la > lb ? [la, lb] : [lb, la];
	return (high + .05) / (low + .05);
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
function readableInk(background, options) {
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
function flattenColor(color, surface) {
	const parsed = parseColor(color);
	if (!parsed) return null;
	return flattenOver(parsed, surface);
}
function flattenOver(color, surface) {
	if (color.a >= 1) return color;
	return compositeOver(color, (surface ? parseColor(surface) : null) ?? {
		r: 0,
		g: 0,
		b: 0,
		a: 1
	});
}
function toLength(styles, name, fallback) {
	const raw = styles.getPropertyValue(name).trim();
	if (!raw) return fallback;
	const value = Number.parseFloat(raw);
	if (Number.isNaN(value)) return fallback;
	if (raw.endsWith("rem")) return value * 16;
	if (raw.endsWith("ms")) return value;
	if (raw.endsWith("s")) return value * 1e3;
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
function resolveChartTheme(root) {
	const mode = modeOf(root);
	if (typeof window === "undefined") return darkChartTheme;
	const el = root ?? document.documentElement;
	const styles = getComputedStyle(el);
	const resolved = /* @__PURE__ */ new Map();
	for (const token of CHART_THEME_TOKEN_NAMES) resolved.set(token, toColor(styles, token));
	return chartThemeFromTokens((token) => resolved.get(token), mode, {
		fontFamily: styles.getPropertyValue("--font-sans").trim() || DEFAULT_CHART_THEME_METRICS.fontFamily,
		monoFamily: styles.getPropertyValue("--font-mono").trim() || DEFAULT_CHART_THEME_METRICS.monoFamily,
		fontMicro: toLength(styles, "--text-micro", DEFAULT_CHART_THEME_METRICS.fontMicro),
		fontCaption: toLength(styles, "--text-caption", DEFAULT_CHART_THEME_METRICS.fontCaption),
		fontLabel: toLength(styles, "--text-label", DEFAULT_CHART_THEME_METRICS.fontLabel),
		radius: toLength(styles, "--radius-md", DEFAULT_CHART_THEME_METRICS.radius),
		motionFast: toLength(styles, "--motion-fast", DEFAULT_CHART_THEME_METRICS.motionFast),
		motionNormal: toLength(styles, "--motion-normal", DEFAULT_CHART_THEME_METRICS.motionNormal),
		motionSlow: toLength(styles, "--motion-slow", DEFAULT_CHART_THEME_METRICS.motionSlow)
	});
}
/** The palette slot for a series index, wrapping after twelve tones. */
function paletteColor(theme, index) {
	return theme.palette[index % theme.palette.length] ?? theme.accent;
}
/** Semantic tone → resolved colour. Falls back to the palette by index. */
function toneColor(theme, tone, index) {
	switch (tone) {
		case "accent": return theme.palette[0] ?? theme.accent;
		case "positive": return theme.positive;
		case "negative": return theme.negative;
		case "warning": return theme.warning;
		case "neutral": return theme.neutral;
		case "info": return theme.palette[6] ?? theme.accent;
		default: return paletteColor(theme, index);
	}
}
function modeOf(root) {
	if (typeof document === "undefined") return "dark";
	const el = root ?? document.documentElement;
	return el.classList.contains("dark") || el.dataset.theme === "dark" ? "dark" : "light";
}
//#endregion
export { compositeOver, contrastRatio, defaultChartTheme, flattenColor, mixColor, modeOf, normalizeCssColor, paletteColor, parseColor, parseOklch, readableInk, relativeLuminance, resolveChartTheme, toneColor, withAlpha };

//# sourceMappingURL=theme.js.map