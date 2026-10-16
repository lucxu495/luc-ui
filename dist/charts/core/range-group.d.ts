//#region src/charts/core/range-group.d.ts
/**
 * One synchronisation group -> one authoritative range state.
 *
 * The bug this replaces was not a missing feature, it was ownership: every
 * chart in a group kept its own idea of the selected preset and pushed it into
 * the shared bus whenever its engine happened to emit a window. A group of six
 * charts therefore had six writers, and the last writer -- a lazy mount fitting
 * itself, a chart clamped to shorter history, a resize -- decided what the
 * reader saw.
 *
 * This module is that single writer. It owns, per group:
 *
 * - the **selected preset** (the value the group's selector reads),
 * - the **window** the group is on (`null` = every member shows its whole
 *   loaded domain, which is what `max` means),
 * - the **intent**: whether that state is still the members' configured default
 *   or an actual reader choice.
 *
 * Everything else is derived. A member *declares* what it is (its configured
 * preset and its loaded domain) and *consumes* state; it cannot write state.
 * The only two writers are a reader picking a preset and a reader panning or
 * zooming a plate.
 *
 * Consequences that fall out of the ownership rule, rather than being patched
 * one at a time:
 *
 * - a member mounting, remounting, lazily loading, rebuilding after data, being
 *   resized or calling `fitContent()` **cannot** move the group: none of those
 *   is a write;
 * - a member whose history is shorter than the group's window clamps locally and
 *   stays clamped -- the group's intent is untouched;
 * - a group that is not yet claimed opens on the **widest** preset its members
 *   declare, so the opening window is a property of the group, not of which
 *   chart happened to mount first;
 * - a window a reader chose outlives the components that displayed it (a tab
 *   sees the same window again after a remount), while a group nobody claimed
 *   is simply forgotten.
 */
export interface RangeWindow {
  from: number;
  to: number;
}
/** What a member tells the group about itself. */
export interface RangeMemberDeclaration {
  /**
   * The preset this member is configured to open on. Opaque to this module: it
   * is the product's vocabulary (`2y`, `max`, ...) and is only ever compared by
   * `weight`.
   */
  preset: string | null;
  /**
   * How wide that preset is, as a number that only needs to be *ordered* (Luc
   * Web passes the preset's day count, with `max` the largest). The widest
   * declared default wins while a group is unclaimed.
   */
  weight: number;
  /**
   * The window that preset opens on, resolved by the declaring member against
   * the history it holds. `null` for a preset meaning "the whole domain".
   */
  window: RangeWindow | null;
  /** The history this member holds, in epoch ms. */
  domain: RangeWindow | null;
}
export type RangeGroupIntent = "default" | "preset" | "manual";
export interface RangeGroupState {
  /** The preset the group's selector reads; `null` = no preset claims this window. */
  preset: string | null;
  /** `null` = every member shows its whole loaded domain. */
  window: RangeWindow | null;
  intent: RangeGroupIntent;
  /**
   * Bumped on every resolved change (a reader's choice, a member's declaration
   * or its loaded domain). Consumers can tell "same state" from "re-applied",
   * and the snapshot identity is stable while the revision is.
   */
  revision: number;
  /** The union of the members' loaded domains (the anchor a preset is measured from). */
  domain: RangeWindow | null;
}
interface Member {
  preset: string | null;
  weight: number;
  window: RangeWindow | null;
  domain: RangeWindow | null;
}
/** The state a group resolves to right now, including its unclaimed default. */
export declare function rangeGroupState(group: string): RangeGroupState;
/** Declare (or refresh) a member. Can only move an unclaimed group's default. */
export declare function declareRangeMember(group: string, id: string, declaration: RangeMemberDeclaration): void;
/**
 * Refresh a member's loaded domain only.
 *
 * Data arriving, a series being replaced, a lazy section loading: the domain is
 * bookkeeping (the anchor and coverage of the group), never intent. A member
 * that grows history keeps the group exactly where the reader left it.
 */
export declare function updateRangeMemberDomain(group: string, id: string, domain: RangeWindow | null): void;
/**
 * Drop a member.
 *
 * A group nobody claimed forgets everything; a window a reader chose is kept, so
 * a remount (a tab, a view switch, a reopened session) shows it again.
 */
export declare function releaseRangeMember(group: string, id: string): void;
/**
 * A reader picked a preset on one of the group's controls.
 *
 * `window` is resolved by the caller, which owns the preset vocabulary.
 */
export declare function selectRangePreset(group: string, preset: string, window: RangeWindow | null): boolean;
/**
 * A reader panned or zoomed one of the group's plates.
 *
 * `preset` is the preset the resulting window matches, or `null` when it matches
 * none -- the honest "this is a manual window" that keeps the selector from
 * claiming a preset the reader is no longer on. A manual window is never
 * replaced by a member's declared default.
 */
export declare function selectRangeWindow(group: string, window: RangeWindow, preset: string | null): boolean;
export declare function subscribeRangeGroup(group: string, listener: () => void): () => void;
/** Test seam: forget every group (and every reader choice). */
export declare function resetRangeGroups(): void;
/** Test seam: what the store holds, including unclaimed declarations. */
export declare function rangeGroupSnapshot(group: string): {
  state: RangeGroupState;
  members: Array<{
    id: string;
  } & Member>;
};
//#endregion
export {};
//# sourceMappingURL=range-group.d.ts.map