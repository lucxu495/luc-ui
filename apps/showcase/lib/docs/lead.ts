/*
 * The one-sentence lead under a page title, in the reader's language.
 *
 * Where a page's lead comes from is the thing that hid the defect: hand-written
 * pages call `tcs("…")` themselves, so the coverage extractor sees them, but a
 * *registry-generated* lead is data. `{entry.summary}` was rendered straight into
 * the header, which meant ~157 Chinese pages opened with an English sentence and
 * `verify:i18n` still reported 100% — the extractor only counts strings the source
 * names, and no source file named those (independent audit C-04).
 *
 * So every lead goes through `tcs` here, at the rendering boundary, and the chart
 * family gets one extra rule: its sentence is identical apart from the chart's own
 * name, so it is composed from a single translated template plus the translated
 * chart name instead of seventy-six near-identical dictionary entries.
 */

import type { DocEntry } from "./types";

/** A `tcs`-shaped lookup: English source in, the reader's language out. */
export type Translate = (source: string) => string;

/**
 * The chart lead: what the reader does with the chart, not how it is drawn.
 *
 * DOC-003. Every chart page opened with
 *
 *   "Draws line with the ECharts engine from the values the caller prepares —
 *    the renderer computes no statistic of its own."
 *
 * which is a sentence about the implementation, printed under a title that
 * already names the chart, on seventy-six pages — and the same contract was
 * stated a second time in the page's Usage section and a third time in the
 * specimen note. The independent audit quoted it as the copy that still needed
 * work; the reader wants to know what the chart is *for*.
 *
 * One sentence per family, because that is the granularity at which the answer
 * differs: a line chart and a box plot are reached for different reasons even
 * though both are drawn by the same engine. The contract they share — the values
 * arrive prepared and the renderer computes nothing — lives in the Usage copy
 * (`components/doc-pages/copy.ts`), where a reader looking for it will be, and
 * the engine is named there too, once.
 *
 * This module is dependency-free (a type-only import) so
 * `scripts/docs-registry.mjs` can transpile and call it: the sentence in the
 * registry *is* this function's output, which is what stops the page and the
 * search result from describing the same chart differently.
 */
export const CHART_LEAD_GENERAL =
  "Compare series and read the change behind them, with the axes, legend and tooltip already wired.";

export const CHART_LEAD_BY_FAMILY: Record<string, string> = {
  "chart-general": CHART_LEAD_GENERAL,
  "chart-statistical": "See the distribution, the agreement or the uncertainty in the values you supply.",
  "chart-scientific": "Read a field, a geometry or a spectrum, with the scale handled for you.",
  "chart-diagnostics": "Check whether a model or a process is sane, from values you computed.",
  "chart-financial": "Read a market, a risk or a return, with the axis and the tooltip wired for the job.",
  "chart-multidimensional": "Follow the relationship rather than the value — hover a mark to read its row.",
  "chart-workflow": "Show sequence, schedule or attribution over rows you prepared.",
  "chart-time": "Place regimes, events and calendars on one time axis a reader can inspect.",
  "chart-geographic": "Plot positions and routes on a plane whose bounds and coordinate meaning you declare.",
};

/** The sentence for a chart in `familyId`, or the general one. */
export function chartLeadTemplate(familyId?: string): string {
  return (familyId ? CHART_LEAD_BY_FAMILY[familyId] : undefined) ?? CHART_LEAD_GENERAL;
}

/** The lead for one entry, localized. */
export function entryLead(
  entry: Pick<DocEntry, "summary" | "family" | "chartName" | "chartEngine">,
  tcs: Translate,
): string {
  if (entry.chartName) return tcs(chartLeadTemplate(entry.family));
  return tcs(entry.summary);
}
