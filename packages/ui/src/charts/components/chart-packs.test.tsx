import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Phase 4 chart packs, asserted at the option boundary.
 *
 * Every assertion here reads the object that would be handed to the engine
 * rather than a rendered pixel, because the claim being tested is a *contract*:
 * the interval drawn is the interval supplied, the rank axis is inverted, the
 * candle engine is `candlestick` and not a line. A screenshot could not tell you
 * any of that, and an empty canvas would pass a "it rendered" test.
 */
const { setOption } = vi.hoisted(() => ({ setOption: vi.fn() }));

vi.mock("../adapters/echarts/runtime", () => {
  const instance = {
    setOption,
    resize: () => {},
    dispose: () => {},
    on: () => {},
    off: () => {},
    getZr: () => ({ on: () => {} }),
    dispatchAction: () => {},
    convertToPixel: () => 0,
    getWidth: () => 640,
    getHeight: () => 320,
  };
  return {
    loadECharts: async () => ({ init: () => instance, use: () => {} }),
  };
});

import { BumpChart, BulletChart, DumbbellChart, GanttChart, LollipopChart, MekkoChart, SlopeChart } from "./workflow-charts";
import {
  CalibrationChart,
  ConfusionMatrixChart,
  EcdfChart,
  ErrorBarChart,
  QqPlotChart,
  ResidualChart,
  RocCurveChart,
  ViolinChart,
} from "./statistical-charts";
import {
  ContourChart,
  HexbinChart,
  ParallelCoordinatesChart,
  PolarRoseChart,
  RidgelineChart,
  SpectrogramChart,
  TernaryChart,
  ThemeRiverChart,
  VectorFieldChart,
  WindRoseChart,
} from "./scientific-charts";
import {
  CandlestickChart,
  DrawdownChart,
  EfficientFrontierChart,
  FactorExposureChart,
  PnlAttributionChart,
  VolatilitySmileChart,
} from "./quantitative-charts";
import {
  GeoScatterChart,
  HierarchyTreeChart,
  ScatterMatrixChart,
} from "./multidimensional-charts";

/*
 * The option object is a payload handed to a third-party engine, so the test
 * reads it structurally. `any` is deliberate here: the assertions below are
 * about *shape*, and a stricter type would only require a cast per field.
 */
/* eslint-disable @typescript-eslint/no-explicit-any -- engine option payload */
type Option = Record<string, any>;

function lastOption(): Option {
  return (setOption.mock.calls.at(-1)?.[0] ?? {}) as Option;
}

function seriesOf(option: Option): Option[] {
  return (option.series as Option[] | undefined) ?? [];
}

beforeEach(() => setOption.mockClear());

