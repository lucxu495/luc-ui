import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Phase 10A.1 defects, as invariants.
 *
 * Every check in this file failed before the fix it guards, and each one is
 * *semantic*: it asserts the geometry or the dimension mapping a reader depends on,
 * not that a canvas exists. The harness is the family convention — mock the ECharts
 * runtime so the option can be read directly — because "the chart drew something"
 * is precisely the claim that five hundred screenshots were unable to justify.
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
    getWidth: () => 860,
    getHeight: () => 320,
  };
  return { loadECharts: async () => ({ init: () => instance, use: () => {} }) };
});

import { CalendarHeatmap } from "./matrix-charts";
import { ScatterMatrixChart, HierarchyTreeChart } from "./multidimensional-charts";
import { ChordChart } from "./network-charts";
import { SunburstChart } from "./composition-charts";
import { BulletChart, GanttChart } from "./workflow-charts";
import { HistoricalPositionChart } from "./position-charts";
import { Surface3DChart } from "./surface3d-charts";
import { VectorFieldChart } from "./scientific-charts";

type Option = Record<string, unknown>;

function option(): Option {
  return (setOption.mock.calls.at(-1)?.[0] ?? {}) as Option;
}

/**
 * Render, then wait for the engine to receive the option.
 *
 * The surface loads the engine asynchronously, so an assertion made in the same
 * tick as `render` reads an empty `setOption` — which is how the first draft of this
 * file "failed" twelve times for the wrong reason.
 */
async function renderChart(node: React.ReactElement): Promise<void> {
  render(node);
  await waitFor(() => expect(setOption).toHaveBeenCalled());
}

const DAY = 86_400_000;
const START = 1_791_158_400_000;

describe("GanttChart", () => {
  beforeEach(() => setOption.mockClear());

  const tasks = [
    { id: "t1", name: "Scope", start: START, end: START + 4 * DAY, progress: 1 },
    { id: "t2", name: "Build", start: START + 4 * DAY, end: START + 14 * DAY, progress: 0.7 },
  ];

  it("binds the time axis to the task timestamps, not to the row index", async () => {
    await renderChart(<GanttChart tasks={tasks} height={300} eager ariaLabel="Schedule" />);
    const series = (option().series as Array<Record<string, unknown>>)[0]!;
    /*
     * Without this mapping ECharts derives the axis from dimension 0 — the row
     * index, 0…3 ms — and the plot labels four ticks around 1970-01-01 while every
     * bar is clipped away. That was the reported defect, exactly.
     */
    expect(series.encode).toEqual({ x: [1, 2], y: 0 });
    expect((option().xAxis as Record<string, unknown>).type).toBe("time");
  });

  it("gives the bars a non-zero width in data space", async () => {
    await renderChart(<GanttChart tasks={tasks} height={300} eager ariaLabel="Schedule" />);
    const data = (option().series as Array<{ data: [number, number, number][] }>)[0]!.data;
    expect(data).toHaveLength(2);
    for (const [, start, end] of data) expect(end).toBeGreaterThan(start);
  });
});

