"use client";
import { rangeGroupState, subscribeRangeGroup } from "./range-group.js";
import { useCallback, useSyncExternalStore } from "react";
//#region src/charts/core/use-range-group.ts
/**
* Subscribe a component to one sync group's authoritative range state.
*
* The store is module-level (like the sync bus) so two charts of one research
* group agree without a provider between them, and the snapshot identity is
* stable per revision, which is what `useSyncExternalStore` needs.
*/
function useRangeGroupState(group) {
	const subscribe = useCallback((onChange) => subscribeRangeGroup(group, onChange), [group]);
	const read = useCallback(() => rangeGroupState(group), [group]);
	return useSyncExternalStore(subscribe, read, read);
}
//#endregion
export { useRangeGroupState };

//# sourceMappingURL=use-range-group.js.map