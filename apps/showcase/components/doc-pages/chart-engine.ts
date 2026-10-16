/*
 * Which engine draws a chart, derived from the verified chart catalogue.
 *
 * A chart page must be able to say what draws it — that is the difference
 * between documentation and a screenshot. It must never *invent* that fact, so
 * this module reads it out of `components/charts/chart-catalog-data.ts`, the
 * same data `scripts/chart-catalog.mjs` checks against the package's real
 * exports. An entry whose symbol the catalogue does not list gets no engine
 * sentence at all rather than a guess.
 */

import { chartGroups, type ChartEngine } from "@/components/charts/chart-catalog-data";

export type { ChartEngine };

/** Every catalogue row, once, in a form a lookup can walk. */
const catalogue = chartGroups.flatMap((group) => group.entries);

/**
 * The engine for the first export the catalogue recognises.
 *
 * `symbol` in the catalogue can name two renderers of one plot (`·`) or a
 * composition (`+`), so the field is split before matching.
 */
export function chartEngineFor(symbols: readonly string[]): ChartEngine | undefined {
  for (const symbol of symbols) {
    const hit = catalogue.find((entry) =>
      entry.symbol
        .split(/[·+]/)
        .map((part) => part.trim())
        .includes(symbol),
    );
    if (hit) return hit.engine;
  }
  return undefined;
}

/** The engine as a sentence fragment. One line per real engine, no fallback. */
export const ENGINE_FRAGMENT: Record<ChartEngine, string> = {
  echarts: "the ECharts engine",
  "lightweight-charts": "the Lightweight Charts engine",
  "canvas-projection":
    "an ECharts custom series whose geometry the library computes, without WebGL",
};
