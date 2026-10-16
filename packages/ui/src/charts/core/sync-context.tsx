"use client";

import { createContext, useContext, type ReactNode } from "react";
import { chartSyncBus, type ChartSyncBus } from "./sync";

const ChartSyncContext = createContext<ChartSyncBus>(chartSyncBus);

/**
 * Swap in a scoped bus. Optional: charts sharing a `syncGroup` synchronise
 * through the module-level bus by default, so a page does not have to remember
 * to wrap anything. Use this when two grids on one page must stay independent.
 */
export function ChartSyncProvider({ bus, children }: { bus?: ChartSyncBus; children: ReactNode }) {
  return <ChartSyncContext.Provider value={bus ?? chartSyncBus}>{children}</ChartSyncContext.Provider>;
}

export function useChartSyncBus(): ChartSyncBus {
  return useContext(ChartSyncContext);
}

/** Group id inherited from a surrounding `ChartSyncGroup`, when one exists. */
const ChartSyncGroupContext = createContext<string | null>(null);

export function ChartSyncGroupProvider({ groupId, children }: { groupId: string; children: ReactNode }) {
  return <ChartSyncGroupContext.Provider value={groupId}>{children}</ChartSyncGroupContext.Provider>;
}

export function useInheritedSyncGroup(): string | null {
  return useContext(ChartSyncGroupContext);
}
