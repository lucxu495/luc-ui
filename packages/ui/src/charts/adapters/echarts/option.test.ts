import { describe, expect, it } from "vitest";
import {
  animationFragment,
  axisFragment,
  baseOption,
  buildCartesianCrosshairOptions,
  dataZoomFragment,
  gridFragment,
  tooltipShell,
} from "./option";
import { ECHARTS_GLOBAL_OPTION } from "./echart-init";
import { defaultChartTheme } from "../../core/theme";
import { buildCartesianOption } from "./cartesian";
import { normalizeTabular } from "../../core/data";

const THEME = defaultChartTheme;
const MOTION = { intro: 300, update: 200, reduced: false, emphasis: 140, universal: true };

describe("animationFragment", () => {
  /*
   * The timezone the ticks are chosen in.
   *
   * See `echart-init.ts` for the measurement: without it, ECharts aligned month
   * ticks to local calendar boundaries while the axis labels printed UTC, and a
   * four-month window read "Jan Jan Feb Mar Apr" on any machine east of UTC.
   * `axis-time.test.ts` is the behavioural test; this one is the guard that the
   * flag travels with every option the library builds, including the ones a
   * server render produces.
   */
  it("pins every built option to the engine timezone the labels use", () => {
    expect(ECHARTS_GLOBAL_OPTION.useUTC).toBe(true);
    expect(baseOption(THEME, MOTION)).toMatchObject({ useUTC: true });
    expect(
      buildCartesianOption({
        spec: {
          family: "line",
          series: [{ key: "value", label: "Value", data: [[0, 1], [1, 2]] }],
          x: { type: "time" },
        } as never,
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular([{ t: 0, v: 1 }, { t: 1, v: 2 }], "t", { type: "time" }),
      }),
    ).toMatchObject({ useUTC: true });
  });

  it("removes every animation under reduced motion", () => {
    expect(animationFragment({ ...MOTION, reduced: true })).toEqual({
      animation: false,
      animationDuration: 0,
      animationDurationUpdate: 0,
      universalTransition: false,
    });
  });

  it("uses the token durations when motion is allowed", () => {
    expect(animationFragment(MOTION)).toMatchObject({
      animation: true,
      animationDuration: 300,
      animationDurationUpdate: 200,
      animationThreshold: 2500,
    });
  });

  it("only morphs when the caller asked for it", () => {
    expect(animationFragment(MOTION)).not.toHaveProperty("universalTransition");
    expect(animationFragment(MOTION, { universal: true })).toMatchObject({ universalTransition: true });
    // A budget that forbids universal transitions (large data) wins.
    expect(animationFragment({ ...MOTION, universal: false }, { universal: true })).not.toHaveProperty(
      "universalTransition",
    );
  });

  it("raises the per-mark animation threshold for a large series", () => {
    expect(animationFragment(MOTION, { threshold: 1 })).toMatchObject({ animationThreshold: 1 });
  });
});

describe("axisFragment", () => {
  it("shows horizontal grid lines on a value axis and none on a category axis", () => {
    const value = axisFragment({ theme: THEME, type: "value" }) as {
      splitLine: { show: boolean };
      axisTick: { show: boolean };
    };
    const category = axisFragment({ theme: THEME, type: "category" }) as {
      splitLine: { show: boolean };
    };
    expect(value.splitLine.show).toBe(true);
    expect(value.axisTick.show).toBe(false);
    expect(category.splitLine.show).toBe(false);
  });

  it("keeps a suppressed axis's type, so it still scales its own series", () => {
    // A hidden axis draws no plate, but it is still the scale of whatever binds
    // to it: a quiet context line on a hidden *log* axis must not silently
    // become a linear value axis (a 15-year price trajectory would collapse
    // into the first few pixels of the plot).
    expect(axisFragment({ theme: THEME, type: "log", hidden: true })).toEqual({
      show: false,
      type: "log",
    });
    expect(axisFragment({ theme: THEME, type: "value", hidden: true })).toEqual({
      show: false,
      type: "value",
    });
  });
});

