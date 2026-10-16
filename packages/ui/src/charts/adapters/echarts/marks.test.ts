import { describe, expect, it } from "vitest";
import { annotationMarks } from "./marks";
import { defaultChartTheme } from "../../core/theme";

const DAY = 86_400_000;

describe("annotationMarks", () => {
  it("is absent when there is nothing to annotate", () => {
    expect(annotationMarks(defaultChartTheme, undefined)).toEqual({});
    expect(annotationMarks(defaultChartTheme, {})).toEqual({});
  });

  it("turns reference lines into markLines, converting dates to milliseconds", () => {
    const marks = annotationMarks(defaultChartTheme, {
      referenceLines: [{ value: 90_000, label: "Support" }],
    });
    const data = (marks.markLine as { data: Array<Record<string, unknown>> }).data;
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({ yAxis: 90_000 });

    const vertical = annotationMarks(defaultChartTheme, {
      referenceLines: [{ value: new Date(Date.UTC(2026, 0, 5)), axis: "x" }],
    });
    const verticalData = (vertical.markLine as { data: Array<Record<string, unknown>> }).data;
    expect(verticalData[0]).toMatchObject({ xAxis: Date.UTC(2026, 0, 5) });
  });

  it("turns reference bands into ordered markArea pairs", () => {
    const marks = annotationMarks(defaultChartTheme, {
      referenceBands: [{ axis: "x", from: 1_000, to: 2_000, label: "Warm", tone: "warning" }],
    });
    const data = (marks.markArea as { data: Array<Array<Record<string, unknown>>> }).data;
    expect(data).toHaveLength(1);
    expect(data[0]![0]).toMatchObject({ xAxis: 1_000 });
    expect(data[0]![1]).toMatchObject({ xAxis: 2_000 });
  });

  it("splits markers into a dotted guide line and a positioned point", () => {
    const marks = annotationMarks(
      defaultChartTheme,
      {
        markers: [
          { at: Date.UTC(2026, 0, 9), label: "Rate decision", shape: "flag", line: true },
          { at: DAY, label: "Plain dot", shape: "dot" },
        ],
      },
      250,
    );
    const lines = (marks.markLine as { data: Array<Record<string, unknown>> }).data;
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    expect(lines).toHaveLength(1);
    expect(points).toHaveLength(2);
    expect(points[0]).toMatchObject({ coord: [Date.UTC(2026, 0, 9), 250], symbol: "roundRect" });
    expect(points[1]).toMatchObject({ symbol: "circle" });
  });

  it("keeps every annotation silent and un-animated so it never fights the data", () => {
    const marks = annotationMarks(defaultChartTheme, {
      referenceLines: [{ value: 1 }],
      referenceBands: [{ from: 0, to: 1 }],
      markers: [{ at: 0, label: "x" }],
    });
    expect(marks.markLine).toMatchObject({ silent: true, animation: false });
    expect(marks.markArea).toMatchObject({ silent: true, animation: false });
    expect(marks.markPoint).toMatchObject({ animation: false });
  });

  it("centres event labels by default and leaves the align to the engine", () => {
    const marks = annotationMarks(defaultChartTheme, {
      markers: [{ at: DAY, label: "Halving", shape: "flag", line: true }],
    });
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    const label = points[0]!.label as Record<string, unknown>;
    expect(label.position).toBe("top");
    expect(label.align).toBeUndefined();
  });

  it("anchors an auto label inward at either edge of the x extent", () => {
    const extent: readonly [number, number] = [0, 100 * DAY];
    const marks = annotationMarks(
      defaultChartTheme,
      {
        markers: [
          { at: DAY, label: "1992 event", shape: "flag", labelAlign: "auto" },
          { at: 50 * DAY, label: "Middle", shape: "flag", labelAlign: "auto" },
          { at: 99 * DAY, label: "Late event", shape: "flag", labelAlign: "auto" },
        ],
      },
      1,
      extent,
    );
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    const alignOf = (index: number) => (points[index]!.label as Record<string, unknown>).align;
    // The earliest marker grows rightwards, the latest grows leftwards, and one
    // with room around it keeps the centred placement.
    expect(alignOf(0)).toBe("left");
    expect(alignOf(1)).toBeUndefined();
    expect(alignOf(2)).toBe("right");
    // No coordinate is touched: only where the text sits changes.
    expect(points.map((point) => point.coord)).toEqual([
      [DAY, 1],
      [50 * DAY, 1],
      [99 * DAY, 1],
    ]);
  });

  it("honours an explicit start/end anchor and ignores auto without an extent", () => {
    const explicit = annotationMarks(defaultChartTheme, {
      markers: [
        { at: 50 * DAY, label: "Start", shape: "flag", labelAlign: "start" },
        { at: 50 * DAY, label: "End", shape: "flag", labelAlign: "end" },
      ],
    });
    const points = (explicit.markPoint as { data: Array<Record<string, unknown>> }).data;
    expect((points[0]!.label as Record<string, unknown>).align).toBe("left");
    expect((points[1]!.label as Record<string, unknown>).align).toBe("right");

    const noExtent = annotationMarks(defaultChartTheme, {
      markers: [{ at: 1, label: "No extent", shape: "flag", labelAlign: "auto" }],
    });
    const autoPoints = (noExtent.markPoint as { data: Array<Record<string, unknown>> }).data;
    expect((autoPoints[0]!.label as Record<string, unknown>).align).toBeUndefined();
  });

  it("keeps a dot's label off and never anchors a degenerate extent", () => {
    const marks = annotationMarks(
      defaultChartTheme,
      {
        markers: [
          { at: 5, label: "Dot", shape: "dot", labelAlign: "auto" },
          { at: 5, label: "Flat", shape: "flag", labelAlign: "auto" },
        ],
      },
      0,
      [5, 5],
    );
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    expect((points[0]!.label as Record<string, unknown>).show).toBe(false);
    expect((points[1]!.label as Record<string, unknown>).align).toBeUndefined();
  });

  it("draws the event grammar as glyphs: square for a milestone, triangles for extremes", () => {
    const marks = annotationMarks(defaultChartTheme, {
      markers: [
        { at: 1, label: "Halving", shape: "square" },
        { at: 2, label: "Low", shape: "triangle-up" },
        { at: 3, label: "High", shape: "triangle-down" },
      ],
    });
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    // A square, then the same triangle rotated for the downward case: the shape
    // is the non-colour half of the meaning.
    expect(points[0]!.symbol).toBe("rect");
    expect(points[1]!.symbol).toBe("triangle");
    expect(points[1]!.symbolRotate).toBe(0);
    expect(points[2]!.symbol).toBe("triangle");
    expect(points[2]!.symbolRotate).toBe(180);
  });

  it("suppresses a permanent label when the marker carries its own detail rows", () => {
    const marks = annotationMarks(defaultChartTheme, {
      markers: [
        {
          at: 1,
          label: "BTC current-cycle high",
          shape: "triangle-down",
          detail: [
            ["Date", "2025-10-06"],
            ["Price", "$124,658.54"],
          ],
        },
      ],
    });
    const points = (marks.markPoint as { data: Array<Record<string, unknown>> }).data;
    // The plotting area stays a plot: the sentence lives in the tooltip.
    expect((points[0]!.label as Record<string, unknown>).show).toBe(false);

    // A marker without detail keeps the legacy flag label.
    const labelled = annotationMarks(defaultChartTheme, {
      markers: [{ at: 1, label: "Sparse event", shape: "flag" }],
    });
    const labelledPoints = (labelled.markPoint as { data: Array<Record<string, unknown>> }).data;
    expect((labelledPoints[0]!.label as Record<string, unknown>).show).toBe(true);
  });
});
