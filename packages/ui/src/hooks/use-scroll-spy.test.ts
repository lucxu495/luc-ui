import { describe, expect, it } from "vitest";
import { resolveActiveTarget, type ActiveTargetState, type ScrollSpyTarget } from "./use-scroll-spy";

/** Four cards 500px apart, the first starting at 200. */
const TARGETS: ScrollSpyTarget[] = [
  { id: "a", top: 200, primary: true },
  { id: "b", top: 700, primary: true },
  { id: "c", top: 1200, primary: true },
  { id: "d", top: 1700, primary: true },
];

function state(overrides: Partial<ActiveTargetState> = {}): ActiveTargetState {
  return {
    targets: TARGETS,
    scrollY: 0,
    viewportHeight: 800,
    documentHeight: 6000,
    readingOffset: 100,
    ...overrides,
  };
}

describe("resolveActiveTarget", () => {
  it("returns null for no targets", () => {
    expect(resolveActiveTarget(state({ targets: [] }))).toBeNull();
  });

  it("is the first target before the report has started", () => {
    expect(resolveActiveTarget(state({ scrollY: 0 }))).toBe("a");
  });

  it("follows the reading line, not the largest visible area", () => {
    // The line is at 600: card b starts at 700, so the reader is still on a —
    // even though b fills most of the viewport and c/d are partly visible too.
    expect(resolveActiveTarget(state({ scrollY: 500 }))).toBe("a");
    // Line at 750: b has crossed it.
    expect(resolveActiveTarget(state({ scrollY: 650 }))).toBe("b");
    expect(resolveActiveTarget(state({ scrollY: 1150 }))).toBe("c");
  });

  it("keeps the nearest preceding target when the line falls in a gap", () => {
    const gapped: ScrollSpyTarget[] = [
      { id: "a", top: 0, primary: true },
      { id: "b", top: 900, primary: true },
    ];
    expect(resolveActiveTarget(state({ targets: gapped, scrollY: 400 }))).toBe("a");
    expect(resolveActiveTarget(state({ targets: gapped, scrollY: 850 }))).toBe("b");
  });

  it("never lets a section heading outrank the chart the reader is on", () => {
    const withSections: ScrollSpyTarget[] = [
      { id: "sec-1", top: 100, primary: false },
      { id: "chart-1", top: 180, primary: true },
      { id: "chart-2", top: 900, primary: true },
      { id: "sec-2", top: 1500, primary: false },
    ];
    // The line is inside chart-1; the heading above it must not win.
    expect(resolveActiveTarget(state({ targets: withSections, scrollY: 300 }))).toBe("chart-1");
    // Even with a heading between them, the reader stays on the chart they came
    // from until the next chart's card crosses the line.
    expect(resolveActiveTarget(state({ targets: withSections, scrollY: 1300 }))).toBe("chart-2");
  });

  it("uses a section as a target when it has no chart of its own", () => {
    const prose: ScrollSpyTarget[] = [
      { id: "chart-1", top: 100, primary: true },
      { id: "sec-prose", top: 800, primary: true },
    ];
    expect(resolveActiveTarget(state({ targets: prose, scrollY: 750 }))).toBe("sec-prose");
  });

  it("answers a row layout by position, not by the navigator's order", () => {
    // A section that lays a tall chart beside a short snapshot: the navigator
    // lists them in spec order, the page puts them in the same row.
    const row: ScrollSpyTarget[] = [
      { id: "chart", top: 100, primary: true },
      { id: "next-chart", top: 3000, primary: true },
      { id: "snapshot", top: 700, primary: true },
    ];
    expect(resolveActiveTarget(state({ targets: row, scrollY: 650 }))).toBe("snapshot");
    expect(resolveActiveTarget(state({ targets: row, scrollY: 200 }))).toBe("chart");
    // The caller's array is not mutated.
    expect(row.map((target) => target.id)).toEqual(["chart", "next-chart", "snapshot"]);
  });

  it("activates the final target at the bottom even if it never reached the line", () => {
    expect(resolveActiveTarget(state({ scrollY: 5200, documentHeight: 6000 }))).toBe("d");
  });

  it("does not force the last target on a page that cannot scroll", () => {
    expect(
      resolveActiveTarget(
        state({ scrollY: 0, documentHeight: 802, targets: [{ id: "only", top: 0, primary: true }] }),
      ),
    ).toBe("only");
  });

  it("is deterministic at a card boundary (no flicker between neighbours)", () => {
    // The line exactly on a card's top: that card owns the position, every time.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(resolveActiveTarget(state({ scrollY: 600 }))).toBe("b");
    }
  });
});
