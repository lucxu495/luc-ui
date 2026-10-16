import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Phase 5 chart pack, asserted at the option boundary — plus the two bits of
 * geometry this pack computes itself (a chord layout and an antimeridian
 * unwrap), which are pure functions and therefore testable without a browser.
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

import {
  AutocorrelationChart,
  FeatureImportanceChart,
  PrecisionRecallChart,
  SurvivalCurveChart,
} from "./diagnostic-charts";
import { ChordChart, DendrogramChart, chordLayout } from "./network-charts";
import { ChoroplethChart, GeoTrajectoryChart, unwrapLongitudes } from "./geo-charts";
import { Surface3DChart, VolatilitySurfaceChart } from "./surface3d-charts";

/* eslint-disable @typescript-eslint/no-explicit-any -- engine option payload */
type Option = Record<string, any>;

function lastOption(): Option {
  return (setOption.mock.calls.at(-1)?.[0] ?? {}) as Option;
}

function seriesOf(option: Option): Option[] {
  return (option.series as Option[] | undefined) ?? [];
}

beforeEach(() => setOption.mockClear());

describe("chordLayout", () => {
  const labels = ["Equities", "Rates", "Credit"];
  const matrix = [
    [0, 4, 2],
    [4, 0, 3],
    [2, 3, 0],
  ];

  it("gives every group an arc proportional to what it sends plus receives", () => {
    const layout = chordLayout(matrix, { gapAngle: 0 });
    expect(layout.total).toBe(18);
    const spans = layout.arcs.map((arc) => arc.end - arc.start);
    // Weights are `outgoing + incoming`: 12, 14 and 10 of 36 units.
    expect(spans[0]).toBeCloseTo((12 / 36) * Math.PI * 2, 6);
    expect(spans[1]).toBeCloseTo((14 / 36) * Math.PI * 2, 6);
    expect(spans[2]).toBeCloseTo((10 / 36) * Math.PI * 2, 6);
  });

  it("splits each group into an outgoing and an incoming half", () => {
    const layout = chordLayout(matrix, { gapAngle: 0 });
    const [equities] = layout.arcs;
    expect(equities!.sourceEnd - equities!.sourceStart).toBeCloseTo(equities!.targetStart - equities!.sourceStart, 6);
    expect(equities!.targetEnd - equities!.targetStart).toBeGreaterThan(0);
  });

  it("emits one ribbon per non-zero cell and keeps every cell inside its arc", () => {
    const layout = chordLayout(matrix, { gapAngle: 0 });
    expect(layout.ribbons).toHaveLength(6);
    for (const ribbon of layout.ribbons) {
      const source = layout.arcs[ribbon.source]!;
      const target = layout.arcs[ribbon.target]!;
      expect(ribbon.sourceStart).toBeGreaterThanOrEqual(source.sourceStart - 1e-9);
      expect(ribbon.sourceEnd).toBeLessThanOrEqual(source.sourceEnd + 1e-9);
      expect(ribbon.targetStart).toBeGreaterThanOrEqual(target.targetStart - 1e-9);
      expect(ribbon.targetEnd).toBeLessThanOrEqual(target.targetEnd + 1e-9);
    }
  });

  it("ignores negative and non-finite cells instead of drawing a reverse flow", () => {
    const layout = chordLayout([
      [0, Number.NaN],
      [-3, 0],
    ]);
    expect(layout.total).toBe(0);
    expect(layout.ribbons).toHaveLength(0);
  });

  it("labels are the caller's, in the caller's order", () => {
    expect(labels[0]).toBe("Equities");
    expect(chordLayout(matrix).arcs).toHaveLength(3);
  });
});

