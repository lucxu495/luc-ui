import { ChartSyncBus } from "./sync.js";
import { ReactNode } from "react";
//#region src/charts/core/sync-context.d.ts
/**
 * Swap in a scoped bus. Optional: charts sharing a `syncGroup` synchronise
 * through the module-level bus by default, so a page does not have to remember
 * to wrap anything. Use this when two grids on one page must stay independent.
 */
export declare function ChartSyncProvider({ bus, children }: {
  bus?: ChartSyncBus;
  children: ReactNode;
}): import("react").JSX.Element;
export declare function useChartSyncBus(): ChartSyncBus;
export declare function ChartSyncGroupProvider({ groupId, children }: {
  groupId: string;
  children: ReactNode;
}): import("react").JSX.Element;
export declare function useInheritedSyncGroup(): string | null;
//#endregion
//# sourceMappingURL=sync-context.d.ts.map