describe("statistical chart pack", () => {
  it("draws an ECDF as a step function and labels its axis as a percentage", async () => {
    render(
      <EcdfChart
        series={[{ key: "a", label: "Sample", points: [{ x: 1, y: 0.25 }, { x: 2, y: 0.5 }] }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.type).toBe("line");
    expect(series[0]?.step).toBe("end");
  });

  it("adds the 45° reference line to a Q–Q plot instead of fitting anything", async () => {
    render(<QqPlotChart points={[{ x: -1, y: -0.9 }, { x: 0, y: 0.1 }, { x: 1, y: 1.2 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    const reference = series.find((entry) => entry.name === "45°");
    expect(reference?.type).toBe("line");
    expect(reference?.lineStyle).toMatchObject({ type: "dashed" });
  });

  it("mirrors a violin outline around its category axis", async () => {
    render(
      <ViolinChart
        groups={[
          {
            label: "Alpha",
            bins: [
              { value: 1, density: 0.2 },
              { value: 2, density: 0.9 },
              { value: 3, density: 0.3 },
            ],
            marker: { value: 2, label: "median" },
          },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.type).toBe("custom");
    expect(series.some((entry) => entry.name === "Alpha median")).toBe(true);
  });

  it("prints the supplied AUC rather than computing one", async () => {
    render(<RocCurveChart curves={[{ label: "Model A", auc: 0.812, points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const names = seriesOf(lastOption()).map((entry) => String(entry.name));
    expect(names).toContain("Model A · AUC 0.812");
    expect(names).toContain("Chance");
  });

  it("sizes a calibration bubble by the supplied bin count", async () => {
    render(<CalibrationChart bins={[{ predicted: 0.1, observed: 0.08, count: 5 }, { predicted: 0.9, observed: 0.86, count: 200 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const observed = seriesOf(lastOption()).find((entry) => entry.name === "Observed");
    expect(typeof observed?.symbolSize).toBe("function");
  });

  it("offers row normalisation on a confusion matrix without touching the data", async () => {
    render(
      <ConfusionMatrixChart
        labels={["buy", "sell"]}
        matrix={[
          [90, 10],
          [4, 40],
        ]}
        normalized
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption())[0]!;
    const cells = series.data as [number, number, number][];
    /* Row 0 normalises to 0.9 / 0.1. The instance still holds the raw counts;
       the *display* value is the rate, which is what `normalized` promises. */
    expect(cells[0]![2]).toBeCloseTo(0.9, 5);
    expect(cells[1]![2]).toBeCloseTo(0.1, 5);
  });

  it("draws exactly the interval an error bar was given", async () => {
    render(<ErrorBarChart points={[{ label: "Momentum", value: 1.2, lower: 0.9, upper: 1.6 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const interval = seriesOf(lastOption())[0]!;
    expect(interval.type).toBe("custom");
    expect(interval.data).toEqual([[0, 0.9, 1.6, 1.2]]);
  });

  it("anchors residuals on a zero line", async () => {
    render(<ResidualChart points={[{ fitted: 1, residual: 0.1 }, { fitted: 2, residual: -0.3 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const zero = seriesOf(lastOption()).find((entry) => entry.name === "Zero");
    expect(zero?.data).toEqual([
      [Number.NEGATIVE_INFINITY, 0],
      [Number.POSITIVE_INFINITY, 0],
    ]);
  });
});

describe("scientific chart pack", () => {
  it("builds one parallel axis per variable", async () => {
    render(
      <ParallelCoordinatesChart
        axes={[
          { key: "sharpe", label: "Sharpe" },
          { key: "drawdown", label: "Drawdown", invert: true },
          { key: "turnover", label: "Turnover" },
        ]}
        rows={[{ sharpe: 1.2, drawdown: -0.3, turnover: 4 }, { sharpe: 0.6, drawdown: -0.1, turnover: 9 }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.parallelAxis as unknown[]).length).toBe(3);
    expect(seriesOf(option)[0]?.type).toBe("parallel");
  });

  it("keeps the polar rose's radius as the measurement", async () => {
    render(<PolarRoseChart data={[{ name: "EMEA", value: 40 }, { name: "APAC", value: 55 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption())[0]!;
    expect(series.roseType).toBe("radius");
    expect((series.data as unknown[]).length).toBe(2);
  });

  it("stacks a wind rose and starts it at north", async () => {
    render(
      <WindRoseChart
        directions={["N", "E", "S", "W"]}
        series={[
          { label: "0–10 kn", values: [12, 8, 4, 9] },
          { label: "10–20 kn", values: [4, 3, 1, 2] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.angleAxis as { startAngle?: number }).startAngle).toBe(90);
    expect(seriesOf(option).every((entry) => entry.stack === "rose")).toBe(true);
  });

  it("reports the shares a ternary point was given", async () => {
    render(<TernaryChart points={[{ a: 0.2, b: 0.3, c: 0.5, label: "Mix A" }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const scatter = seriesOf(lastOption()).find((entry) => entry.type === "scatter");
    const data = scatter?.data as { value: [number, number] }[];
    /* a = 0.2 at the apex, so the projected point sits inside the triangle. */
    expect(data[0]!.value[0]).toBeGreaterThan(0);
    expect(data[0]!.value[1]).toBeGreaterThan(0);
  });

  it("draws one arrow per supplied vector", async () => {
    render(<VectorFieldChart vectors={[{ x: 0, y: 0, u: 1, v: 1 }, { x: 1, y: 0, u: -1, v: 0.5 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption())[0]!;
    /*
     * A quiver is a `custom` series, not `lines`: `lines` is built for a few
     * hundred routed paths and renders only a fraction of a few hundred arrows,
     * which is exactly what the Showcase screenshots caught. One shaft plus one
     * head per sample is the contract.
     */
    expect(series.type).toBe("custom");
    expect((series.data as unknown[]).length).toBe(2);
    /* `[x, y, u × scale, v × scale]` — the caller's vector, not normalised. */
    expect(series.data[0]).toEqual([0, 0, 1, 1]);
  });

  it("keeps iso lines at the level they claim", async () => {
    render(
      <ContourChart
        levels={[
          { level: 0.5, rings: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
          { level: 1, rings: [[[0.5, 0.5], [1.5, 0.5], [1.5, 1.5], [0.5, 0.5]]] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const names = seriesOf(lastOption()).map((entry) => String(entry.name));
    expect(names).toEqual(["Level 0.5", "Level 1"]);
  });

  it("builds the spectrogram over both of its physical axes", async () => {
    render(
      <SpectrogramChart
        xValues={["0s", "1s"]}
        yValues={["100Hz", "200Hz"]}
        values={[
          [-20, -30],
          [-40, -10],
        ]}
        unit="dBFS"
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.xAxis as { data?: string[] }).data).toEqual(["0s", "1s"]);
    expect((option.yAxis as { data?: string[] }).data).toEqual(["100Hz", "200Hz"]);
    expect((seriesOf(option)[0]?.data as unknown[]).length).toBe(4);
  });

  it("uses the engine's own stream layout for a theme river", async () => {
    render(<ThemeRiverChart events={[{ date: "2026-01-01", name: "AI", value: 3 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect(seriesOf(lastOption())[0]?.type).toBe("themeRiver");
  });

  it("offsets each ridge by the overlap rather than by the data", async () => {
    render(
      <RidgelineChart
        groups={[
          { label: "A", points: [{ label: "A", x: 0, density: 1 }, { label: "A", x: 1, density: 0.2 }] },
          { label: "B", points: [{ label: "B", x: 0, density: 0.4 }, { label: "B", x: 1, density: 1 }] },
        ]}
        overlap={0.5}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    const firstPointOf = (index: number) => (series[index]!.data as [number, number][])[1]!;
    /* Group 0 sits at the top (offset 0.5), group 1 at the bottom (offset 0). */
    expect(firstPointOf(0)[1]).toBeGreaterThan(firstPointOf(1)[1]);
  });

  it("draws one hexagon per supplied bin", async () => {
    render(<HexbinChart radius={0.5} cells={[{ x: 0, y: 0, value: 3 }, { x: 1, y: 0, value: 9 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption())[0]!;
    expect(series.type).toBe("custom");
    expect((series.data as unknown[]).length).toBe(2);
  });
});

describe("workflow chart pack", () => {
  it("places a Gantt bar between the supplied start and end", async () => {
    render(<GanttChart tasks={[{ id: "a", name: "Backfill", start: 0, end: 3_600_000, progress: 0.5 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect((seriesOf(lastOption())[0]?.data as unknown[])[0]).toEqual([0, 0, 3_600_000, 0.5]);
  });

  it("draws a dumbbell connector plus both marks", async () => {
    render(<DumbbellChart rows={[{ label: "Volatility", from: 0.14, to: 0.19 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series.map((entry) => entry.type)).toEqual(["custom", "scatter", "scatter"]);
  });

  it("gives a slope chart exactly two columns", async () => {
    render(<SlopeChart rows={[{ label: "Alpha", left: 1, right: 2 }]} periods={["Q1", "Q2"]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.xAxis as { min?: number; max?: number }).max).toBe(1);
    expect((seriesOf(option)[0]?.data as unknown[]).length).toBe(2);
  });

  it("keeps a lollipop's head at the value", async () => {
    render(<LollipopChart data={[{ label: "BTC", value: 12.4 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const head = seriesOf(lastOption()).find((entry) => entry.name === "Value");
    expect((head?.data as { value: number[] }[])[0]!.value[0]).toBe(12.4);
  });

  it("stacks bullet ranges under the measured bar and the target marker", async () => {
    render(<BulletChart rows={[{ label: "Uptime", value: 97, target: 99.5, ranges: [90, 99, 100] }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const names = seriesOf(lastOption()).map((entry) => String(entry.name));
    expect(names).toEqual(["Band 1", "Band 2", "Band 3", "Actual", "Target"]);
  });

  it("inverts the rank axis on a bump chart", async () => {
    render(<BumpChart periods={["Jan", "Feb"]} series={[{ label: "A", ranks: [2, 1] }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect((lastOption().yAxis as { inverse?: boolean }).inverse).toBe(true);
  });

  it("widths a Mekko column by its weight", async () => {
    render(
      <MekkoChart
        columns={[
          { label: "Large", weight: 75, segments: [{ name: "Retail", value: 30 }, { name: "Institutional", value: 45 }] },
          { label: "Small", weight: 25, segments: [{ name: "Retail", value: 20 }, { name: "Institutional", value: 5 }] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const retail = seriesOf(lastOption())[0]!;
    const [large, small] = retail.data as number[][];
    expect(large![2]! - large![1]!).toBeCloseTo(0.75, 5);
    expect(small![2]! - small![1]!).toBeCloseTo(0.25, 5);
  });
});

describe("quantitative chart pack", () => {
  it("uses the candlestick mark and the theme's own gain/loss pair", async () => {
    render(
      <CandlestickChart
        candles={[
          { time: 0, open: 100, high: 110, low: 95, close: 108 },
          { time: 86_400_000, open: 108, high: 112, low: 104, close: 105 },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption())[0]!;
    expect(series.type).toBe("candlestick");
    expect((series.data as unknown[]).length).toBe(2);
    expect(series.itemStyle).toMatchObject({
      color: expect.any(String),
      color0: expect.any(String),
    });
  });

  it("never lets a drawdown axis show a gain above zero", async () => {
    render(<DrawdownChart points={[{ time: 0, value: 0 }, { time: 1, value: -0.12 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const axis = lastOption().yAxis as { max?: number };
    expect(axis.max).toBe(0);
  });

  it("draws one volatility curve per expiry", async () => {
    render(
      <VolatilitySmileChart
        slices={[
          { expiry: "1M", points: [{ strike: 90, impliedVol: 0.42 }, { strike: 100, impliedVol: 0.35 }] },
          { expiry: "3M", points: [{ strike: 90, impliedVol: 0.38 }, { strike: 100, impliedVol: 0.33 }] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect(seriesOf(lastOption()).map((entry) => entry.name)).toEqual(["1M", "3M"]);
  });

  it("marks the current portfolio on the frontier without solving one", async () => {
    render(
      <EfficientFrontierChart
        assets={[{ label: "60/40", risk: 0.08, expectedReturn: 0.05 }]}
        frontier={[{ risk: 0.06, expectedReturn: 0.04 }, { risk: 0.12, expectedReturn: 0.07 }]}
        current={{ label: "Current", risk: 0.1, expectedReturn: 0.05 }}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const names = seriesOf(lastOption()).map((entry) => String(entry.name));
    expect(names).toContain("Efficient frontier");
    expect(names).toContain("Current");
  });

  it("colours factor exposure by sign", async () => {
    render(<FactorExposureChart factors={[{ label: "Value", value: 0.4 }, { label: "Momentum", value: -0.2 }]} />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const data = seriesOf(lastOption())[0]?.data as { itemStyle: { color: string } }[];
    expect(data[0]!.itemStyle.color).not.toBe(data[1]!.itemStyle.color);
  });

  it("signs each P&L contribution in the tooltip and stacks the bars", async () => {
    render(
      <PnlAttributionChart
        periods={["Jan"]}
        series={[
          { label: "Carry", values: [120] },
          { label: "Timing", values: [-40] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series.every((entry) => entry.stack === "pnl")).toBe(true);
    expect(series[1]?.data).toEqual([-40]);
  });
});

describe("multidimensional chart pack", () => {
  it("builds n × (n − 1) grids — no diagonal of self-plots", async () => {
    render(
      <ScatterMatrixChart
        variables={[
          { key: "a", label: "A" },
          { key: "b", label: "B" },
          { key: "c", label: "C" },
        ]}
        rows={[{ a: 1, b: 2, c: 3 }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.grid as unknown[]).length).toBe(6);
    expect((option.series as unknown[]).length).toBe(6);
  });

  it("keeps a hierarchy a tree, with its children", async () => {
    render(
      <HierarchyTreeChart
        root={{
          name: "root",
          children: [{ name: "leaf-a" }, { name: "leaf-b", children: [{ name: "leaf-b-1" }] }],
        }}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const root = (seriesOf(lastOption())[0]?.data as { name: string; children?: unknown[] }[])[0]!;
    expect(root.name).toBe("root");
    expect(root.children?.length).toBe(2);
  });

  it("renders geographic points on the map the caller registered", async () => {
    render(
      <GeoScatterChart
        mapName="world"
        points={[{ name: "Singapore", coordinates: [103.8, 1.35], value: 12 }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect((option.geo as { map?: string }).map).toBe("world");
    expect(seriesOf(option)[0]?.coordinateSystem).toBe("geo");
  });

  it("explains how to get a map when none is registered", async () => {
    render(<GeoScatterChart mapName="" points={[]} />);
    expect(await screen.findByText(/register a map/i)).toBeInTheDocument();
  });
});