describe("dataZoomFragment", () => {
  it("is empty when zoom is off, and inside-only by default", () => {
    expect(dataZoomFragment({ theme: THEME, interaction: { zoom: "none" } })).toEqual([]);
    const inside = dataZoomFragment({ theme: THEME }) as Array<{ type: string }>;
    expect(inside.map((entry) => entry.type)).toEqual(["inside"]);
    const slider = dataZoomFragment({ theme: THEME, interaction: { zoom: "slider" } }) as Array<{ type: string }>;
    expect(slider.map((entry) => entry.type)).toEqual(["inside", "slider"]);
  });
});

describe("tooltipShell", () => {
  it("hands styling to LUC and keeps the engine shell transparent", () => {
    const shell = tooltipShell(THEME, { formatter: () => "", mode: "axis" }) as Record<string, unknown>;
    expect(shell).toMatchObject({
      trigger: "axis",
      renderMode: "html",
      backgroundColor: "transparent",
      borderWidth: 0,
      padding: 0,
      className: "luc-chart-tooltip-shell",
    });
    expect(shell.show).toBe(true);
  });

  it("can be switched off entirely", () => {
    expect(tooltipShell(THEME, { formatter: () => "", mode: "none" })).toEqual({ show: false });
  });

  it("does not turn a non-Cartesian item tooltip into a crosshair", () => {
    const shell = tooltipShell(THEME, { formatter: () => "", mode: "item" }) as {
      axisPointer?: { type?: string };
    };
    expect(shell.axisPointer?.type).toBe("none");
  });
});

describe("cartesian crosshair policy", () => {
  it("uses one native cross, snaps X and leaves Y continuous", () => {
    const fragments = buildCartesianCrosshairOptions(THEME);
    expect(fragments.tooltipAxisPointer).toMatchObject({
      type: "cross",
      axis: "x",
      lineStyle: { color: THEME.crosshair, width: 1, type: "solid" },
      label: { show: true },
    });
    expect(fragments.xAxisPointer).toMatchObject({ snap: true, label: { show: true } });
    expect(fragments.yAxisPointer).toMatchObject({ snap: false, label: { show: false } });
  });

  it("allows X to follow continuously without changing the Y policy", () => {
    const fragments = buildCartesianCrosshairOptions(THEME, { snap: false });
    expect(fragments.xAxisPointer.snap).toBe(false);
    expect(fragments.yAxisPointer.snap).toBe(false);
  });

  it("can disable drawing while keeping the axis Tooltip's data model", () => {
    const fragments = buildCartesianCrosshairOptions(THEME, false);
    expect(fragments.tooltipAxisPointer).toMatchObject({
      type: "none",
      show: true,
      triggerTooltip: true,
      label: { show: false },
    });
    expect(fragments.xAxisPointer).toMatchObject({
      show: "auto",
      triggerTooltip: true,
      lineStyle: { opacity: 0 },
      label: { show: false },
    });
  });
});

describe("gridFragment", () => {
  it("keeps axis labels inside the plot box", () => {
    expect(gridFragment()).toMatchObject({ containLabel: true });
  });
});

