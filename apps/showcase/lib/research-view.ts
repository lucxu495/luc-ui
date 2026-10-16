import {
  dateOnlyParam,
  enumParam,
  listParam,
  nullableParam,
  param,
  params,
  sortListParam,
  stringParam,
  type ParamState,
} from "@luc/ui/url-state";
import { addDays, dateOnlyFromInstant, type CalendarDate } from "@luc/ui/datetime";
import { marketSeries } from "./mock-data";
import { researchRuns } from "./table-data";

/**
 * The flagship workspace's shareable view.
 *
 * Every value here describes *what you are looking at*, never how the UI
 * happens to be arranged. Pane sizes, the inspector's open state and the
 * hovered crosshair are deliberately absent: those are personal or ephemeral.
 *
 * The window is stored as two date-only parameters rather than as
 * `range=1y`, so a copied link means the same thing forever — a preset that
 * says "last year" drifts, two dates do not. The chips are *derived* from the
 * window, which is the rule the date system already applies to presets.
 */

const DATASET = marketSeries({ days: 900, endDate: "2026-09-25" });

/** The dataset's last day, as a calendar date. No `new Date("YYYY-MM-DD")`. */
export const DATASET_END = dateOnlyFromInstant(DATASET[DATASET.length - 1]!.time, "UTC");
export const DATASET_START = dateOnlyFromInstant(DATASET[0]!.time, "UTC");

export const WINDOW_CHIPS = [
  { id: "3m", label: "3M", days: 90 },
  { id: "6m", label: "6M", days: 180 },
  { id: "1y", label: "1Y", days: 365 },
  { id: "2y", label: "2Y", days: 730 },
] as const;

export type WindowChipId = (typeof WINDOW_CHIPS)[number]["id"];

export function windowForChip(id: WindowChipId): { start: CalendarDate; end: CalendarDate } {
  const chip = WINDOW_CHIPS.find((entry) => entry.id === id) ?? WINDOW_CHIPS[2];
  return { start: addDays(DATASET_END, -(chip.days - 1)), end: DATASET_END };
}

/** The active chip is derived from the window — never stored beside it. */
export function chipForWindow(from: CalendarDate, to: CalendarDate): WindowChipId | "custom" {
  for (const chip of WINDOW_CHIPS) {
    const window = windowForChip(chip.id);
    if (from.compare(window.start) === 0 && to.compare(window.end) === 0) return chip.id;
  }
  return "custom";
}

const DEFAULT_WINDOW = windowForChip("1y");

export const researchParams = params({
  from: param(dateOnlyParam(), DEFAULT_WINDOW.start),
  to: param(dateOnlyParam(), DEFAULT_WINDOW.end),
  series: param(listParam(stringParam()), ["close"]),
  view: param(enumParam(["both", "chart", "table"] as const), "both"),
  status: param(enumParam(["all", "live", "draft", "paused", "failed"] as const), "all"),
  sort: param(sortListParam({ maxItems: 2 }), [{ id: "sharpe", desc: true }]),
  q: param(stringParam({ maxLength: 48 }), ""),
  cursor: param(nullableParam(dateOnlyParam()), null),
});

export type ResearchView = ParamState<typeof researchParams>;

export const SERIES_OPTIONS = [
  { id: "close", label: "Close", tone: "accent" },
  { id: "sma50", label: "SMA 50", tone: "neutral" },
  { id: "sma200", label: "SMA 200", tone: "warning" },
] as const;

export type SeriesOptionId = (typeof SERIES_OPTIONS)[number]["id"];
export const DEFAULT_SERIES: SeriesOptionId[] = ["close"];

/** Which prepared rows fall inside the window. Inclusive at both ends. */
export function rowsInWindow(view: Pick<ResearchView, "from" | "to">) {
  return DATASET.filter((row) => {
    const date = dateOnlyFromInstant(row.time, "UTC");
    return date.compare(view.from) >= 0 && date.compare(view.to) <= 0;
  });
}

/** The row the pinned cursor points at, or undefined when nothing is pinned. */
export function rowAtCursor(view: Pick<ResearchView, "cursor">) {
  if (!view.cursor) return undefined;
  return DATASET.find((row) => dateOnlyFromInstant(row.time, "UTC").compare(view.cursor!) === 0);
}

export const RESEARCH_RUNS = researchRuns(48);

/**
 * Runs whose last update falls inside the window. `updated` is an epoch
 * timestamp, so the comparison is an instant against an inclusive date range
 * anchored explicitly at UTC.
 */
export function runsInWindow(view: Pick<ResearchView, "from" | "to">) {
  const from = view.from.toDate("UTC").getTime();
  const to = view.to.toDate("UTC").getTime() + 86_399_999;
  return RESEARCH_RUNS.filter((run) => run.updated >= from && run.updated <= to);
}

/** A calendar date to the epoch milliseconds the chart layer speaks. */
export function instantFromDateOnly(date: CalendarDate): number {
  return date.toDate("UTC").getTime();
}

/** The inverse, for writing a chart cursor back into the URL. */
export function dateOnlyFromMilliseconds(ms: number): CalendarDate {
  return dateOnlyFromInstant(ms, "UTC");
}
