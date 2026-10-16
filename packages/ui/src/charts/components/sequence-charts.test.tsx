import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The event timeline's *engine option*, asserted without an engine.
 *
 * A sparse history must carry its labels on the markers — the reader should not
 * have to map a detached list of names back onto a date — while a dense history
 * stays markers-only and leaves the name to the tooltip.
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
    getHeight: () => 160,
  };
  return {
    loadECharts: async () => ({ init: () => instance, use: () => {} }),
  };
});

import { EventTimeline } from "./sequence-charts";

interface Point {
  name?: string;
  label?: { show?: boolean; formatter?: string };
}

function drawnPoints(): Point[] {
  const option = setOption.mock.calls.at(-1)?.[0] as
    | { series?: { data?: Point[] }[] }
    | undefined;
  return (option?.series ?? []).flatMap((series) => series.data ?? []);
}

const SPARSE = [
  { at: "2012-11-28", label: "Halving 2012", category: "halving" },
  { at: "2016-07-09", label: "Halving 2016", category: "halving" },
  { at: "2020-05-11", label: "Halving 2020", category: "halving" },
];

const DENSE = Array.from({ length: 60 }, (_, index) => ({
  at: `20${String(10 + Math.floor(index / 12)).padStart(2, "0")}-01-0${(index % 9) + 1}`,
  label: `Transition ${index}`,
  category: "regime",
}));

describe("EventTimeline labels", () => {
  beforeEach(() => setOption.mockClear());

  it("prints a sparse event's own label at its marker", async () => {
    render(<EventTimeline events={SPARSE} labelMode="auto" eager ariaLabel="Halvings" />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Halvings" })).toBeInTheDocument());
    const points = drawnPoints();
    expect(points).toHaveLength(3);
    for (const point of points) {
      expect(point.label?.show).toBe(true);
      expect(point.label?.formatter).toBe(point.name);
    }
  });

  it("keeps a dense history markers-only", async () => {
    render(<EventTimeline events={DENSE} labelMode="auto" eager ariaLabel="Regime transitions" />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Regime transitions" })).toBeInTheDocument());
    expect(drawnPoints().every((point) => point.label?.show !== true)).toBe(true);
  });

  it("never labels when the caller asked for markers only", async () => {
    render(<EventTimeline events={SPARSE} eager ariaLabel="Halvings" />);
    await waitFor(() => expect(screen.getByRole("img", { name: "Halvings" })).toBeInTheDocument());
    expect(drawnPoints().every((point) => point.label?.show !== true)).toBe(true);
  });
});
