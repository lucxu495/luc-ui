/**
 * The x axis and the series data have to describe the same coordinate system.
 *
 * This is the invariant an independent consumer fixture found broken in Phase
 * 9.6, and it is worth stating plainly because violating it produces a chart
 * that passes every check this repository had:
 *
 *   - a **value** x axis reads a plain number as a coordinate pair, so a series
 *     of ordinary y values is plotted at `(y, y)` — a clean straight diagonal,
 *     indistinguishable at a glance from a real relationship;
 *   - a **category** x axis ignores plain ordering only if it is given the
 *     labels, and it ignores `axis.data` entirely when the type is `value`;
 *   - a **time** x axis wants the caller's timestamps.
 *
 * So: pairs for a value axis, values + labels for a category axis. The tests
 * below assert the pairing rather than a specific option shape, because the
 * shape is free to change and the pairing is not.
 */

import { describe, expect, it } from "vitest";

import { buildCartesianOption } from "./cartesian";
import { normalizeTabular } from "../../core/data";
import { chartThemeFallback } from "../../core/theme-tokens-light";

const THEME = chartThemeFallback("light");
const MOTION = { reduced: true, intro: 0, update: 0, emphasis: 0, universal: false };

type Option = {
  xAxis?: Array<{ type?: string; data?: unknown[] }>;
  yAxis?: Array<{ type?: string; data?: unknown[] }>;
  series?: Array<{ data?: unknown[] }>;
};

function option(rows: readonly object[], spec: Record<string, unknown>): Option {
  return buildCartesianOption({
    spec: { family: "line", ...spec } as never,
    theme: THEME,
    motion: MOTION,
    normalized: normalizeTabular(rows, (spec.xKey as string) ?? "x", spec.x as never),
  }) as Option;
}

const NUMERIC_ROWS = [
  { step: 1, close: 100 },
  { step: 2, close: 104 },
  { step: 3, close: 101 },
];

function isPaired(value: unknown): boolean {
  return Array.isArray(value) && value.length === 2;
}

describe("x axis / series data pairing", () => {
  it("keeps a numeric x that was not declared positional as a labelled category axis", () => {
    const built = option(NUMERIC_ROWS, { xKey: "step", series: [{ key: "close" }] });
    const [axis] = built.xAxis ?? [];
    expect(axis?.type).toBe("category");
    // The labels are the caller's own x values, not the series index. A missing
    // `data` here is how a chart ends up labelled 0…n while claiming to show
    // steps 1…n.
    expect(axis?.data).toEqual(["1", "2", "3"]);
    expect(built.series?.[0]?.data).toEqual([100, 104, 101]);
  });

  it("pairs the values when the caller declares a positional numeric x", () => {
    const built = option(NUMERIC_ROWS, {
      xKey: "step",
      x: { type: "value" },
      series: [{ key: "close" }],
    });
    expect(built.xAxis?.[0]?.type).toBe("value");
    expect(built.series?.[0]?.data?.every(isPaired)).toBe(true);
    expect(built.series?.[0]?.data?.[0]).toEqual([1, 100]);
  });

  it("treats an explicitly categorical numeric x as a category axis", () => {
    // Years as numbers are an ordering the caller declared; the axis has to be
    // the category axis they asked for, not the value axis the data implies.
    const built = option(
      [
        { year: 2024, value: 4 },
        { year: 2025, value: 6 },
      ],
      { xKey: "year", x: { type: "category" }, series: [{ key: "value", type: "bar" }] },
    );
    expect(built.xAxis?.[0]?.type).toBe("category");
    expect(built.xAxis?.[0]?.data).toEqual(["2024", "2025"]);
  });

  it("never emits plain values on a value axis", () => {
    /*
     * The general form of the invariant, over the configurations in reach:
     * whichever branch decides the axis, the data must match it. This is the
     * assertion that fails loudly if the two decisions drift apart again.
     */
    const cases: Array<{ rows: readonly object[]; spec: Record<string, unknown> }> = [
      { rows: NUMERIC_ROWS, spec: { xKey: "step", series: [{ key: "close" }] } },
      { rows: NUMERIC_ROWS, spec: { xKey: "step", x: { type: "value" }, series: [{ key: "close" }] } },
      {
        rows: NUMERIC_ROWS,
        spec: { xKey: "step", family: "scatter", series: [{ key: "close", type: "scatter" }] },
      },
      {
        rows: [{ period: "Q1", value: 4 }],
        spec: { xKey: "period", series: [{ key: "value", type: "bar" }] },
      },
      {
        rows: [{ period: "Q1", value: 4 }],
        spec: { xKey: "period", family: "bar", orientation: "horizontal", series: [{ key: "value", type: "bar" }] },
      },
      {
        rows: [{ time: new Date(Date.UTC(2026, 0, 1)), close: 10 }],
        spec: { xKey: "time", series: [{ key: "close" }] },
      },
    ];

    for (const entry of cases) {
      const built = option(entry.rows, entry.spec);
      const xType = built.xAxis?.[0]?.type;
      const yType = built.yAxis?.[0]?.type;
      const data = built.series?.[0]?.data ?? [];
      const label = `${String(entry.spec.xKey)}/${String(entry.spec.family ?? "line")}/x=${xType}/y=${yType}`;
      /*
       * A pair is required when *both* plates are numeric: that is when the
       * engine has no category to read the row order from and every value must
       * carry its own coordinate. A horizontal bar is the case that proves the
       * rule is about the two axes together rather than about the x axis alone
       * — its categories sit on the y plate, so its x values are plain and
       * correct.
       */
      const positionalX = (xType === "value" || xType === "time") && yType !== "category";
      if (positionalX) {
        expect(data.every(isPaired), `plain values against a ${xType} axis (${label})`).toBe(true);
      } else {
        expect(
          data.every((value) => !isPaired(value)),
          `paired values against a labelled ${xType} axis (${label})`,
        ).toBe(true);
      }
    }
  });
});
