import { columnFacetingFeature, columnFilteringFeature, columnOrderingFeature, columnPinningFeature, columnSizingFeature, columnVisibilityFeature, createExpandedRowModel, createFacetedRowModel, createFacetedUniqueValues, createFilteredRowModel, createPaginatedRowModel, createSortedRowModel, filterFns, globalFilteringFeature, rowExpandingFeature, rowPaginationFeature, rowSelectionFeature, rowSortingFeature, sortFns, tableFeatures } from "@tanstack/react-table";
//#region src/table/types.ts
/**
* The feature set every LUC DataTable is built from.
*
* Declared once, at module scope, so the features are shared between instances
* (TanStack's recommendation) and the row models are tree-shaken to exactly the
* ones we render: filter → sort → expand → paginate.
*/
const dataTableFeatures = tableFeatures({
	rowSortingFeature,
	columnFilteringFeature,
	globalFilteringFeature,
	columnFacetingFeature,
	rowPaginationFeature,
	rowSelectionFeature,
	rowExpandingFeature,
	columnVisibilityFeature,
	columnOrderingFeature,
	columnPinningFeature,
	columnSizingFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	paginatedRowModel: createPaginatedRowModel(),
	expandedRowModel: createExpandedRowModel(),
	facetedRowModel: createFacetedRowModel(),
	facetedUniqueValues: createFacetedUniqueValues(),
	filterFns,
	sortFns,
	columnMeta: {}
});
//#endregion
export { dataTableFeatures };

//# sourceMappingURL=types.js.map