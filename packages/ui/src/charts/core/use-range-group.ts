"use client";

import { useCallback, useSyncExternalStore } from "react";
import { rangeGroupState, subscribeRangeGroup, type RangeGroupState } from "./range-group";

/**
 * Subscribe a component to one sync group's authoritative range state.
 *
 * The store is module-level (like the sync bus) so two charts of one research
 * group agree without a provider between them, and the snapshot identity is
 * stable per revision, which is what `useSyncExternalStore` needs.
 */
export function useRangeGroupState(group: string): RangeGroupState {
  const subscribe = useCallback((onChange: () => void) => subscribeRangeGroup(group, onChange), [group]);
  const read = useCallback(() => rangeGroupState(group), [group]);
  return useSyncExternalStore(subscribe, read, read);
}
