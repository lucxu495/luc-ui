"use client";
import { createContext, useContext } from "react";
//#region src/table/context.ts
const DataTableContext = createContext(null);
/**
* Access the owning `DataTable` from a toolbar, facet filter, column menu or
* pagination footer. Throws outside a table so a misplaced control fails loudly
* in development instead of silently doing nothing.
*/
function useDataTable() {
	const context = useContext(DataTableContext);
	if (!context) throw new Error("useDataTable must be used inside <DataTable> from @luc/ui.");
	return context;
}
/** Optional variant for components that also stand alone. */
function useOptionalDataTable() {
	return useContext(DataTableContext);
}
//#endregion
export { DataTableContext, useDataTable, useOptionalDataTable };

//# sourceMappingURL=context.js.map