/**
 * Brand palettes and type roles, as the Showcase exposes them.
 *
 * The tokens themselves live in `@luc/ui` (`tokens.css`, `data-palette` /
 * `data-typeface`). This module is the Showcase's own catalogue: labels, notes
 * and the attribute plumbing. Nothing here styles a component — the point of the
 * feature is that an attribute on `<html>` (or on any subtree) is the whole API.
 */

export const PALETTES = [
  { id: "cyan", label: "LUC Cyan", note: "The default. Cool, technical, quiet." },
  { id: "violet", label: "Electric Violet", note: "AI products, creative tools, consumer." },
  { id: "cobalt", label: "Cobalt", note: "Enterprise software and infrastructure." },
  { id: "emerald", label: "Emerald", note: "Health, growth, sustainability." },
  { id: "rose", label: "Rose", note: "Commerce, community, publishing." },
  { id: "ember", label: "Ember", note: "Warm editorial, high energy." },
  { id: "graphite", label: "Graphite", note: "Monochrome — the content is the colour." },
] as const;

export type Palette = (typeof PALETTES)[number]["id"];

export const TYPEFACES = [
  { id: "inter", label: "Inter", note: "Neutral, complete, self-hosted." },
  { id: "humanist", label: "Humanist system", note: "No webfont: the platform's own sans." },
  { id: "editorial", label: "Editorial serif", note: "Serif voice with looser leading." },
  { id: "technical", label: "Technical mono", note: "Monospaced display for engineering surfaces." },
] as const;

export type Typeface = (typeof TYPEFACES)[number]["id"];

/**
 * Visual personalities.
 *
 * Not a fifth palette: a personality moves the *material* — radius scale,
 * control heights, density, leading, motion physics and glow strength — through
 * the token layer in `@luc/ui` (`[data-personality]`). It is the same trick as a
 * palette (one attribute, whole subtree) applied to everything a palette cannot
 * express.
 */
export const PERSONALITIES = [
  {
    id: "instrument",
    label: "Instrument",
    note: "Calibrated geometry, precise motion — the default.",
  },
  { id: "editorial", label: "Editorial", note: "Generous curves, unhurried motion, looser leading." },
  { id: "dense", label: "Dense", note: "Tight geometry, faster motion, closer rows." },
  { id: "expressive", label: "Expressive", note: "Large curves, springy motion, stronger light." },
] as const;

export type Personality = (typeof PERSONALITIES)[number]["id"];

/**
 * Spatial depth.
 *
 * The one attribute that decides how much a component is allowed to *move*.
 * `layered` is the default the design system was drawn at; `flat` removes the
 * travel entirely for dense or print-like surfaces; `deep` scales the same
 * tokens up for marketing and editorial pages. It is a multiplier on the
 * personality's own lift, never a separate shadow set — which is why every
 * ordinary component in the Showcase follows it.
 */
export const SPACES = [
  { id: "flat", label: "Flat", note: "No travel: elevation and borders only." },
  { id: "layered", label: "Layered", note: "The default. A few pixels of lift." },
  { id: "deep", label: "Deep", note: "More travel, for editorial and display surfaces." },
] as const;

export type Space = (typeof SPACES)[number]["id"];

export const DEFAULT_PALETTE: Palette = "cyan";
export const DEFAULT_TYPEFACE: Typeface = "inter";
export const DEFAULT_PERSONALITY: Personality = "instrument";
export const DEFAULT_SPACE: Space = "layered";

export const PALETTE_STORAGE_KEY = "luc-ui:showcase:palette";
export const TYPEFACE_STORAGE_KEY = "luc-ui:showcase:typeface";
export const PERSONALITY_STORAGE_KEY = "luc-ui:showcase:personality";
export const SPACE_STORAGE_KEY = "luc-ui:showcase:space";

export function isPalette(value: unknown): value is Palette {
  return typeof value === "string" && PALETTES.some((palette) => palette.id === value);
}

export function isTypeface(value: unknown): value is Typeface {
  return typeof value === "string" && TYPEFACES.some((typeface) => typeface.id === value);
}

export function paletteLabel(id: Palette): string {
  return PALETTES.find((palette) => palette.id === id)?.label ?? id;
}

export function typefaceLabel(id: Typeface): string {
  return TYPEFACES.find((typeface) => typeface.id === id)?.label ?? id;
}

export function isPersonality(value: unknown): value is Personality {
  return typeof value === "string" && PERSONALITIES.some((preset) => preset.id === value);
}

export function personalityLabel(id: Personality): string {
  return PERSONALITIES.find((preset) => preset.id === id)?.label ?? id;
}

export function isSpace(value: unknown): value is Space {
  return typeof value === "string" && SPACES.some((space) => space.id === value);
}

/**
 * The pre-paint script.
 *
 * Same job as `lucThemeInitScript`: the palette has to be on `<html>` before the
 * first paint, or a returning visitor sees cyan flash to violet. The attributes
 * are the state; localStorage only remembers the choice between visits.
 */
export function appearanceInitScript(
  palette: Palette = DEFAULT_PALETTE,
  typeface: Typeface = DEFAULT_TYPEFACE,
  personality: Personality = DEFAULT_PERSONALITY,
  space: Space = DEFAULT_SPACE,
): string {
  return [
    "(function(){try{",
    "var root=document.documentElement;",
    `var p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});`,
    `var t=localStorage.getItem(${JSON.stringify(TYPEFACE_STORAGE_KEY)});`,
    `var s=localStorage.getItem(${JSON.stringify(PERSONALITY_STORAGE_KEY)});`,
    `var d=localStorage.getItem(${JSON.stringify(SPACE_STORAGE_KEY)});`,
    `root.dataset.palette=p||${JSON.stringify(palette)};`,
    `root.dataset.typeface=t||${JSON.stringify(typeface)};`,
    `root.dataset.personality=s||${JSON.stringify(personality)};`,
    `root.dataset.space=d||${JSON.stringify(space)};`,
    "}catch(e){}})();",
  ].join("");
}
