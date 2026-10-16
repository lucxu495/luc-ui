/**
 * The token bridge is a copy of `tokens/tokens.css`, and this test is what
 * makes it a *verified* copy.
 *
 * The failure mode being prevented is quiet: a designer moves a series colour
 * in the stylesheet, the DOM path picks it up immediately, the no-DOM table
 * keeps the old hue, and the only symptom is that a captured chart is a
 * slightly different blue from the one on the screen — six weeks later, in
 * somebody else's PDF.
 *
 * So this parses the real stylesheet, resolves the aliases it can resolve
 * deterministically (`var()` inside the same block, and
 * `color-mix(in oklab, X n%, transparent)` to `X` at alpha `n`), and compares
 * every token with the table, as resolved RGB. Comparison is by *resolved
 * colour* rather than by string so that `oklch(1 0 0 / 0.055)` and
 * `rgba(255,255,255,0.055)` — the same colour written two ways — are equal, as
 * they should be.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { CHART_THEME_TOKEN_NAMES } from "./theme-tokens";
import { CHART_THEME_TOKEN_VALUES } from "./theme-tokens-light";
import { parseColor, toRgbString } from "./theme";

const cssPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../tokens/tokens.css",
);
const css = readFileSync(cssPath, "utf8");

/** Split a stylesheet into `selector -> declarations` for the blocks we need. */
function declarationsForBlock(selectorPattern: string): Map<string, string> {
  const declarations = new Map<string, string>();
  const blockPattern = new RegExp(`${selectorPattern}\\s*\\{`, "gm");
  for (const match of css.matchAll(blockPattern)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 1;
    let index = start;
    while (index < css.length && depth > 0) {
      if (css[index] === "{") depth += 1;
      if (css[index] === "}") depth -= 1;
      index += 1;
    }
    const body = css.slice(start, index - 1);
    // Strip comments so a `--token:` mentioned in prose is not read as one.
    for (const line of body.replace(/\/\*[\s\S]*?\*\//g, "").split(/[;\n]/)) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("--")) continue;
      const separator = trimmed.indexOf(":");
      if (separator < 0) continue;
      const name = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (value) declarations.set(name, value);
    }
  }
  return declarations;
}

const lightTokens = declarationsForBlock("^:root");
/**
 * The dark cascade, not the dark block.
 *
 * `.dark` overrides `:root` and inherits everything it does not restate — which
 * is exactly why `--chart-ink-dark` / `--chart-ink-light` appear in only one of
 * them: a label printed on a coloured mark is chosen from the mark's own
 * contrast, so those two inks are deliberately absolute. Merging the blocks
 * reproduces the cascade instead of asserting something the stylesheet never
 * promised.
 */
const darkTokens = new Map([
  ...lightTokens,
  ...declarationsForBlock('^\\.dark,\\s*\\n\\[data-theme="dark"\\]'),
]);

/**
 * Resolve one declaration to a concrete colour.
 *
 * Two constructs appear in the chart tokens and both resolve without a browser:
 * a `var()` alias to another token in the same block, and a mix with
 * `transparent`, which is the source colour at the given alpha because the
 * transparent end contributes no channel.
 */
function resolveColour(
  raw: string,
  tokens: Map<string, string>,
  seen: ReadonlySet<string> = new Set(),
): string | null {
  const value = raw.trim();

  const alias = /^var\(\s*(--[\w-]+)\s*\)$/.exec(value);
  if (alias?.[1]) {
    if (seen.has(alias[1])) return null;
    const target = tokens.get(alias[1]);
    if (!target) return null;
    return resolveColour(target, tokens, new Set([...seen, alias[1]]));
  }

  const mix = /^color-mix\(\s*in\s+\w+\s*,\s*([\s\S]+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/.exec(value);
  if (mix?.[1] && mix[2] !== undefined) {
    const base = resolveColour(mix[1], tokens, seen);
    if (!base) return null;
    const parsed = parseColor(base);
    if (!parsed) return null;
    return toRgbString({ ...parsed, a: Number.parseFloat(mix[2]) / 100 });
  }

  return value;
}

function compare(mode: "light" | "dark", tokens: Map<string, string>) {
  const missing: string[] = [];
  const mismatched: string[] = [];
  const unparsed: string[] = [];

  for (const token of CHART_THEME_TOKEN_NAMES) {
    const declared = tokens.get(token);
    if (!declared) {
      missing.push(token);
      continue;
    }
    const resolved = resolveColour(declared, tokens);
    const fromCss = resolved ? parseColor(resolved) : null;
    const fromTable = parseColor(CHART_THEME_TOKEN_VALUES[mode][token]);
    if (!fromCss || !fromTable) {
      unparsed.push(`${token}: css=${declared} table=${CHART_THEME_TOKEN_VALUES[mode][token]}`);
      continue;
    }
    if (toRgbString(fromCss) !== toRgbString(fromTable)) {
      mismatched.push(`${token}: css=${toRgbString(fromCss)} table=${toRgbString(fromTable)}`);
    }
  }

  return { missing, mismatched, unparsed };
}

describe("chart theme tokens", () => {
  it("finds both theme blocks in tokens.css", () => {
    // A parser that silently finds nothing would make every assertion below
    // vacuous, so the fixture is asserted before it is used.
    expect(lightTokens.size).toBeGreaterThan(50);
    expect(darkTokens.size).toBeGreaterThan(50);
    expect(lightTokens.get("--chart-series-1")).toBeTruthy();
    expect(darkTokens.get("--chart-series-1")).toBeTruthy();
  });

  it("matches tokens.css in the light theme", () => {
    const { missing, mismatched, unparsed } = compare("light", lightTokens);
    expect({ missing, mismatched, unparsed }).toEqual({ missing: [], mismatched: [], unparsed: [] });
  });

  it("matches tokens.css in the dark theme", () => {
    const { missing, mismatched, unparsed } = compare("dark", darkTokens);
    expect({ missing, mismatched, unparsed }).toEqual({ missing: [], mismatched: [], unparsed: [] });
  });

  it("declares every token the mapper reads, in both modes", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(CHART_THEME_TOKEN_VALUES[mode]).sort()).toEqual(
        [...CHART_THEME_TOKEN_NAMES].sort(),
      );
    }
  });
});