describe("ScatterMatrixChart", () => {
  beforeEach(() => setOption.mockClear());

  const variables = [
    { key: "a", label: "A" },
    { key: "b", label: "B" },
    { key: "c", label: "C" },
  ];
  const rows = [
    { a: 1, b: 2, c: 3 },
    { a: 4, b: 5, c: 6 },
  ];

  it("gives every off-diagonal pair a full cell of the canvas", async () => {
    await renderChart(<ScatterMatrixChart variables={variables} rows={rows} eager ariaLabel="Pairs" />);
    const grids = option().grid as Array<Record<string, string>>;
    expect(grids).toHaveLength(variables.length * (variables.length - 1));
    /*
     * The defect: the cell width was `cellSize / 100` percent — 1.2% with the
     * default 120 — so twelve postage stamps floated in a full-width canvas.
     */
    /* The same expression the component uses, because the percentage is formatted
       to four decimals to keep the option stable between renders. */
    const share = (100 / variables.length).toFixed(4);
    for (const grid of grids) expect(grid.width).toBe(`${share}%`);
    expect(new Set(grids.map((grid) => grid.left)).size).toBe(variables.length);
  });

  it("plots each variable against exactly the variable its cell names", async () => {
    await renderChart(<ScatterMatrixChart variables={variables} rows={rows} eager ariaLabel="Pairs" />);
    const series = option().series as Array<{
      name: string;
      xAxisIndex: number;
      yAxisIndex: number;
      data: Array<{ value: [number, number] }>;
    }>;
    const grid = option().grid as Array<Record<string, string>>;
    const share = Number.parseFloat(`${100 / variables.length}`);
    series.forEach((entry, index) => {
      /* The series and its grid share an index, and the grid's position encodes
         which pair it is: column position is the x variable, row position is y. */
      /*
       * The series name reads "row variable × column variable" — y first, the
       * convention a scatter plot's "y vs x" caption uses — so the test reads it the
       * same way rather than assuming the opposite order.
       */
      const [yLabel = "", xLabel = ""] = entry.name.split(" × ");
      const cell = grid[index]!;
      const column = Math.round(Number.parseFloat(cell.left ?? "0") / share);
      const row = Math.round(Number.parseFloat(cell.top ?? "0") / share);
      expect(variables[column]!.label).toBe(xLabel);
      expect(variables[row]!.label).toBe(yLabel);
      expect(entry.xAxisIndex).toBe(index);
      expect(entry.yAxisIndex).toBe(index);
      /* The first observation, read through the pair the cell names — not through
         the order the rows happen to be declared in. */
      const first = rows[0]! as Record<string, number>;
      expect(entry.data[0]!.value).toEqual([first[variables[column]!.key], first[variables[row]!.key]]);
    });
  });
});

describe("ChordChart", () => {
  beforeEach(() => setOption.mockClear());

  const values = [
    [0, 18, 4],
    [10, 0, 6],
    [2, 3, 0],
  ];

  it("draws each ribbon and each ring band as one closed outline", async () => {
    await renderChart(
      <ChordChart labels={["A", "B", "C"]} values={values} height={360} eager ariaLabel="Flows" />,
    );
    const series = option().series as Array<{
      name: string;
      data: unknown[];
      renderItem: (params: { dataIndex: number }, api: unknown) => unknown;
    }>;
    const api = {
      getWidth: () => 860,
      getHeight: () => 360,
      style: () => ({}),
      value: () => 0,
      coord: () => [0, 0],
    };
    for (const entry of series) {
      entry.data.forEach((_item, index) => {
        const node = entry.renderItem({ dataIndex: index }, api) as
          | { shape?: { pathData?: string }; children?: unknown[] }
          | undefined;
        const paths: string[] = [];
        if (node?.shape?.pathData) paths.push(node.shape.pathData);
        for (const child of (node?.children ?? []) as Array<{ shape?: { pathData?: string } }>) {
          if (child.shape?.pathData) paths.push(child.shape.pathData);
        }
        for (const path of paths) {
          /*
           * One `M` per shape. The defect was a second `M` in the middle of the
           * ribbon and band paths, which turned every fill into two disconnected
           * crescents — the "suspiciously shaped ribbons" in the report.
           */
          expect(path.split("M")).toHaveLength(2);
          expect(path.trim().endsWith("Z")).toBe(true);
        }
      });
    }
  });
});

