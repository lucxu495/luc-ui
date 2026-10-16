import { RangeGroupState } from "./range-group.js";
//#region src/charts/core/use-range-group.d.ts
/**
 * Subscribe a component to one sync group's authoritative range state.
 *
 * The store is module-level (like the sync bus) so two charts of one research
 * group agree without a provider between them, and the snapshot identity is
 * stable per revision, which is what `useSyncExternalStore` needs.
 */
export declare function useRangeGroupState(group: string): RangeGroupState;
//#endregion
//# sourceMappingURL=use-range-group.d.ts.map