/*
 * The Chart Studio's contract.
 *
 * The pure half of the Studio is where a reader's data is accepted or refused,
 * so these are the assertions that matter: a bad cell is an error with a
 * location, a unit is carried through untouched, fixtures are deterministic, and
 * the snippet describes the state it was generated from.
 */

import { describe, expect, it } from "vitest";
import {
  FIXTURES,
  chartSnippet,
  distributionGroups,
  parseDataset,
  timeseriesRows,
} from "@/lib/studios/dataset";

describe("studio dataset parsing", () => {
  it("accepts a CSV time series and keeps the values as given", () => {
    const result = parseDataset("time,value\n2024-01,1.5\n2024-02,2.5\n", "timeseries", "percent");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.dataset.kind).toBe("timeseries");
    expect(result.dataset.unit).toBe("percent");
    if (result.dataset.kind !== "timeseries") return;
    expect(result.dataset.points).toEqual([
      { time: "2024-01", value: 1.5 },
      { time: "2024-02", value: 2.5 },
    ]);
  });

  it("accepts a JSON density outline", () => {
    const result = parseDataset(
      JSON.stringify([
        { value: -1, density: 0.2 },
        { value: 0, density: 0.8 },
      ]),
      "distribution",
      "ratio",
    );
    expect(result.ok).toBe(true);
    if (!result.ok || result.dataset.kind !== "distribution") return;
    expect(result.dataset.bins).toHaveLength(2);
  });

  it("refuses a non-finite value instead of drawing a hole", () => {
    for (const bad of ["NaN", "Infinity", ""]) {
      const result = parseDataset(`time,value\n2024-01,${bad}\n`, "timeseries", "number");
      expect(result.ok, `${bad || "empty"} was accepted`).toBe(false);
      if (!result.ok) expect(result.error).toContain("row 2");
    }
  });

  it("refuses a missing column rather than guessing one", () => {
    const result = parseDataset("date,close\n2024-01,1\n", "timeseries", "number");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("time");
  });

  it("refuses an empty paste and a header-only CSV", () => {
    expect(parseDataset("   ", "timeseries", "number").ok).toBe(false);
    expect(parseDataset("time,value\n", "timeseries", "number").ok).toBe(false);
  });

  it("is deterministic: the same paste parses to the same dataset twice", () => {
    const input = "time,value\n2024-01,3\n2024-02,4\n";
    const first = parseDataset(input, "timeseries", "number");
    const second = parseDataset(input, "timeseries", "number");
    expect(first).toEqual(second);
  });
});

describe("studio chart output", () => {
  it("produces chart rows from the fixture without invention", () => {
    const rows = timeseriesRows(FIXTURES.timeseries as never);
    expect(rows).toHaveLength(12);
    expect(rows[0]).toEqual({ time: "2024-01", value: 41.2 });
  });

  it("wraps a density outline into one group with its marker", () => {
    const groups = distributionGroups(FIXTURES.distribution as never);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.marker?.value).toBe(0.0021);
    expect(groups[0]?.bins.length).toBeGreaterThan(5);
  });

  it("writes a snippet whose unit is the declared one, never a conversion", () => {
    const snippet = chartSnippet(
      { ...FIXTURES.timeseries, unit: "bps" },
      { height: 320, lineWidth: 2, smooth: false },
      "LineChart",
    );
    expect(snippet).toContain('{ kind: "bps" }');
    expect(snippet).toContain(`import { LineChart } from "@luc/ui/charts";`);
    expect(snippet).toContain("height={320}");
  });

  it("names the distribution component for a density dataset", () => {
    const snippet = chartSnippet(
      FIXTURES.distribution,
      { height: 260, lineWidth: 2, smooth: false },
      "ViolinChart",
    );
    expect(snippet).toContain("<ViolinChart");
    expect(snippet).toContain("valueFormat=");
    expect(snippet).toContain("bins: [");
  });
});
