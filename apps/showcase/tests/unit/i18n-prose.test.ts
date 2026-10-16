/*
 * The prose extractor's contract.
 *
 * This module decides what a translator is asked for, so its mistakes are
 * expensive in both directions:
 *
 *   - a **false positive** asks for a Chinese rendering of an import statement
 *     (which is what happened: two lines of a usage snippet in
 *     `components/visuals/element-detail.tsx` were counted as documentation prose
 *     on every route, inflating the gap to 338);
 *   - a **false negative** ships an English sentence into the Chinese Showcase,
 *     which is the failure the whole coverage gate exists to prevent.
 *
 * Both directions are asserted here, on the exact shapes that caused the defect.
 */

import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { extractProse, isCodeString } from "../../scripts/i18n-prose.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const texts = (source: string): string[] =>
  extractProse(ts, source, "fixture.tsx").map((item: { text: string }) => item.text);

describe("isCodeString", () => {
  it("recognises a module statement in every shape this repository writes", () => {
    for (const code of [
      'import { Visual } from "@luc/ui/charts"',
      'import "@luc/ui/styles.css"',
      'import {\n  Visual,\n} from "@luc/ui/charts"',
      'export { default } from "./x"',
      "export const x = 1",
    ]) {
      expect(isCodeString(code), code).toBe(true);
    }
  });

  it("recognises a JSX line, collapsed or not", () => {
    for (const code of ['<Visual elementId="metric-value" />', "</div>", "<Chart\n  height={320}\n/>"]) {
      expect(isCodeString(code), code).toBe(true);
    }
  });

  it("does not claim a sentence that merely mentions one", () => {
    for (const prose of [
      "Import the stylesheet once at the app root.",
      "Exports are listed below the preview.",
      "Importing the package twice is harmless.",
    ]) {
      expect(isCodeString(prose), prose).toBe(false);
    }
  });
});

describe("extractProse", () => {
  it("leaves a usage-snippet array alone", () => {
    const source = `
      function usageSnippet() {
        return [
          'import { Visual } from "@luc/ui/charts"',
          'import "@luc/ui/styles.css"',
          "",
          "<Visual",
          '  elementId="metric-value"',
          "/>",
        ].join("\\n");
      }
    `;
    expect(texts(source)).toEqual([]);
  });

  it("still collects prose written in an array", () => {
    const source = `const notes = ["Tooltips — markup, typography, and the delay a reader expects."];`;
    expect(texts(source)).toEqual([
      "Tooltips — markup, typography, and the delay a reader expects.",
    ]);
  });

  it("still collects a `description` property", () => {
    const source = `const row = { name: "variant", description: "Intent, not importance." };`;
    expect(texts(source)).toContain("Intent, not importance.");
  });

  it("still collects a sentence wrapped in tcs()", () => {
    const source = `export const A = () => <p>{tcs("Every provider wrote inside its window.")}</p>;`;
    expect(texts(source)).toContain("Every provider wrote inside its window.");
  });

  it("still collects a copy attribute on documentation chrome", () => {
    const source = `export const A = () => <Section description="Depth in the surface stack, and the luminance step it buys." />;`;
    expect(texts(source)).toContain("Depth in the surface stack, and the luminance step it buys.");
  });

  it("does not collect a `description` that is really code", () => {
    const source = `const row = { description: 'import { Visual } from "@luc/ui/charts"' };`;
    expect(texts(source)).toEqual([]);
  });
});
