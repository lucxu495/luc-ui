"use client";
import { chartSyncBus } from "./sync.js";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext } from "react";
//#region src/charts/core/sync-context.tsx
const ChartSyncContext = createContext(chartSyncBus);
/**
* Swap in a scoped bus. Optional: charts sharing a `syncGroup` synchronise
* through the module-level bus by default, so a page does not have to remember
* to wrap anything. Use this when two grids on one page must stay independent.
*/
function ChartSyncProvider({ bus, children }) {
	return /* @__PURE__ */ jsx(ChartSyncContext.Provider, {
		value: bus ?? chartSyncBus,
		children
	});
}
function useChartSyncBus() {
	return useContext(ChartSyncContext);
}
/** Group id inherited from a surrounding `ChartSyncGroup`, when one exists. */
const ChartSyncGroupContext = createContext(null);
function ChartSyncGroupProvider({ groupId, children }) {
	return /* @__PURE__ */ jsx(ChartSyncGroupContext.Provider, {
		value: groupId,
		children
	});
}
function useInheritedSyncGroup() {
	return useContext(ChartSyncGroupContext);
}
//#endregion
export { ChartSyncGroupProvider, ChartSyncProvider, useChartSyncBus, useInheritedSyncGroup };

//# sourceMappingURL=sync-context.js.map