describe("VectorFieldChart", () => {
  beforeEach(() => setOption.mockClear());

  it("covers the arrow tips in the axis domain, not only the sample points", async () => {
    await renderChart(
      <VectorFieldChart
        vectors={[
          { x: -1, y: -1, u: -0.6, v: -0.4 },
          { x: 1, y: 1, u: 0.6, v: 0.4 },
        ]}
        eager
        ariaLabel="Field"
      />,
    );
    const xAxis = option().xAxis as { min: number; max: number };
    const yAxis = option().yAxis as { min: number; max: number };
    expect(xAxis.min).toBeLessThanOrEqual(-1.6);
    expect(xAxis.max).toBeGreaterThanOrEqual(1.6);
    expect(yAxis.min).toBeLessThanOrEqual(-1.4);
    expect(yAxis.max).toBeGreaterThanOrEqual(1.4);
  });
});

describe("HierarchyTreeChart", () => {
  beforeEach(() => setOption.mockClear());

  it("points labels away from the canvas edge and reserves room for them", async () => {
    await renderChart(
      <HierarchyTreeChart
        root={{ name: "Portfolio", children: [{ name: "Equity" }, { name: "Credit" }] }}
        orientation="left-right"
        eager
        ariaLabel="Tree"
      />,
    );
    const series = (option().series as Array<Record<string, unknown>>)[0]!;
    /*
     * The label config lives on each node, and the default was `left` whatever the
     * orientation — so the root's label was drawn outside the canvas ("ortfolio" in
     * the report) and the leaves ran off the right edge.
     */
    const root = (series.data as Array<{ label: Record<string, unknown> }>)[0]!;
    expect(root.label.position).toBe("right");
    expect(root.label.overflow).toBe("truncate");
    expect(Number(series.left)).toBeGreaterThanOrEqual(24);
    expect(Number(series.right)).toBeGreaterThanOrEqual(100);
  });

  it("moves the reserved margin to the side the labels grow towards", async () => {
    await renderChart(
      <HierarchyTreeChart
        root={{ name: "Portfolio", children: [{ name: "Equity" }] }}
        orientation="right-left"
        eager
        ariaLabel="Tree"
      />,
    );
    const series = (option().series as Array<Record<string, unknown>>)[0]!;
    const root = (series.data as Array<{ label: Record<string, unknown> }>)[0]!;
    expect(root.label.position).toBe("left");
    expect(Number(series.left)).toBeGreaterThanOrEqual(100);
  });
});

describe("SunburstChart", () => {
  beforeEach(() => setOption.mockClear());

  it("suppresses a label only where its sector cannot hold one", async () => {
    await renderChart(
      <SunburstChart
        data={[{ name: "A", value: 10 }, { name: "B", value: 90 }]}
        height={340}
        ariaLabel="Rings"
      />,
    );
    const series = (option().series as Array<Record<string, unknown>>)[0]!;
    const levels = series.levels as Array<{ label?: Record<string, unknown> }>;
    /* The inner ring used to draw horizontal labels that ran across their
       neighbours; 26° is the angle a two-word label needs at this radius. */
    expect(Number(levels[1]!.label!.minAngle)).toBeGreaterThanOrEqual(20);
    expect((series.labelLayout as Record<string, unknown>).hideOverlap).toBe(true);
  });
});

describe("BulletChart", () => {
  beforeEach(() => setOption.mockClear());

  it("starts at zero, leaves room for the value label, and prints the reading", async () => {
    await renderChart(
      <BulletChart
        rows={[{ label: "Coverage", value: 62, target: 75, ranges: [50, 80, 100] }]}
        height={160}
        eager
        ariaLabel="Bullets"
      />,
    );
    const xAxis = option().xAxis as { min: number; max: number };
    expect(xAxis.min).toBe(0);
    expect(xAxis.max).toBeGreaterThan(100);
    const series = option().series as Array<{
      name: string;
      label?: { show?: boolean; position?: string };
      symbolSize?: number[];
    }>;
    const valueSeries = series.find((entry) => entry.name === "Actual")!;
    expect(valueSeries.label?.show).toBe(true);
    expect(valueSeries.label?.position).toBe("right");
    const target = series.find((entry) => entry.name === "Target")!;
    expect(target.symbolSize).toEqual([3, 18]);
  });
});

