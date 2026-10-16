import { afterEach, describe, expect, it } from "vitest";
import {
  declareRangeMember,
  rangeGroupSnapshot,
  rangeGroupState,
  releaseRangeMember,
  resetRangeGroups,
  selectRangePreset,
  selectRangeWindow,
  subscribeRangeGroup,
  updateRangeMemberDomain,
} from "./range-group";

/*
 * The sync controller's contract.
 *
 * Every case here is a *state* question, not a rendering question, because that
 * is where the old bug lived: six charts each believing they owned the range.
 * The preset vocabulary is the product's (`2y`, `max`, ...); the controller
 * only orders it by weight and stores it, so these tests use the same tokens.
 */

const DAY = 24 * 60 * 60 * 1000;
const AS_OF = Date.UTC(2026, 9, 10);

/** A member's declaration in the shape Luc Web supplies it. */
function member(options: {
  preset: string;
  weight: number;
  window: { from: number; to: number } | null;
  domain?: { from: number; to: number } | null;
}) {
  return {
    preset: options.preset,
    weight: options.weight,
    window: options.window,
    domain: options.domain ?? options.window,
  };
}

const FULL: { from: number; to: number } = { from: AS_OF - 15 * 365 * DAY, to: AS_OF };

afterEach(() => {
  resetRangeGroups();
});

