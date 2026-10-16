"use client";

/*
 * LineChart — the chart Playground's reference adapter.
 *
 * A chart is not a control on a dataset; it is a dataset with presentation
 * choices on top of it. So the data is a fixed, deterministic fixture that the
 * copied code writes in full (no `Math.random()`, no `Date.now()`, no locale
 * formatting anywhere), and every control is a *presentation* decision:
 * title, height, legend, animation, state, which series are visible, the tooltip
 * mode and the accessible name.
 *
 * It lives in `registry.charts.ts` rather than `registry.ts` because importing
 * it pulls ECharts: a Button page must not pay for a chart page's engine.
 *
 * The series and the rows are declared once and the snippet is generated from
 * the same declarations the stage renders, so the picture and the code cannot
 * disagree.
 */

import { LineChart } from "@luc/ui/charts";
import type { SeriesSpec } from "@luc/ui/charts";
import { serializeProps } from "../engine";
import type { ControlValues, PlaygroundSpec } from "../types";

type ChartState = "ready" | "loading" | "empty" | "error";

const ANIMATIONS = ["none", "subtle", "standard", "emphasized"] as const;
const STATES = ["ready", "loading", "empty", "error"] as const;
const TOOLTIPS = ["axis", "item", "none"] as const;

/** Twelve sessions of one instrument. Deterministic: same values, every render. */
export const lineChartRows: readonly { date: string; close: number; trend: number }[] = [
  { date: "2026-09-21", close: 96.4, trend: 96.0 },
  { date: "2026-09-22", close: 96.9, trend: 96.2 },
  { date: "2026-09-23", close: 96.2, trend: 96.1 },
  { date: "2026-09-24", close: 95.5, trend: 95.9 },
  { date: "2026-09-25", close: 96.1, trend: 96.0 },
  { date: "2026-09-28", close: 97.3, trend: 96.3 },
  { date: "2026-09-29", close: 98.0, trend: 96.7 },
  { date: "2026-09-30", close: 97.4, trend: 96.9 },
  { date: "2026-10-01", close: 96.8, trend: 96.9 },
  { date: "2026-10-02", close: 97.9, trend: 97.1 },
  { date: "2026-10-05", close: 99.1, trend: 97.5 },
  { date: "2026-10-06", close: 98.6, trend: 97.8 },
];

export const lineChartSeries: readonly SeriesSpec[] = [
  { key: "close", label: "Close", type: "line", tone: "accent", lineWidth: 2 },
  { key: "trend", label: "Trend", type: "line", tone: "neutral", lineType: "dashed", symbol: false },
];

/** A literal for whatever the caller declared, rather than a hand-written string. */
function literal(value: unknown): string {
  return typeof value === "string" ? `"${value}"` : String(value);
}

function seriesCode(): string {
  const rows = lineChartSeries.map(
    (series) => `  { ${Object.entries(series).map(([key, value]) => `${key}: ${literal(value)}`).join(", ")} },`,
  );
  return ["const series = [", ...rows, "];"].join("\n");
}

function rowsCode(): string {
  const rows = lineChartRows.map(
    (row) => `  { date: "${row.date}", close: ${row.close}, trend: ${row.trend} },`,
  );
  return ["const rows = [", ...rows, "];"].join("\n");
}

