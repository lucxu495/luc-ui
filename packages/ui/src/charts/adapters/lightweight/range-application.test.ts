import {
  resolveVisibleRangeAction,
  visibleRangeKey,
} from "./range-application";

describe("Lightweight visible range ownership", () => {
  it("fits on initial mount and honours a controlled range", () => {
    expect(resolveVisibleRangeAction(undefined, null, false)).toEqual({ kind: "fit" });
    expect(resolveVisibleRangeAction(null, null, false)).toEqual({ kind: "fit" });
    expect(
      resolveVisibleRangeAction({ fromMs: 10, toMs: 20 }, null, false),
    ).toEqual({ kind: "set", fromMs: 10, toMs: 20 });
  });

  it("never moves an uncontrolled viewport after initialisation", () => {
    expect(resolveVisibleRangeAction(undefined, "uncontrolled", true)).toEqual({
      kind: "preserve",
    });
    expect(resolveVisibleRangeAction({ fromMs: 10, toMs: 20 }, "uncontrolled", true)).toEqual({
      kind: "set",
      fromMs: 10,
      toMs: 20,
    });
  });

  it("moves only when controlled values change, including an explicit fit-all", () => {
    const range = { fromMs: 10, toMs: 20 };
    const key = visibleRangeKey(range);
    expect(resolveVisibleRangeAction({ fromMs: 10, toMs: 20 }, key, true)).toEqual({
      kind: "preserve",
    });
    expect(resolveVisibleRangeAction({ fromMs: 30, toMs: 40 }, key, true)).toEqual({
      kind: "set",
      fromMs: 30,
      toMs: 40,
    });
    expect(resolveVisibleRangeAction(null, key, true)).toEqual({ kind: "fit" });
    expect(resolveVisibleRangeAction(undefined, "all", true)).toEqual({ kind: "preserve" });
  });
});
