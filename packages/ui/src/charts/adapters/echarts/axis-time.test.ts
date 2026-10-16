import { describe, expect, it } from "vitest";
import * as echarts from "echarts";
import { axisFragment } from "./option";
import { ECHARTS_GLOBAL_OPTION, ECHARTS_INIT_OPTIONS } from "./echart-init";
import type { ChartTheme } from "../../core/theme";

/**
 * The time axis, measured through the real engine.
 *
 * Phase 7 found the defect by hand: `/charts/quantitative`'s drawdown — 120
 * daily points — printed `Jan Jan Feb Feb Feb Mar Mar Mar Apr Apr Apr May`.
 * The axis was present, styled, axe-clean and wrong. The cause was a split
 * decision: `timeAxisFormatter(span)` chose *how much of a date* to print, and
 * ECharts chose *how many ticks* to draw from the canvas width, so a wide plot
 * drew eleven-day ticks under a month-name formatter.
 *
 * `timeAxisTickPlan` now returns both from the one span. This test renders the
 * matrix through ECharts' own server renderer and reads the ticks back out of
 * the live scale, because "the labels are unique" is a property of what the
 * engine actually places, not of what the plan intended.
 */

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;
const START = Date.UTC(2025, 0, 2);

const theme = {
  axisLabel: "#888888",
  axisLine: "#333333",
  grid: "#222222",
  crosshair: "#4d4d4d",
  crosshairLabelBg: "#111111",
  crosshairLabelFg: "#eeeeee",
  fontFamily: "Inter",
  fontMicro: 11,
  fontCaption: 12,
} as unknown as ChartTheme;

/** Render one axis at one width and return the tick labels ECharts placed. */
function tickLabels(spanMs: number, width: number): string[] {
  const steps = 160;
  const series = Array.from({ length: steps + 1 }, (_, index) => [
    START + (spanMs * index) / steps,
    Math.sin(index / 9) * 10,
  ]);
  const xAxis = axisFragment({ type: "time", theme, spanMs, format: { kind: "date" } });
  /* The product's own engine configuration, not a hand-picked set. */
  const chart = echarts.init(null, null, {
    ...ECHARTS_INIT_OPTIONS,
    renderer: "svg",
    ssr: true,
    width,
    height: 280,
  });
  chart.setOption({
    /*
     * `useUTC` is the reason these tests are the ones that caught the defect.
     *
     * The ticks ECharts places and the labels we print have to be in one
     * timezone. Without this the engine aligned month ticks to *local* calendar
     * boundaries and the UTC formatter printed the day before — "Jan Jan Feb Mar
     * Apr" for a four-month window on a machine at UTC+8, unique labels on a
     * machine at UTC. The harness takes the shipped constant so it cannot drift
     * from the surface the readers use.
     */
    ...ECHARTS_GLOBAL_OPTION,
    animation: false,
    xAxis,
    yAxis: { type: "value" },
    series: [{ type: "line", data: series }],
  });
  /*
   * `getModel()` is the engine's own introspection hook and is not part of its
   * public type. Reading the ticks back out is the whole point of this test, so
   * the cast is deliberate and confined to it.
   */
  const model = (chart as unknown as { getModel: () => { getComponent: (name: string) => { axis: { scale: { getTicks: () => Array<{ value: number }> } } } } }).getModel();
  const scale = model.getComponent("xAxis").axis.scale;
  const formatter = (xAxis.axisLabel as { formatter: (value: number) => string }).formatter;
  const labels = scale.getTicks().map((tick: { value: number }) => formatter(tick.value));
  chart.dispose();
  return labels;
}

/**
 * The final tick is the axis's own maximum, which may fall a day after the last
 * aligned tick and therefore repeat its label. That pair sits at the axis edge
 * and ECharts' `hideOverlap` drops it at paint time; every *other* pair has to
 * be distinct.
 */
function interiorDuplicates(labels: string[]): string[] {
  const interior = labels.slice(0, -1);
  return interior.filter((label, index) => interior.indexOf(label) !== index);
}

const SPANS: Array<[string, number]> = [
  ["30 minutes", 30 * MINUTE],
  ["12 hours", 12 * HOUR],
  ["2 days", 2 * DAY],
  ["9 days", 9 * DAY],
  ["6 weeks", 42 * DAY],
  ["119 days", 119 * DAY],
  ["1 year", 365 * DAY],
  ["2 years", 730 * DAY],
  ["6 years", 2190 * DAY],
  ["20 years", 20 * 365 * DAY],
];

describe("a time axis labels its ticks without repeating them", () => {
  for (const [name, span] of SPANS) {
    for (const width of [420, 760, 1160, 1600]) {
      it(`${name} at ${width}px`, () => {
        const labels = tickLabels(span, width);
        expect(labels.length).toBeGreaterThan(1);
        expect(interiorDuplicates(labels)).toEqual([]);
        expect(new Set(labels).size).toBeGreaterThan(1);
      });
    }
  }

  it("regresses the exact Phase 7 fixture: 120 daily points over four months", () => {
    const labels = tickLabels(119 * DAY, 1160);
    // The defect printed "Jan Jan Feb Feb Feb Mar Mar Mar Apr Apr Apr May".
    expect(labels).not.toContain("Jan Jan");
    expect(labels.slice(0, -1)).toEqual(["Jan", "Feb", "Mar", "Apr"]);
  });

  it("keeps a two-year window on month-and-year labels", () => {
    const labels = tickLabels(730 * DAY, 1160);
    expect(labels.slice(0, -1).every((label) => /^[A-Z][a-z]{2} \d\d$/.test(label))).toBe(true);
  });

  it("gives a sub-day window clock times rather than dates", () => {
    const labels = tickLabels(12 * HOUR, 760);
    expect(labels.slice(0, -1).every((label) => /^\d\d:\d\d$/.test(label))).toBe(true);
  });
});