describe("CalendarHeatmap", () => {
  beforeEach(() => setOption.mockClear());

  it("keeps the legend out of the month-label band and leaves empty days blank", async () => {
    await renderChart(
      <CalendarHeatmap
        year={2026}
        data={[
          ["2026-01-06", 12],
          ["2026-06-09", 41],
        ]}
        format={{ kind: "number", suffix: " bps" }}
        height={300}
        eager
        ariaLabel="Daily"
      />,
    );
    const visualMap = option().visualMap as Record<string, unknown>;
    expect(visualMap.top).toBeUndefined();
    expect(Number(visualMap.bottom)).toBeLessThanOrEqual(4);
    expect(Array.isArray(visualMap.text)).toBe(true);
    const calendar = option().calendar as { itemStyle: Record<string, unknown> };
    /* A 2px border on all 365 cells drew a grid that buried the ten days that
       carry a value. */
    expect(calendar.itemStyle.borderWidth).toBe(0);
  });
});

describe("Surface3DChart", () => {
  beforeEach(() => setOption.mockClear());

  it("draws a frame — grid, ticks, z scale — around the projected sheet", async () => {
    await renderChart(
      <Surface3DChart
        z={[
          [0.2, 0.18, 0.19],
          [0.16, 0.15, 0.17],
          [0.17, 0.16, 0.18],
        ]}
        xLabels={[90, 95, 100]}
        yLabels={[0.5, 1, 2]}
        xLabel="Strike"
        yLabel="Maturity"
        zLabel="Implied volatility"
        height={380}
        eager
        ariaLabel="Surface"
      />,
    );
    const series = option().series as Array<{
      renderItem: (params: { dataIndex: number }, api: unknown) => unknown;
    }>;
    const api = {
      getWidth: () => 860,
      getHeight: () => 380,
      style: () => ({}),
      value: (index: number) => [0, 0, 0.2][index] ?? 0,
    };
    const node = series[0]!.renderItem({ dataIndex: 0 }, api) as {
      children: Array<{
        type: string;
        style?: { text?: string; fill?: string; opacity?: number };
        shape?: { points?: unknown[] };
      }>;
    };
    const texts = node.children.filter((child) => child.type === "text");
    const polys = node.children.filter((child) => child.type === "polygon");
    /*
     * Before the fix the group was a base plane and twelve quads: no axis labels
     * and no shading overlay, which is why the chart read as "a flat tilted grid"
     * rather than as a surface. The frame is now axis labels plus the z scale, and
     * shading adds a neutral overlay per quad.
     */
    expect(texts.length).toBeGreaterThanOrEqual(6);
    expect(texts.map((text) => text.style?.text)).toContain("Implied volatility");
    /* One base plane, then two polygons per cell: the fill and its shading. A 3×3
       grid is four cells, so nine polygons — and the count is data-derived rather
       than a magic number in the test. */
    expect(polys.length).toBe(1 + 2 * 4);
  });
});

describe("HistoricalPositionChart", () => {
  it("clamps the readout inside the band instead of over the end tick", () => {
    const { container, unmount } = render(
      <HistoricalPositionChart percentile={95} value="+4.1 %" percentileLabel="95th percentile" />,
    );
    const label = container.querySelector('[class*="bottom-"]') as HTMLElement;
    /* At 95% a centred block would hang past the right edge; the treatment aligns
       it to that edge instead. */
    expect(label.style.right).toBe("0px");
    expect(label.style.left).toBe("");
    unmount();

    const { container: middle } = render(
      <HistoricalPositionChart percentile={50} value="+1.0 %" percentileLabel="50th percentile" />,
    );
    const centred = middle.querySelector('[class*="bottom-"]') as HTMLElement;
    expect(centred.style.left).toBe("50%");
    expect(centred.style.transform).toContain("translateX(-50%)");
  });
});
