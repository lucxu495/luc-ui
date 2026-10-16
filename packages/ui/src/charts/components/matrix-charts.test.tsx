import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The heatmap's *engine option*, asserted without an engine.
 *
 * `HeatmapChart` hands its option to the one ECharts surface; mocking the
 * runtime lets the test read exactly what would be drawn — which is the only
 * way to prove a per-cell treatment (the current-cell highlight) actually
 * reaches the mark, rather than stopping at a prop.
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

import { HeatmapChart } from "./matrix-charts";

type Cell = { value: [number, number, number | "-"]; itemStyle?: { borderColor?: string; borderWidth?: number } };

function drawnCells(): Cell[] {
  const option = setOption.mock.calls.at(-1)?.[0] as
    | { series?: { data?: Cell[] }[] }
    | undefined;
  return option?.series?.[0]?.data ?? [];
}

describe("HeatmapChart", () => {
  beforeEach(() => setOption.mockClear());

  it("marks only the cells the caller named as current", async () => {
    render(
      <HeatmapChart
        xLabels={["Q1", "Q2", "Q3", "Q4"]}
        yLabels={["2025", "2026"]}
        values={[
          [0.1, 0.2, 0.3, 0.4],
          [0.5, -0.14, null, null],
        ]}
        palette="diverging"
        robustDomain
        labelMode="auto"
        highlight={[[1, 1], [2, 1]]}
        eager
        ariaLabel="Calendar-quarter returns"
      />,
    );
    await waitFor(() => expect(screen.getByRole("img", { name: "Calendar-quarter returns" })).toBeInTheDocument());

    const cells = drawnCells();
    expect(cells).toHaveLength(8);
    const marked = cells
      .map((cell, index) => ({ index, cell }))
      .filter((entry) => entry.cell.itemStyle?.borderWidth === 2.5);
    // The empty in-progress quarter is marked too: it is the cell the reader
    // must not mistake for a completed historical period.
    expect(marked.map((entry) => entry.cell.value.slice(0, 2))).toEqual([
      [1, 1],
      [2, 1],
    ]);
    // Every other cell keeps the plain surface border.
    for (const cell of cells) {
      if (cell.itemStyle?.borderWidth === 2.5) continue;
      expect(cell.itemStyle?.borderColor).toBeUndefined();
    }
  });

  it("leaves every cell unmarked when no current cell is named", async () => {
    render(
      <HeatmapChart
        xLabels={["Q1", "Q2"]}
        yLabels={["2026"]}
        values={[[0.1, 0.2]]}
        eager
        ariaLabel="Plain matrix"
      />,
    );
    await waitFor(() => expect(screen.getByRole("img", { name: "Plain matrix" })).toBeInTheDocument());
    expect(drawnCells().every((cell) => cell.itemStyle === undefined)).toBe(true);
  });
});
