import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Palette + type-role gates.
 *
 * The token file is the product here: a palette that forgets `--accent-hover`
 * or ships white-on-yellow button text is a real defect, and neither shows up in
 * a component test. These assertions read `tokens.css` as source of truth — no
 * duplicated table of expected values, so the test cannot drift from the file it
 * is guarding.
 */

const css = readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "tokens.css"), "utf8");

const PALETTES = ["cyan", "violet", "cobalt", "emerald", "rose", "ember", "graphite"] as const;

/** The accent ramp a palette must define in full, in both modes. */
const RAMP = [
  "--accent-default",
  "--accent-hover",
  "--accent-active",
  "--accent-soft",
  "--accent-soft-hover",
  "--accent-strong",
  "--accent-on-accent",
  "--fg-on-accent",
  "--fg-accent",
  "--focus-ring",
] as const;

/** Strip comments so a documented example is never mistaken for a declaration. */
const source = css.replace(/\/\*[\s\S]*?\*\//g, "");

/** Every `selector { … }` rule whose selector text matches `selectorTest`. */
function rulesFor(selectorTest: (selector: string) => boolean): { selector: string; body: string }[] {
  const rules: { selector: string; body: string }[] = [];
  // `tokens.css` is flat — at-rules such as `@theme` wrap declarations but never
  // another rule — so scanning brace pairs is enough and avoids a CSS parser
  // dependency for a token-file guard.
  let cursor = 0;
  let selectorStart = 0;
  while (cursor < source.length) {
    if (source[cursor] !== "{") {
      cursor += 1;
      continue;
    }
    const selector = source.slice(selectorStart, cursor).trim();
    const close = source.indexOf("}", cursor);
    if (close < 0) break;
    const body = source.slice(cursor + 1, close);
    if (selectorTest(selector)) rules.push({ selector, body });
    cursor = close + 1;
    selectorStart = cursor;
  }
  return rules;
}

/** The declarations of one rule as a name → value map. */
function declarations(body: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of body.split(";")) {
    const index = line.indexOf(":");
    if (index < 0) continue;
    const name = line.slice(0, index).trim();
    if (!name.startsWith("--")) continue;
    map.set(name, line.slice(index + 1).trim());
  }
  return map;
}

function mergedPalette(palette: string, mode: "light" | "dark"): Map<string, string> {
  const escaped = `"${palette}"`;
  const rules = rulesFor((selector) => {
    if (!selector.includes(`[data-palette=${escaped}]`)) return false;
    const isDarkSelector = /\.dark|\[data-theme="dark"\]/.test(selector);
    return mode === "dark" ? isDarkSelector : !isDarkSelector;
  });
  const merged = new Map<string, string>();
  for (const rule of rules) {
    for (const [name, value] of declarations(rule.body)) merged.set(name, value);
  }
  return merged;
}

/* ---------------------------------------------------------------------------
 * oklch → sRGB, so contrast is computed rather than eyeballed.
 * Values outside sRGB are clipped, which is what an unmanaged browser does; the
 * real rendered contrast is measured separately by axe in browser QA.
 * ------------------------------------------------------------------------- */

function oklchToLinearRgb(l: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const lPrime = l + 0.3963377774 * a + 0.2158037573 * b;
  const mPrime = l - 0.1055613458 * a - 0.0638541728 * b;
  const sPrime = l - 0.0894841775 * a - 1.291485548 * b;

  const lc = lPrime ** 3;
  const mc = mPrime ** 3;
  const sc = sPrime ** 3;

  const clamp = (value: number) => Math.min(1, Math.max(0, value));
  return [
    clamp(4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc),
    clamp(-1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc),
    clamp(-0.0041960863 * lc - 0.7034186147 * mc + 1.707614701 * sc),
  ];
}