describe("range group ownership", () => {
  it("opens an unclaimed group on its widest declared default, whatever mounts first", () => {
    // The live config mixes a 2-year chart with a MAX chart in one group.
    declareRangeMember("g", "narrow", member({ preset: "2y", weight: 730, window: { from: AS_OF - 730 * DAY, to: AS_OF } }));
    expect(rangeGroupState("g").preset).toBe("2y");
    declareRangeMember("g", "wide", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    const state = rangeGroupState("g");
    expect(state.preset).toBe("max");
    // `max` is the absence of an explicit window: every member shows its own
    // loaded domain.
    expect(state.window).toBeNull();
    expect(state.intent).toBe("default");

    // Reversed order reaches the same state: it is a property of the group.
    resetRangeGroups();
    declareRangeMember("g", "wide", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    declareRangeMember("g", "narrow", member({ preset: "2y", weight: 730, window: { from: AS_OF - 730 * DAY, to: AS_OF } }));
    expect(rangeGroupState("g")).toMatchObject({ preset: "max", window: null });
  });

  it("gives every member the same state object for one group", () => {
    declareRangeMember("g", "a", member({ preset: "1y", weight: 365, window: { from: AS_OF - 365 * DAY, to: AS_OF } }));
    selectRangePreset("g", "5y", { from: AS_OF - 5 * 365 * DAY, to: AS_OF });
    const forA = rangeGroupState("g");
    const forB = rangeGroupState("g");
    expect(forA).toBe(forB);
    expect(forA).toMatchObject({ preset: "5y", intent: "preset" });
  });

  it("cannot let a mounting child overwrite a reader's choice", () => {
    declareRangeMember("g", "a", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    selectRangePreset("g", "5y", { from: AS_OF - 5 * 365 * DAY, to: AS_OF });
    // A late (below-the-fold, lazily mounted) child declaring a narrow default…
    declareRangeMember("g", "late", member({ preset: "6m", weight: 182, window: { from: AS_OF - 182 * DAY, to: AS_OF } }));
    // …joins the group state instead of publishing its own.
    expect(rangeGroupState("g")).toMatchObject({
      preset: "5y",
      intent: "preset",
      window: { from: AS_OF - 5 * 365 * DAY, to: AS_OF },
    });
  });

  it("lets a child only widen the opening default while nobody has chosen", () => {
    declareRangeMember("g", "a", member({ preset: "3y", weight: 1095, window: { from: AS_OF - 1095 * DAY, to: AS_OF } }));
    // Wider: the group opens wider (the documented "max is absorbing" rule).
    declareRangeMember("g", "b", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    expect(rangeGroupState("g")).toMatchObject({ preset: "max", window: null });
    // Narrower: nothing happens — a child can never pull a group in.
    declareRangeMember("g", "c", member({ preset: "1y", weight: 365, window: { from: AS_OF - 365 * DAY, to: AS_OF } }));
    expect(rangeGroupState("g")).toMatchObject({ preset: "max", window: null });
  });

  it("does not let a member's data arriving, series changing or domain growing move the group", () => {
    declareRangeMember("g", "a", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: null }));
    selectRangePreset("g", "2y", { from: AS_OF - 730 * DAY, to: AS_OF });
    const before = rangeGroupState("g");
    // The async load lands: the member's domain appears, then grows.
    updateRangeMemberDomain("g", "a", { from: AS_OF - 300 * DAY, to: AS_OF });
    declareRangeMember(
      "g",
      "a",
      member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: { from: AS_OF - 400 * DAY, to: AS_OF } }),
    );
    const after = rangeGroupState("g");
    expect(after.preset).toBe("2y");
    expect(after.window).toEqual(before.window);
    expect(after.intent).toBe("preset");
    // The domain is still bookkeeping the group can read.
    expect(after.domain).toEqual({ from: AS_OF - 400 * DAY, to: AS_OF });
  });

  it("keeps unequal coverage a local matter: the group window is the reader's, not the shortest member's", () => {
    declareRangeMember("g", "price", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    // A member with six weeks of history joins the same group.
    declareRangeMember("g", "oi", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: { from: AS_OF - 42 * DAY, to: AS_OF } }));
    selectRangePreset("g", "10y", { from: AS_OF - 3650 * DAY, to: AS_OF });
    // The intent survives the shorter member (the engine clamps its own plate).
    expect(rangeGroupState("g")).toMatchObject({ preset: "10y", intent: "preset" });
    // …and it survives the short member publishing a fitted window: a fit is not
    // a write at all, which is exactly why the controller has no API for it.
    updateRangeMemberDomain("g", "oi", { from: AS_OF - 42 * DAY, to: AS_OF });
    expect(rangeGroupState("g")).toMatchObject({ preset: "10y", intent: "preset" });
  });

  it("takes a reader's pan/zoom as the group's window, and says when no preset matches", () => {
    declareRangeMember("g", "a", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    selectRangeWindow("g", { from: AS_OF - 400 * DAY, to: AS_OF }, "1y");
    expect(rangeGroupState("g")).toMatchObject({ preset: "1y", intent: "manual" });
    // A window that matches no preset claims no preset: no invented label.
    selectRangeWindow("g", { from: AS_OF - 20 * DAY, to: AS_OF }, null);
    expect(rangeGroupState("g")).toMatchObject({ preset: null, intent: "manual" });
    // A member declaring a default afterwards cannot replace a manual window.
    declareRangeMember("g", "b", member({ preset: "2y", weight: 730, window: { from: AS_OF - 730 * DAY, to: AS_OF } }));
    expect(rangeGroupState("g")).toMatchObject({ preset: null, intent: "manual" });
  });

  it("treats each group id as its own world, so an independent chart is genuinely independent", () => {
    declareRangeMember("a", "a1", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    declareRangeMember("b", "b1", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    selectRangePreset("a", "5y", { from: AS_OF - 5 * 365 * DAY, to: AS_OF });
    expect(rangeGroupState("a").preset).toBe("5y");
    expect(rangeGroupState("b").preset).toBe("max");
    // A chart with no configured group gets `block:<id>`, a group of one.
    declareRangeMember("block:x", "x1", member({ preset: "1y", weight: 365, window: { from: AS_OF - 365 * DAY, to: AS_OF } }));
    selectRangePreset("block:x", "2y", { from: AS_OF - 730 * DAY, to: AS_OF });
    expect(rangeGroupState("block:x").preset).toBe("2y");
    expect(rangeGroupState("a").preset).toBe("5y");
  });

  it("keeps a reader's window across a remount and forgets a group nobody claimed", () => {
    declareRangeMember("tab", "chart", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    selectRangePreset("tab", "3y", { from: AS_OF - 1095 * DAY, to: AS_OF });
    releaseRangeMember("tab", "chart");
    // Nobody is mounted, the group holds the choice…
    expect(rangeGroupState("tab")).toMatchObject({ preset: "3y", intent: "preset" });
    // …and the remounted chart joins it instead of reopening on its default.
    declareRangeMember("tab", "chart", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    expect(rangeGroupState("tab")).toMatchObject({ preset: "3y", intent: "preset" });

    // A group that was never claimed leaves nothing behind.
    declareRangeMember("fresh", "chart", member({ preset: "max", weight: Number.POSITIVE_INFINITY, window: null, domain: FULL }));
    releaseRangeMember("fresh", "chart");
    expect(rangeGroupSnapshot("fresh").state.preset).toBeNull();
    expect(rangeGroupSnapshot("fresh").members).toHaveLength(0);
  });

  it("notifies subscribers only when the resolved state changes", () => {
    declareRangeMember("g", "a", member({ preset: "2y", weight: 730, window: { from: AS_OF - 730 * DAY, to: AS_OF } }));
    selectRangePreset("g", "2y", { from: AS_OF - 730 * DAY, to: AS_OF });
    let calls = 0;
    const unsubscribe = subscribeRangeGroup("g", () => {
      calls += 1;
    });
    // Re-applying the identical preset is a no-op, not a new revision.
    selectRangePreset("g", "2y", { from: AS_OF - 730 * DAY, to: AS_OF });
    expect(calls).toBe(0);
    selectRangePreset("g", "1y", { from: AS_OF - 365 * DAY, to: AS_OF });
    expect(calls).toBe(1);
    // A member's domain refresh is a change the group can read (a new anchor),
    // so it notifies once — and it still cannot move the window.
    updateRangeMemberDomain("g", "a", { from: AS_OF - 900 * DAY, to: AS_OF });
    expect(calls).toBe(2);
    expect(rangeGroupState("g").preset).toBe("1y");
    unsubscribe();
  });
});
