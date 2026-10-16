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

interface Group {
  members: Map<string, Member>;
  preset: string | null;
  window: RangeWindow | null;
  intent: RangeGroupIntent;
  revision: number;
}

const groups = new Map<string, Group>();
const listeners = new Map<string, Set<() => void>>();
const stateCache = new Map<string, { revision: number; state: RangeGroupState }>();

const EMPTY_STATE: RangeGroupState = {
  preset: null,
  window: null,
  intent: "default",
  revision: 0,
  domain: null,
};

function sameWindow(left: RangeWindow | null, right: RangeWindow | null): boolean {
  if (left === null || right === null) return left === right;
  return left.from === right.from && left.to === right.to;
}

function readGroup(group: string): Group {
  let entry = groups.get(group);
  if (!entry) {
    entry = { members: new Map(), preset: null, window: null, intent: "default", revision: 0 };
    groups.set(group, entry);
  }
  return entry;
}

function unionDomain(entry: Group): RangeWindow | null {
  let start = Number.POSITIVE_INFINITY;
  let end = Number.NEGATIVE_INFINITY;
  let seen = false;
  for (const member of entry.members.values()) {
    if (!member.domain) continue;
    start = Math.min(start, member.domain.from);
    end = Math.max(end, member.domain.to);
    seen = true;
  }
  return seen && Number.isFinite(start) && Number.isFinite(end) ? { from: start, to: end } : null;
}

/**
 * The member whose declared default the group opens on.
 *
 * Widest first (a group is as wide as its widest declared member: `max` is
 * absorbing), then the newest window, then the earliest start, then the member
 * id -- a total order, so the result cannot depend on mount order.
 */
function declaredMember(entry: Group): Member | null {
  let best: { id: string; member: Member } | null = null;
  for (const [id, member] of entry.members) {
    if (member.preset === null) continue;
    if (!best) {
      best = { id, member };
      continue;
    }
    const incumbent = best.member;
    if (member.weight !== incumbent.weight) {
      if (member.weight > incumbent.weight) best = { id, member };
      continue;
    }
    const memberTo = member.window?.to ?? Number.NEGATIVE_INFINITY;
    const incumbentTo = incumbent.window?.to ?? Number.NEGATIVE_INFINITY;
    if (memberTo !== incumbentTo) {
      if (memberTo > incumbentTo) best = { id, member };
      continue;
    }
    const memberFrom = member.window?.from ?? Number.POSITIVE_INFINITY;
    const incumbentFrom = incumbent.window?.from ?? Number.POSITIVE_INFINITY;
    if (memberFrom !== incumbentFrom) {
      if (memberFrom < incumbentFrom) best = { id, member };
      continue;
    }
    if (id < best.id) best = { id, member };
  }
  return best?.member ?? null;
}

/** The state a group resolves to right now, including its unclaimed default. */
export function rangeGroupState(group: string): RangeGroupState {
  const entry = groups.get(group);
  if (!entry) return EMPTY_STATE;
  const cached = stateCache.get(group);
  if (cached && cached.revision === entry.revision) return cached.state;
  const domain = unionDomain(entry);
  const state: RangeGroupState = (() => {
    if (entry.intent !== "default") {
      return { preset: entry.preset, window: entry.window, intent: entry.intent, revision: entry.revision, domain };
    }
    const declared = declaredMember(entry);
    if (!declared) {
      return { preset: null, window: null, intent: "default", revision: entry.revision, domain };
    }
    return {
      preset: declared.preset,
      window: declared.window,
      intent: "default",
      revision: entry.revision,
      domain,
    };
  })();
  /*
   * The snapshot is cached per revision: `useSyncExternalStore` compares by
   * identity, so returning a fresh object on every read would re-render forever.
   */
  stateCache.set(group, { revision: entry.revision, state });
  return state;
}

function notify(group: string): void {
  const groupListeners = listeners.get(group);
  if (!groupListeners) return;
  for (const listener of [...groupListeners]) listener();
}