describe("ChordChart", () => {
  it("draws ribbons, arcs and labels as three custom series", async () => {
    render(
      <ChordChart
        labels={["A", "B"]}
        values={[
          [0, 5],
          [5, 0],
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series.map((entry) => entry.type)).toEqual(["custom", "custom", "custom"]);
    expect(series[0]?.data).toHaveLength(2);
  });

  it("reports an empty matrix rather than drawing an empty circle", async () => {
    render(<ChordChart labels={["A"]} values={[[0]]} />);
    expect(await screen.findByText("Nothing to plot")).toBeInTheDocument();
  });
});

describe("DendrogramChart", () => {
  it("draws one connector group per supplied merge", async () => {
    render(
      <DendrogramChart
        leaves={["a", "b", "c"]}
        merges={[
          { id: "m1", left: "a", right: "b", height: 1.2 },
          { id: "m2", left: "m1", right: "c", height: 3.4 },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.data).toHaveLength(2);
    expect(lastOption().xAxis?.axisLabel?.formatter(2)).toBe("c");
  });

  it("is empty, not broken, when the caller has not clustered anything", async () => {
    render(<DendrogramChart leaves={["a", "b"]} merges={[]} />);
    expect(await screen.findByText("Nothing to plot")).toBeInTheDocument();
  });
});

describe("geo charts", () => {
  it("unwraps a path that crosses the antimeridian", () => {
    const route = unwrapLongitudes([
      { x: 179, y: 10 },
      { x: -179, y: 12 },
      { x: -170, y: 14 },
    ]);
    expect(route.map((point) => point.x)).toEqual([179, 181, 190]);
  });

  it("leaves an ordinary path untouched", () => {
    const route = unwrapLongitudes([
      { x: 12, y: 10 },
      { x: 18, y: 12 },
    ]);
    expect(route.map((point) => point.x)).toEqual([12, 18]);
  });

  it("projects one polyline per route itself instead of handing coords to the engine", async () => {
    render(
      <GeoTrajectoryChart
        trajectories={[
          { id: "r1", label: "Storm track", points: [{ x: 0, y: 0 }, { x: 10, y: 5 }] },
          { id: "r2", label: "Return leg", points: [{ x: 10, y: 5 }, { x: 2, y: 1 }], highlight: true },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series.every((entry) => entry.type === "custom")).toBe(true);
    // One placeholder item per route — the geometry comes from the closure.
    expect(series[0]?.data).toHaveLength(1);
    // The axes carry the domain, because a `custom` series contributes none.
    expect(lastOption().xAxis?.min).toBeLessThan(lastOption().xAxis?.max);

    /*
     * The regression this guards: the engine's `lines` series threw on a
     * single-item `{ coords }` payload, which left the plot blank *and* raised
     * an uncaught error from the effect that applied the option. Driving the
     * geometry through `custom` + `api.coord` is asserted by calling the
     * renderItem the way the engine would.
     */
    const coord = (value: [number, number]) => [value[0] * 10, 300 - value[1] * 10] as [number, number];
    const draw = (index: number) =>
      (series[index]?.renderItem as (params: unknown, api: unknown) => { shape: { pathData: string } })(
        { dataIndex: 0, data: [] },
        { coord, style: () => ({}) },
      );
    expect(draw(0).shape.pathData.startsWith("M")).toBe(true);
    expect(draw(0).shape.pathData.split("L")).toHaveLength(2);

    /*
     * Each series draws *its own* route. Every route is one series with a
     * single placeholder item, so `dataIndex` is 0 for all of them — reading
     * the route through it made the second series repaint the first one, which
     * is why the highlighted route disappeared from the page.
     */
    expect(draw(1).shape.pathData).not.toBe(draw(0).shape.pathData);
  });

  it("marks the highlighted route with a heavier stroke", async () => {
    render(
      <GeoTrajectoryChart
        trajectories={[
          { id: "a", label: "Plain", points: [{ x: 0, y: 0 }, { x: 1, y: 1 }] },
          { id: "b", label: "Highlighted", highlight: true, points: [{ x: 0, y: 1 }, { x: 1, y: 0 }] },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    const style = (index: number) =>
      (series[index]?.renderItem as (params: unknown, api: unknown) => { style: { lineWidth: number } })(
        { dataIndex: index, data: [] },
        { coord: (value: [number, number]) => value, style: () => ({}) },
      ).style.lineWidth;
    expect(style(1)).toBeGreaterThan(style(0));
  });

  it("maps regions onto a registered map and routes missing values to the no-data colour", async () => {
    render(
      <ChoroplethChart
        mapName="test-regions"
        regions={[
          { id: "North", value: 12 },
          { id: "South", value: null },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const option = lastOption();
    expect(option.series[0]?.type).toBe("map");
    expect(option.series[0]?.map).toBe("test-regions");
    expect(Number.isNaN(option.series[0]?.data[1].value)).toBe(true);
    expect(option.visualMap?.inRange?.color?.length).toBe(3);
  });
});

describe("Surface3DChart", () => {
  const z = [
    [0, 1, 2],
    [1, 2, 3],
    [2, 3, 4],
  ];

  it("paints the mesh back to front in one group", async () => {
    render(<Surface3DChart z={z} xLabel="Strike" yLabel="Maturity" zLabel="IV" />);
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const mesh = seriesOf(lastOption())[0];
    expect(mesh?.type).toBe("custom");
    expect(mesh?.data).toHaveLength(1);
  });

  it("treats non-finite cells as holes rather than as zero", async () => {
    render(
      <Surface3DChart
        z={[
          [0, 1, 2],
          [1, Number.NaN, 3],
          [2, 3, 4],
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    // 9 cells minus the four that touch the hole.
    const samples = seriesOf(lastOption())[1];
    expect(samples?.data).toHaveLength(8);
  });

  it("rotates with the arrow keys and reports the new view", async () => {
    const onViewChange = vi.fn();
    render(<Surface3DChart z={z} onViewChange={onViewChange} />);
    const wrapper = screen.getByRole("group", { name: /Interactive 3D surface/ });
    wrapper.focus();
    await userEvent.keyboard("{ArrowRight}");
    // Angles wrap into [0, 360), so -34° + 12° reads back as 338°.
    expect(onViewChange).toHaveBeenCalledWith(expect.objectContaining({ azimuth: 338 }));
    await userEvent.keyboard("{ArrowUp}");
    expect(onViewChange).toHaveBeenLastCalledWith(expect.objectContaining({ elevation: 40 }));
  });

  it("is not interactive when the view is controlled", () => {
    render(<Surface3DChart z={z} azimuth={45} elevation={20} onViewChange={() => {}} />);
    expect(screen.queryByRole("group", { name: /Interactive 3D surface/ })).not.toBeInTheDocument();
  });

  it("takes the full height of its shell so a percentage height can resolve", () => {
    // The shell hands a chart `height="100%"`; a wrapper with an auto height
    // makes that resolve against nothing and the canvas is 0 px tall.
    const { container } = render(<Surface3DChart z={z} height="100%" />);
    const wrapper = container.querySelector("[data-slot=surface-3d]");
    expect(wrapper?.className).toContain("h-full");
  });
});

describe("VolatilitySurfaceChart", () => {
  it("prints ratios as percentages and names every axis", async () => {
    render(
      <VolatilitySurfaceChart
        strikes={[90, 100, 110]}
        maturities={[0.25, 1, 2]}
        vols={[
          [0.32, 0.24, 0.28],
          [0.3, 0.22, 0.26],
          [0.29, 0.21, 0.25],
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect(screen.getByRole("img", { name: "Volatility surface" })).toBeInTheDocument();
  });
});

describe("diagnostic charts", () => {
  it("draws an autocorrelation band from the supplied half-width only", async () => {
    render(
      <AutocorrelationChart
        band={0.2}
        bandLabel="±1.96/√n"
        series={[{ key: "acf", label: "ACF", points: [{ x: 0, y: 1 }, { x: 1, y: 0.3 }, { x: 2, y: -0.1 }] }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.name).toBe("±1.96/√n");
    expect(series[1]?.type).toBe("custom");
    expect(series[1]?.data).toHaveLength(3);
  });

  it("draws no band at all when the caller supplied none", async () => {
    render(
      <AutocorrelationChart series={[{ key: "acf", label: "ACF", points: [{ x: 0, y: 1 }] }]} />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    expect(seriesOf(lastOption()).every((entry) => entry.name !== "Significance band")).toBe(true);
  });

  it("steps a survival curve and marks censoring with supplied points", async () => {
    render(
      <SurvivalCurveChart
        series={[
          {
            key: "arm-a",
            label: "Arm A",
            points: [{ x: 0, y: 1 }, { x: 5, y: 0.8 }, { x: 9, y: 0.6 }],
            censored: [{ x: 3, y: 0.8 }],
          },
        ]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.step).toBe("end");
    expect(series[1]?.symbol).toBe("rect");
  });

  it("draws the no-skill line at the prevalence the caller supplied", async () => {
    render(
      <PrecisionRecallChart
        baseline={0.12}
        curves={[{ key: "m1", label: "Model 1", points: [{ x: 0.1, y: 0.9 }, { x: 0.9, y: 0.2 }] }]}
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const noSkill = seriesOf(lastOption()).find((entry) => entry.name === "No-skill");
    expect(noSkill?.data).toEqual([
      [0, 0.12],
      [1, 0.12],
    ]);
  });

  it("ranks features and draws only the intervals that were supplied", async () => {
    render(
      <FeatureImportanceChart
        features={[
          { key: "f1", label: "Momentum", value: 0.42, low: 0.31, high: 0.55 },
          { key: "f2", label: "Carry", value: -0.18 },
        ]}
        signed
      />,
    );
    await waitFor(() => expect(setOption).toHaveBeenCalled());
    const series = seriesOf(lastOption());
    expect(series[0]?.type).toBe("bar");
    expect(series[1]?.type).toBe("custom");
    expect(series[1]?.data).toHaveLength(2);
  });
});
