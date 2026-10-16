"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { Checkbox } from "../components/checkbox.js";
import { dataTableFeatures } from "./types.js";
import { jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { RiArrowRightSLine } from "@remixicon/react";
import { useTable } from "@tanstack/react-table";
//#region src/table/table-core.tsx
function useDataTableCore({ columns, data, getRowId, sorting, defaultSorting, onSortingChange, columnFilters, defaultColumnFilters, onColumnFiltersChange, globalFilter, defaultGlobalFilter, onGlobalFilterChange, rowSelection, defaultRowSelection, onRowSelectionChange, columnVisibility, defaultColumnVisibility, onColumnVisibilityChange, columnPinning, defaultColumnPinning, onColumnPinningChange, expanded, defaultExpanded, onExpandedChange, pagination, defaultPagination, onPaginationChange, enableSorting = true, enableFiltering = true, enableGlobalFilter = true, enableRowSelection = false, enableExpansion = false, enableColumnVisibility = true, pageSize, manualPagination, manualSorting, manualFiltering, pageCount, rowCount }) {
	const [sortingState, setSortingState] = useControllableState({
		value: sorting,
		defaultValue: defaultSorting ?? [],
		onChange: onSortingChange
	});
	const [filterState, setFilterState] = useControllableState({
		value: columnFilters,
		defaultValue: defaultColumnFilters ?? [],
		onChange: onColumnFiltersChange
	});
	const [globalFilterState, setGlobalFilterState] = useControllableState({
		value: globalFilter,
		defaultValue: defaultGlobalFilter ?? "",
		onChange: onGlobalFilterChange
	});
	const [selectionState, setSelectionState] = useControllableState({
		value: rowSelection,
		defaultValue: defaultRowSelection ?? {},
		onChange: onRowSelectionChange
	});
	const [visibilityState, setVisibilityState] = useControllableState({
		value: columnVisibility,
		defaultValue: defaultColumnVisibility ?? {},
		onChange: onColumnVisibilityChange
	});
	const [pinningState, setPinningState] = useControllableState({
		value: columnPinning,
		defaultValue: defaultColumnPinning ?? {
			start: [],
			end: []
		},
		onChange: onColumnPinningChange
	});
	const [expandedState, setExpandedState] = useControllableState({
		value: expanded,
		defaultValue: defaultExpanded ?? {},
		onChange: onExpandedChange
	});
	const [paginationState, setPaginationState] = useControllableState({
		value: pagination,
		defaultValue: defaultPagination ?? {
			pageIndex: 0,
			pageSize: pageSize ?? 20
		},
		onChange: onPaginationChange
	});
	const selectable = enableRowSelection !== false;
	const allColumns = useMemo(() => {
		const leading = [];
		if (enableExpansion) leading.push({
			id: "__expand",
			header: () => /* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Expand row"
			}),
			enableSorting: false,
			enableColumnFilter: false,
			enableGlobalFilter: false,
			enableHiding: false,
			size: 36,
			minSize: 36,
			maxSize: 36,
			meta: {
				align: "center",
				locked: true
			},
			cell: ({ row }) => row.getCanExpand() ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"aria-label": row.getIsExpanded() ? "Collapse row" : "Expand row",
				"aria-expanded": row.getIsExpanded(),
				onClick: row.getToggleExpandedHandler(),
				className: "grid size-5 place-items-center rounded-xs text-fg-muted luc-transition hover:bg-surface-interactive-hover hover:text-fg-primary luc-focus",
				children: /* @__PURE__ */ jsx(RiArrowRightSLine, {
					"aria-hidden": "true",
					className: cn("size-4 luc-transition", row.getIsExpanded() && "rotate-90")
				})
			}) : null
		});
		if (selectable) leading.push({
			id: "__select",
			header: ({ table }) => /* @__PURE__ */ jsx(Checkbox, {
				"aria-label": "Select all rows on this page",
				checked: table.getIsAllPageRowsSelected() ? true : table.getIsSomePageRowsSelected() ? "indeterminate" : false,
				onCheckedChange: (value) => table.toggleAllPageRowsSelected(value === true),
				disabled: table.getRowModel().rows.length === 0
			}),
			enableSorting: false,
			enableColumnFilter: false,
			enableGlobalFilter: false,
			enableHiding: false,
			size: 44,
			minSize: 44,
			maxSize: 44,
			meta: {
				align: "left",
				locked: true
			},
			cell: ({ row }) => /* @__PURE__ */ jsx(Checkbox, {
				"aria-label": `Select row ${row.index + 1}`,
				checked: row.getIsSelected(),
				disabled: !row.getCanSelect(),
				onCheckedChange: (value) => row.toggleSelected(value === true)
			})
		});
		return [...leading, ...columns];
	}, [
		columns,
		enableExpansion,
		selectable
	]);
	return useTable({
		features: dataTableFeatures,
		columns: allColumns,
		data,
		...getRowId ? { getRowId } : {},
		state: {
			sorting: sortingState,
			columnFilters: filterState,
			globalFilter: globalFilterState,
			rowSelection: selectionState,
			columnVisibility: visibilityState,
			columnPinning: pinningState,
			expanded: expandedState,
			pagination: paginationState
		},
		enableSorting,
		enableFilters: enableFiltering,
		enableGlobalFilter: enableGlobalFilter && enableFiltering,
		enableRowSelection: enableRowSelection === "single" ? true : enableRowSelection,
		enableMultiRowSelection: enableRowSelection !== "single",
		enableExpanding: enableExpansion,
		...enableExpansion ? { getRowCanExpand: () => true } : {},
		enableColumnFilters: enableFiltering,
		enableHiding: enableColumnVisibility,
		manualPagination,
		manualSorting,
		manualFiltering,
		...pageCount !== void 0 ? { pageCount } : {},
		...rowCount !== void 0 ? { rowCount } : {},
		onSortingChange: (updater) => setSortingState((current) => typeof updater === "function" ? updater(current) : updater),
		onColumnFiltersChange: (updater) => setFilterState((current) => typeof updater === "function" ? updater(current) : updater),
		onGlobalFilterChange: (updater) => setGlobalFilterState((current) => typeof updater === "function" ? updater(current) : updater),
		onRowSelectionChange: (updater) => setSelectionState((current) => typeof updater === "function" ? updater(current) : updater),
		onColumnVisibilityChange: (updater) => setVisibilityState((current) => typeof updater === "function" ? updater(current) : updater),
		onColumnPinningChange: (updater) => setPinningState((current) => typeof updater === "function" ? updater(current) : updater),
		onExpandedChange: (updater) => setExpandedState((current) => typeof updater === "function" ? updater(current) : updater),
		onPaginationChange: (updater) => setPaginationState((current) => typeof updater === "function" ? updater(current) : updater)
	});
}
//#endregion
export { useDataTableCore };

//# sourceMappingURL=table-core.js.map