describe("buildCartesianOption", () => {
  /*
   * Point display metadata is a *generic* hook: the caller hands the chart a
   * better label for an x value and a few context rows, and the chart prints
   * them without knowing what they mean. Nothing here is Fundamentals-specific.
   */
  describe("point display metadata", () => {
    const rows = [
      { t: "2025-03-29", v: 10 },
      { t: "2025-06-28", v: 20 },
      { t: "2025-09-27", v: 30 },
    ];

    it("prints the caller's label for a category point and the raw value otherwise", () => {
      const option = buildCartesianOption({
        spec: {
          family: "line",
          xKey: "t",
          x: { type: "category" },
          series: [{ key: "v", label: "Value" }],
          points: { "2025-03-29": { label: "FY25 Q2" } },
        },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rows, "t", { type: "category" }),
      }) as { xAxis: Array<{ data?: string[] }> };
      expect(option.xAxis[0]!.data).toEqual(["FY25 Q2", "2025-06-28", "2025-09-27"]);
    });

    it("prefers a supplied label on a time axis and keeps the date for a tick it does not name", () => {
      const option = buildCartesianOption({
        spec: {
          family: "line",
          xKey: "t",
          x: { type: "time" },
          series: [{ key: "v", label: "Value" }],
          points: { "2025-03-29": { label: "FY25 Q2" } },
        },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rows, "t", { type: "time" }),
      }) as { xAxis: Array<{ axisLabel?: { formatter?: (value: number) => string } }> };
      const formatter = option.xAxis[0]!.axisLabel!.formatter!;
      expect(formatter(Date.UTC(2025, 2, 29))).toBe("FY25 Q2");
      const other = formatter(Date.UTC(2025, 5, 28));
      expect(other).not.toBe("FY25 Q2");
      expect(other.length).toBeGreaterThan(0);
    });

    it("appends the caller's detail rows to the tooltip of that point only", () => {
      const option = buildCartesianOption({
        spec: {
          family: "line",
          xKey: "t",
          x: { type: "category" },
          series: [{ key: "v", label: "Value" }],
          points: {
            "2025-03-29": {
              label: "FY25 Q2",
              detail: [
                ["Period ended", "Mar 29, 2025"],
                ["Form", "10-Q"],
              ],
            },
          },
        },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rows, "t", { type: "category" }),
      }) as { tooltip: { formatter: (params: unknown) => string } };
      const named = option.tooltip.formatter([
        { seriesId: "v", seriesName: "Value", value: 10, dataIndex: 0, axisValue: "FY25 Q2" },
      ]);
      expect(named).toContain("Period ended");
      expect(named).toContain("Mar 29, 2025");
      expect(named).toContain("10-Q");
      // A point with no detail keeps the ordinary tooltip.
      const plain = option.tooltip.formatter([
        { seriesId: "v", seriesName: "Value", value: 20, dataIndex: 1, axisValue: "2025-06-28" },
      ]);
      expect(plain).not.toContain("Period ended");
    });

    it("leaves an ordinary chart's axis labelling unchanged when no points are supplied", () => {
      const option = buildCartesianOption({
        spec: {
          family: "line",
          xKey: "t",
          x: { type: "time" },
          series: [{ key: "v", label: "Value" }],
        },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rows, "t", { type: "time" }),
      }) as { xAxis: Array<{ axisLabel?: { formatter?: (value: number) => string } }> };
      const label = option.xAxis[0]!.axisLabel!.formatter!(Date.UTC(2025, 2, 29));
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toBe("FY25 Q2");
    });
  });

  /*
   * A compact event marker has no permanent label, so the chart's own tooltip
   * has to carry the event's served fields at the event's own date — and must
   * stay silent on every other date.
   */
  it("appends an event's detail rows to the tooltip of its own date only", () => {
    const option = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        x: { type: "time" },
        series: [{ key: "close", label: "Close" }],
        annotations: {
          markers: [
            {
              at: new Date(Date.UTC(2026, 0, 2)),
              label: "BTC halving",
              shape: "square",
              detail: [
                ["Date", "2026-01-02"],
                ["Cycle", "btc_cycle_840000"],
              ],
            },
          ],
        },
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(
        [
          { time: new Date(Date.UTC(2026, 0, 1)), close: 10 },
          { time: new Date(Date.UTC(2026, 0, 2)), close: 12 },
          { time: new Date(Date.UTC(2026, 3, 1)), close: 9 },
        ],
        "time",
      ),
    }) as { tooltip: { formatter: (params: unknown) => string } };

    const atEvent = option.tooltip.formatter([{ axisValue: Date.UTC(2026, 0, 2) }]);
    expect(atEvent).toContain("BTC halving");
    expect(atEvent).toContain("btc_cycle_840000");
    // A date well away from every event stays a plain series readout; the
    // tolerance only reaches the neighbouring bars, never the next landmark.
    expect(option.tooltip.formatter([{ axisValue: Date.UTC(2026, 3, 1) }])).not.toContain("BTC halving");
  });

  /*
   * The legend is a *control* (click a series to hide it), so it has to be a
   * real engine option built from the declared series — never a caption painted
   * beside them, and never including an engine-appended companion mark the
   * reader cannot toggle.
   */
  it("builds a selectable series legend only when the caller asks for one", () => {
    const withLegend = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        series: [
          { key: "close", label: "Close" },
          { key: "other", label: "Other" },
        ],
        legend: true,
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(
        [
          { time: new Date(Date.UTC(2026, 0, 1)), close: 10, other: 2 },
          { time: new Date(Date.UTC(2026, 0, 2)), close: 12, other: 3 },
        ],
        "time",
      ),
    }) as { legend?: { data: string[]; selectedMode: string }; grid: { bottom: number } };
    expect(withLegend.legend?.data).toEqual(["Close", "Other"]);
    expect(withLegend.legend?.selectedMode).toBe("multiple");
    // The control lives inside the plot rectangle, so the grid gives it room.
    expect(withLegend.grid.bottom).toBeGreaterThan(0);

    const without = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        series: [
          { key: "close", label: "Close" },
          { key: "other", label: "Other" },
        ],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(
        [
          { time: new Date(Date.UTC(2026, 0, 1)), close: 10, other: 2 },
          { time: new Date(Date.UTC(2026, 0, 2)), close: 12, other: 3 },
        ],
        "time",
      ),
    }) as { legend?: unknown };
    expect(without.legend).toBeUndefined();
  });

  it("keeps a context series out of the legend while still drawing and describing it", () => {
    // A faint price trajectory behind a measurement is **context**, not a
    // comparable quantity: it must not appear as a legend entry beside the
    // analytical series, and it must still be a real plotted series whose value
    // the tooltip reads.
    const option = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        legend: true,
        series: [
          { key: "sharpe", label: "Rolling Sharpe" },
          { key: "sortino", label: "Rolling Sortino" },
          {
            key: "context",
            label: "BTC price",
            axis: "context",
            legend: false,
            opacity: 0.3,
            z: 1,
          },
        ],
        axes: [
          { id: "primary" },
          { id: "context", type: "log", scaleMode: "log", position: "right", hidden: true },
        ],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(
        [
          { time: new Date(Date.UTC(2026, 0, 1)), sharpe: 1.2, sortino: 0.8, context: 83_000 },
          { time: new Date(Date.UTC(2026, 0, 2)), sharpe: 1.4, sortino: 1.1, context: 84_500 },
        ],
        "time",
      ),
    }) as {
      legend?: { data: string[] };
      yAxis: Array<{ show?: boolean; type?: string }>;
      series: Array<{ id: string; yAxisIndex: number; opacity?: number; z?: number }>;
    };
    expect(option.legend?.data).toEqual(["Rolling Sharpe", "Rolling Sortino"]);
    const context = option.series.find((series) => series.id === "context");
    expect(context).toMatchObject({ yAxisIndex: 1, opacity: 0.3, z: 1 });
    // The context axis is suppressed but keeps the log mapping it declared.
    expect(option.yAxis[1]).toMatchObject({ show: false, type: "log" });
  });

  const rows = [
    { time: new Date(Date.UTC(2026, 0, 1)), close: 10, other: 2 },
    { time: new Date(Date.UTC(2026, 0, 2)), close: 12, other: 3 },
    { time: new Date(Date.UTC(2026, 0, 3)), close: 11, other: 4 },
  ];

  it("labels a category axis from the data rather than from the series index", () => {
    const option = buildCartesianOption({
      spec: { family: "bar", xKey: "period", series: [{ key: "value", type: "bar" }] },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(
        [
          { period: "Q1", value: 4 },
          { period: "Q2", value: 6 },
        ],
        "period",
      ),
    }) as { xAxis: Array<{ data?: unknown[] }> };
    expect(option.xAxis[0]?.data).toEqual(["Q1", "Q2"]);
  });

  it("normalises a percent stack to 100 per category", () => {
    const option = buildCartesianOption({
      spec: {
        family: "bar",
        xKey: "period",
        series: [
          { key: "a", type: "bar", stack: "s", stackMode: "percent" },
          { key: "b", type: "bar", stack: "s", stackMode: "percent" },
        ],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular([{ period: "Q1", a: 30, b: 10 }], "period"),
    }) as { series: Array<{ data: number[] }> };
    expect(option.series[0]?.data).toEqual([75]);
    expect(option.series[1]?.data).toEqual([25]);
  });

  it("keeps one series per declared axis and assigns indices explicitly", () => {
    const option = buildCartesianOption({
      spec: {
        family: "composed",
        xKey: "time",
        axes: [
          { id: "primary", position: "left" },
          { id: "secondary", position: "right" },
        ],
        series: [
          { key: "close", axis: "primary" },
          { key: "other", axis: "secondary" },
        ],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(rows, "time"),
    }) as { series: Array<{ id: string; yAxisIndex: number }>; yAxis: unknown[] };
    expect(option.yAxis).toHaveLength(2);
    expect(option.series[0]).toMatchObject({ id: "close", yAxisIndex: 0 });
    expect(option.series[1]).toMatchObject({ id: "other", yAxisIndex: 1 });
  });

  it("builds a crosshair whose two Y plates retain their own formatters", () => {
    const option = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        x: { type: "time" },
        interaction: { zoom: "none" },
        axes: [
          { id: "ratio", position: "left", format: { kind: "percent", decimals: 1 } },
          { id: "price", position: "right", format: { kind: "currency", currency: "USD", decimals: 0 } },
        ],
        series: [
          { key: "ratio", axis: "ratio" },
          { key: "price", axis: "price" },
        ],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(rows, "time"),
    }) as {
      tooltip: { axisPointer: { type?: string; axis?: string; label?: { show?: boolean } } };
      xAxis: Array<{
        axisPointer: {
          snap?: boolean;
          label: { show?: boolean; formatter?: (value: number) => string };
        };
      }>;
      yAxis: Array<{
        position?: string;
        axisPointer: {
          snap?: boolean;
          label: { show?: boolean; formatter?: (value: number) => string };
        };
      }>;
      dataZoom: Array<{ type?: string; zoomOnMouseWheel?: boolean; moveOnMouseMove?: boolean }>;
    };
    expect(option.tooltip.axisPointer).toMatchObject({
      type: "cross",
      axis: "x",
      label: { show: true },
    });
    expect(option.xAxis[0]!.axisPointer).toMatchObject({ snap: true, label: { show: true } });
    expect(option.xAxis[0]!.axisPointer.label.formatter!(Date.UTC(2026, 0, 2))).toBe("Jan 26");
    expect(option.yAxis.map((axis) => axis.position)).toEqual(["left", "right"]);
    expect(option.yAxis[0]!.axisPointer.snap).toBe(false);
    expect(option.yAxis[1]!.axisPointer.snap).toBe(false);
    expect(option.yAxis[0]!.axisPointer.label.show).toBe(false);
    expect(option.yAxis[1]!.axisPointer.label.show).toBe(false);
    expect(option.yAxis[0]!.axisPointer.label.formatter!(52.4)).toContain("%");
    expect(option.yAxis[1]!.axisPointer.label.formatter!(84_250)).toContain("$");
    // Axis dragging has a range model even when wheel zoom is off, but it does
    // not steal wheel or plot-drag input.
    expect(option.dataZoom[0]).toMatchObject({
      type: "inside",
      zoomOnMouseWheel: false,
      moveOnMouseMove: false,
    });
  });

  it("emits no visible pointer or label when crosshair is explicitly off", () => {
    const option = buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        interaction: { crosshair: false, axisDrag: false, zoom: "none" },
        series: [{ key: "close" }],
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(rows, "time"),
    }) as {
      tooltip: { axisPointer: { type?: string; show?: boolean; label?: { show?: boolean } } };
      xAxis: Array<{ axisPointer: { lineStyle: { opacity?: number }; label: { show?: boolean } } }>;
      yAxis: Array<{ axisPointer: { show?: boolean; label: { show?: boolean } } }>;
      dataZoom?: unknown[];
    };
    expect(option.tooltip.axisPointer).toMatchObject({
      type: "none",
      show: true,
      label: { show: false },
    });
    expect(option.xAxis[0]!.axisPointer.lineStyle.opacity).toBe(0);
    expect(option.xAxis[0]!.axisPointer.label.show).toBe(false);
    expect(option.yAxis[0]!.axisPointer).toMatchObject({ show: false, label: { show: false } });
    expect(option.dataZoom).toBeUndefined();
  });

  it("lets a caller reach the assembled option through extendOption", () => {
    let captured: unknown = null;
    buildCartesianOption({
      spec: {
        family: "line",
        xKey: "time",
        series: [{ key: "close" }],
        extendOption: (option) => {
          captured = option;
        },
      },
      theme: THEME,
      motion: MOTION,
      normalized: normalizeTabular(rows, "time"),
    });
    expect(captured).not.toBeNull();
    expect(captured).toMatchObject({ series: expect.any(Array) });
  });

  describe("current point (V1.2)", () => {
    const rowsWithGap = [
      { time: new Date("2026-01-01"), close: 10 },
      { time: new Date("2026-01-02"), close: 12 },
      { time: new Date("2026-01-03"), close: 14 },
      { time: new Date("2026-01-04"), close: null },
    ];

    function seriesOf(spec: Parameters<typeof buildCartesianOption>[0]["spec"]) {
      const option = buildCartesianOption({
        spec,
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rowsWithGap, "time"),
      }) as { series: Array<Record<string, unknown>> };
      return option.series;
    }

    it("marks the latest real observation, not the last row", () => {
      const series = seriesOf({
        family: "line",
        xKey: "time",
        series: [{ key: "close", currentPoint: true }],
      });
      const marker = series.find((entry) => entry.id === "close__current");
      expect(marker).toBeDefined();
      expect(marker).toMatchObject({ type: "effectScatter" });
      // The trailing null is skipped: the marker lands on the 14, not on null.
      expect((marker?.data as unknown[])[0]).toEqual([new Date("2026-01-03").getTime(), 14]);
    });

    it("adds no marker unless the series asks for one", () => {
      const series = seriesOf({ family: "line", xKey: "time", series: [{ key: "close" }] });
      expect(series.some((entry) => entry.type === "effectScatter")).toBe(false);
    });

    it("keeps the ripple static when chart motion is reduced", () => {
      const option = buildCartesianOption({
        spec: { family: "line", xKey: "time", series: [{ key: "close", currentPoint: true }] },
        theme: THEME,
        motion: { ...MOTION, emphasis: 0, reduced: true },
        normalized: normalizeTabular(rowsWithGap, "time"),
      }) as { series: Array<{ id?: string; showEffectOn?: string }> };
      const marker = option.series.find((entry) => entry.id === "close__current");
      expect(marker?.showEffectOn).toBe("emphasis");
    });
  });

  describe("axis side, scale and domain (V1.3)", () => {
    const drawdownRows = [
      { time: new Date("2026-01-01"), dd: -0.85 },
      { time: new Date("2026-01-02"), dd: -0.4 },
      { time: new Date("2026-01-03"), dd: 0 },
    ];
    const priceRows = [
      { time: new Date("2026-01-01"), close: 2.24 },
      { time: new Date("2026-01-02"), close: 900 },
      { time: new Date("2026-01-03"), close: 124_658 },
    ];

    type Bounds = {
      position?: string;
      type?: string;
      min?: unknown;
      max?: unknown;
      axisLabel?: { showMinLabel?: boolean; showMaxLabel?: boolean };
    };

    function yAxisOf(
      spec: Parameters<typeof buildCartesianOption>[0]["spec"],
      rows: readonly object[],
    ): Bounds {
      const option = buildCartesianOption({
        spec,
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(rows, "time"),
      }) as { yAxis: Bounds[] };
      return option.yAxis[0]!;
    }

    it("puts an ordinary single-axis chart on the right, whatever it measures", () => {
      // A percentage is not a reason to move the plate: the financial lane is on
      // the right, so every single-axis chart is too.
      expect(yAxisOf({ family: "line", xKey: "time", series: [{ key: "dd" }] }, drawdownRows).position).toBe(
        "right",
      );
      expect(
        yAxisOf(
          { family: "line", xKey: "time", series: [{ key: "close" }], axes: [{ format: { kind: "percent" } }] },
          priceRows,
        ).position,
      ).toBe("right");
    });

    it("honours a deliberate left axis", () => {
      expect(
        yAxisOf(
          { family: "line", xKey: "time", series: [{ key: "dd" }], axes: [{ position: "left" }] },
          drawdownRows,
        ).position,
      ).toBe("left");
    });

    it("gives a drawdown headroom on both edges and labels neither of them", () => {
      const axis = yAxisOf({ family: "line", xKey: "time", series: [{ key: "dd" }] }, drawdownRows);
      const max = axis.max as (extent: { min: number; max: number }) => number;
      const min = axis.min as (extent: { min: number; max: number }) => number;
      const extent = { min: -0.8486, max: 0 };
      // The crest sits inside the plot instead of riding its boundary…
      expect(max(extent)).toBeGreaterThan(0);
      expect(min(extent)).toBeLessThan(-0.8486);
      // …and the padded band is never labelled as a value, so the axis cannot
      // imply that drawdown is positive.
      expect(axis.axisLabel?.showMaxLabel).toBe(false);
      expect(axis.axisLabel?.showMinLabel).toBe(false);
    });

    it("uses a log axis only when the data can carry one", () => {
      const log = yAxisOf(
        { family: "line", xKey: "time", series: [{ key: "close" }], scale: { allowed: ["linear", "log"], default: "log" } },
        priceRows,
      );
      expect(log.type).toBe("log");
      // The same chart over signed data falls back instead of drawing [1, 10].
      const fallback = yAxisOf(
        { family: "line", xKey: "time", series: [{ key: "dd" }], scale: { allowed: ["linear", "log"], default: "log" } },
        drawdownRows,
      );
      expect(fallback.type).toBe("value");
    });

    it("keeps a linear-only chart linear even when asked for log", () => {
      const axis = yAxisOf(
        {
          family: "line",
          xKey: "time",
          series: [{ key: "close" }],
          // A signed metric: the product allows one mode, the request is ignored.
          scale: { allowed: ["linear"], default: "linear", mode: "log" },
        },
        priceRows,
      );
      expect(axis.type).toBe("value");
    });

    it("reserves one plot rectangle for the whole stack", () => {
      const option = buildCartesianOption({
        spec: { family: "line", xKey: "time", series: [{ key: "close" }] },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(priceRows, "time"),
      }) as { grid: { left: number; right: number; containLabel: boolean } };
      expect(option.grid).toMatchObject({ containLabel: false });
      // The gutter is reserved for the axis; the data side keeps the small inset.
      expect(option.grid.right).toBeGreaterThan(option.grid.left);
    });

    it("keeps a declared threshold inside the axis it belongs to", () => {
      const option = buildCartesianOption({
        spec: {
          family: "line",
          xKey: "time",
          series: [{ key: "dd" }],
          annotations: { referenceLines: [{ value: 0.5, axis: "y", tone: "neutral" }] },
        },
        theme: THEME,
        motion: MOTION,
        normalized: normalizeTabular(drawdownRows, "time"),
      }) as { yAxis: Array<{ max: (extent: { min: number; max: number }) => number }> };
      expect(option.yAxis[0]!.max({ min: -0.85, max: 0 })).toBeGreaterThanOrEqual(0.5);
    });
  });
});
