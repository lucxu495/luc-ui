/*
 * Theme Studio logic — pure.
 *
 * A theme is four attributes on an element: `data-theme`, `data-palette`,
 * `data-typeface`, `data-personality` (and the spacing register, `data-space`).
 * Tokens resolve against them, so the whole preview is one attribute list and
 * the copyable configuration is that same list serialized.
 *
 * The Studio offers only values the Showcase already ships — the registries in
 * `lib/appearance.ts` are the source, and nothing here invents a token. That is
 * also why the serialization is a plain attribute string rather than a config
 * object: it is the exact contract a consumer writes into `<html>`.
 */

import {
  DEFAULT_PALETTE,
  DEFAULT_PERSONALITY,
  DEFAULT_SPACE,
  DEFAULT_TYPEFACE,
  PERSONALITIES,
  PALETTES,
  SPACES,
  TYPEFACES,
  type Palette,
  type Personality,
  type Space,
  type Typeface,
} from "../appearance";

export interface ThemeSelection {
  mode: "dark" | "light";
  palette: Palette;
  typeface: Typeface;
  personality: Personality;
  space: Space;
}

export const DEFAULT_THEME: ThemeSelection = {
  mode: "dark",
  palette: DEFAULT_PALETTE,
  typeface: DEFAULT_TYPEFACE,
  personality: DEFAULT_PERSONALITY,
  space: DEFAULT_SPACE,
};

/** The attribute map a preview subtree and a consumer's `<html>` both apply. */
export function themeAttributes(selection: ThemeSelection): Record<string, string> {
  return {
    "data-theme": selection.mode,
    "data-palette": selection.palette,
    "data-typeface": selection.typeface,
    "data-personality": selection.personality,
    "data-space": selection.space,
  };
}

/** The one line a reader copies into their document element. */
export function themeAttributeString(selection: ThemeSelection): string {
  const attributes = themeAttributes(selection);
  return `<html ${Object.entries(attributes)
    .map(([name, value]) => `${name}="${value}"`)
    .join(" ")}>`;
}

export const THEME_CHOICES = {
  palettes: PALETTES.map((entry) => entry.id),
  typefaces: TYPEFACES.map((entry) => entry.id),
  personalities: PERSONALITIES.map((entry) => entry.id),
  spaces: SPACES.map((entry) => entry.id),
} as const;