export const lineChartPlayground: PlaygroundSpec = {
  id: "line-chart",
  component: "LineChart",
  importPath: "@luc/ui/charts",
  /*
   * DOC-003: the fixture, described once.
   *
   * The note used to end "Every value is the caller's, and the chart computes
   * nothing", which is the same contract the Usage section states two screens
   * later — and a third statement of it teaches nothing the first two did not.
   * What the reader needs here is what they are looking at.
   */
  stageNote: "A fixed twelve-session fixture: eight weekly closes and a fitted trend line.",
  /*
   * The chart family's variant list is its state list: the chart chrome draws
   * each one, and a reader looking for "what does an empty chart look like"
   * should not have to find it in a select.
   */
  presetSource: "state",
  controls: [
    {
      kind: "text",
      name: "title",
      label: "Title",
      default: "",
      help: "Also the chart's accessible name when no `ariaLabel` is given.",
    },
    {
      kind: "number",
      name: "height",
      label: "Height",
      default: 260,
      min: 180,
      max: 420,
      step: 20,
      unit: "px",
      sticky: true,
    },
    {
      kind: "boolean",
      name: "legend",
      label: "Legend",
      default: false,
      group: "variant",
      sticky: true,
      help: "The legend is also the series switch; it needs two or more comparable series.",
      /* WB-004: a loading or empty chart draws chrome, not a plot, so a legend
       * switch would change nothing and say nothing. */
      disabledWhen: {
        when: (values) => String(values.state) !== "ready",
        reason: "The chart draws state chrome instead of a plot, so there are no series to switch.",
      },
    },
    {
      kind: "list",
      name: "visibleSeries",
      label: "Visible series",
      default: ["close", "trend"],
      group: "variant",
      /* WB-004: a chart with no visible series cannot render. */
      minSelected: 1,
      options: [
        { value: "close", label: "Close" },
        { value: "trend", label: "Trend" },
      ],
      help: "Start with a series hidden rather than removing it from the data.",
    },
    {
      kind: "enum",
      name: "animation",
      label: "Animation",
      default: "standard",
      group: "advanced",
      sticky: true,
      options: ANIMATIONS.map((value) => ({ value })),
    },
    {
      kind: "enum",
      name: "state",
      label: "State",
      default: "ready",
      group: "variant",
      sticky: true,
      options: STATES.map((value) => ({ value })),
      help: "Loading, empty and error are drawn by the chart chrome, not by your page.",
    },
    {
      kind: "enum",
      name: "tooltip",
      label: "Tooltip",
      default: "axis",
      group: "advanced",
      placement: { kind: "composed" },
      options: TOOLTIPS.map((value) => ({ value })),
      help: "`axis` reads the whole column; `item` reads one mark.",
      disabledWhen: {
        when: (values) => String(values.state) !== "ready",
        reason: "There are no marks to read while the chart is loading, empty or in error.",
      },
    },
    {
      kind: "text",
      name: "ariaLabel",
      label: "Accessible name",
      default: "",
      group: "variant",
      help: "Leave it empty and the chart names itself from the title and the family.",
    },
  ],
  unsupported: [
    {
      name: "data",
      reason: "A whole dataset is the caller's, never a control. The preview draws a fixed fixture and the copied code writes it out in full.",
    },
    {
      name: "xKey",
      reason: "The fixture is keyed by `date`; a real chart's key follows the shape your API serves.",
    },
    {
      name: "series",
      reason: "Series mark types, axes and stacking are the analytical contract, described above this panel.",
    },
    {
      name: "className",
      reason: "Layout and width belong to the page that places the chart.",
    },
  ],
  render: (values: ControlValues) => (
    <LineChart
      data={lineChartRows}
      xKey="date"
      series={lineChartSeries}
      title={values.title === "" ? undefined : String(values.title)}
      height={typeof values.height === "number" ? values.height : 260}
      legend={values.legend === true}
      visibleSeries={Array.isArray(values.visibleSeries) ? values.visibleSeries : undefined}
      animation={String(values.animation) as (typeof ANIMATIONS)[number]}
      state={String(values.state) as ChartState}
      ariaLabel={values.ariaLabel === "" ? undefined : String(values.ariaLabel)}
      {...(String(values.tooltip) === "axis"
        ? {}
        : { tooltip: { mode: String(values.tooltip) as (typeof TOOLTIPS)[number] } })}
    />
  ),
  serialize: (values: ControlValues) => {
    const tooltip =
      String(values.tooltip) === "axis" ? "" : ` tooltip={{ mode: "${String(values.tooltip)}" }}`;
    const attributes = serializeProps(lineChartPlayground, values);
    return [
      rowsCode(),
      "",
      seriesCode(),
      "",
      `<LineChart${attributes} xKey="date" data={rows} series={series}${tooltip} />`,
    ].join("\n");
  },
};