/** Apply a resolved state to the store, reporting whether anything changed. */
function commit(
  group: string,
  next: { preset: string | null; window: RangeWindow | null; intent: RangeGroupIntent },
): boolean {
  const entry = groups.get(group);
  if (!entry) return false;
  if (entry.intent === next.intent && entry.preset === next.preset && sameWindow(entry.window, next.window)) {
    return false;
  }
  entry.preset = next.preset;
  entry.window = next.window;
  entry.intent = next.intent;
  entry.revision += 1;
  notify(group);
  return true;
}

/** Declare (or refresh) a member. Can only move an unclaimed group's default. */
export function declareRangeMember(group: string, id: string, declaration: RangeMemberDeclaration): void {
  const entry = readGroup(group);
  const before = entry.intent === "default" ? declaredMember(entry) : null;
  entry.members.set(id, {
    preset: declaration.preset,
    weight: declaration.weight,
    window: declaration.window,
    domain: declaration.domain,
  });
  const after = entry.intent === "default" ? declaredMember(entry) : null;
  const changed =
    before?.preset !== after?.preset || !sameWindow(before?.window ?? null, after?.window ?? null);
  if (changed) {
    entry.revision += 1;
    notify(group);
  }
}

/**
 * Refresh a member's loaded domain only.
 *
 * Data arriving, a series being replaced, a lazy section loading: the domain is
 * bookkeeping (the anchor and coverage of the group), never intent. A member
 * that grows history keeps the group exactly where the reader left it.
 */
export function updateRangeMemberDomain(group: string, id: string, domain: RangeWindow | null): void {
  const entry = groups.get(group);
  const member = entry?.members.get(id);
  if (!entry || !member) return;
  if (sameWindow(member.domain, domain)) return;
  member.domain = domain;
  entry.revision += 1;
  notify(group);
}

/**
 * Drop a member.
 *
 * A group nobody claimed forgets everything; a window a reader chose is kept, so
 * a remount (a tab, a view switch, a reopened session) shows it again.
 */
export function releaseRangeMember(group: string, id: string): void {
  const entry = groups.get(group);
  if (!entry) return;
  entry.members.delete(id);
  if (entry.members.size > 0) return;
  if (entry.intent === "default") {
    groups.delete(group);
    listeners.delete(group);
    stateCache.delete(group);
  }
}

/**
 * A reader picked a preset on one of the group's controls.
 *
 * `window` is resolved by the caller, which owns the preset vocabulary.
 */
export function selectRangePreset(group: string, preset: string, window: RangeWindow | null): boolean {
  readGroup(group);
  return commit(group, { preset, window, intent: "preset" });
}

/**
 * A reader panned or zoomed one of the group's plates.
 *
 * `preset` is the preset the resulting window matches, or `null` when it matches
 * none -- the honest "this is a manual window" that keeps the selector from
 * claiming a preset the reader is no longer on. A manual window is never
 * replaced by a member's declared default.
 */
export function selectRangeWindow(group: string, window: RangeWindow, preset: string | null): boolean {
  readGroup(group);
  return commit(group, { preset, window, intent: "manual" });
}

export function subscribeRangeGroup(group: string, listener: () => void): () => void {
  let set = listeners.get(group);
  if (!set) {
    set = new Set();
    listeners.set(group, set);
  }
  set.add(listener);
  return () => {
    set.delete(listener);
    if (set.size === 0) listeners.delete(group);
  };
}

/** Test seam: forget every group (and every reader choice). */
export function resetRangeGroups(): void {
  groups.clear();
  listeners.clear();
  stateCache.clear();
}

/** Test seam: what the store holds, including unclaimed declarations. */
export function rangeGroupSnapshot(group: string): {
  state: RangeGroupState;
  members: Array<{ id: string } & Member>;
} {
  const entry = groups.get(group);
  return {
    state: rangeGroupState(group),
    members: entry ? [...entry.members].map(([id, member]) => ({ id, ...member })) : [],
  };
}