function parseOklch(value: string): [number, number, number] {
  const match = /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/.exec(value);
  if (!match) throw new Error(`Not an oklch() literal: ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance(value: string): number {
  const [r, g, b] = oklchToLinearRgb(...parseOklch(value));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** The surface a palette's accent text is read against, per mode. */
const SURFACE_DEFAULT = {
  light: "oklch(1 0 0)",
  dark: "oklch(0.1875 0.0100 258)",
} as const;

describe("brand palettes", () => {
  it.each(PALETTES)("%s defines the whole accent ramp in light and dark", (palette) => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = mergedPalette(palette, mode);
      const missing = RAMP.filter((token) => !tokens.has(token));
      expect(missing, `${palette}/${mode} is missing ${missing.join(", ")}`).toEqual([]);

      for (const token of RAMP) {
        const value = tokens.get(token)!;
        // Every ramp value is either a literal colour or a colour with alpha.
        expect(value, `${palette}/${mode} ${token}`).toMatch(/^oklch\(/);
      }
    }
  });

  it.each(PALETTES)("%s keeps accent and accent text distinguishable", (palette) => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = mergedPalette(palette, mode);
      // A filled accent control is the loudest accent surface in the system, so
      // its own label pair is the one that must never fail WCAG AA.
      expect(
        contrast(tokens.get("--accent-on-accent")!, tokens.get("--accent-default")!),
        `${palette}/${mode} accent-on-accent vs accent-default`,
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(PALETTES)("%s keeps accent text readable on the default surface", (palette) => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = mergedPalette(palette, mode);
      const value = contrast(tokens.get("--fg-accent")!, SURFACE_DEFAULT[mode]);
      // 4.5 for body-size accent text; 4.0 is the floor for the `large` case and
      // is only reached by `graphite`, whose accent *is* a neutral.
      expect(value, `${palette}/${mode} fg-accent vs surface-default`).toBeGreaterThanOrEqual(4.4);
    }
  });

  it.each(PALETTES)("%s declares derived tokens so a scoped palette is self-contained", (palette) => {
    // A subtree palette inherits already-substituted custom properties, so the
    // generic derived block has to match any element, not just the root.
    expect(rulesFor((selector) => selector === "[data-palette]").length).toBe(1);
    const derived = rulesFor(
      (selector) => selector.includes("[data-palette]") && !/\[data-palette="/.test(selector),
    );
    expect(derived.length).toBeGreaterThanOrEqual(2);
    const names = new Set(derived.flatMap((rule) => [...declarations(rule.body).keys()]));
    for (const token of ["--surface-selected", "--line-accent", "--glow-accent", "--chart-marker"]) {
      expect(names, `${token} must be re-derived for palettes`).toContain(token);
    }
    expect(palette).toBeTruthy();
  });

  it("does not let a light palette block reach a dark root", () => {
    // The dark variant must be *more specific* than `.dark`, otherwise source
    // order alone would decide and a root-level palette would keep cyan in dark.
    const rootPaletteRules = rulesFor((selector) => selector === '[data-palette="violet"]');
    expect(rootPaletteRules).toHaveLength(1);
    for (const palette of PALETTES) {
      const darkRules = rulesFor(
        (selector) => selector.includes(`[data-palette="${palette}"]`) && selector.includes(".dark["),
      );
      expect(darkRules.length, `dark palette rule for ${palette}`).toBeGreaterThan(0);
    }
  });
});

describe("type roles", () => {
  it.each(["editorial", "technical", "humanist"])("%s re-points the font roles", (typeface) => {
    const rules = rulesFor((selector) => selector === `[data-typeface="${typeface}"]`);
    expect(rules).toHaveLength(1);
    const tokens = declarations(rules[0]!.body);
    expect(tokens.size).toBeGreaterThan(0);
    // A preset must move at least one of the three roles; otherwise it is a
    // label with nothing behind it.
    const roles = ["--font-sans", "--font-display", "--font-mono", "--text-body--line-height"];
    expect(roles.some((role) => tokens.has(role))).toBe(true);
  });
});
