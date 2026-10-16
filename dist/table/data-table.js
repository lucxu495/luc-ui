"use client";
import { cn } from "../utils/cn.js";
import { Skeleton } from "../components/skeleton.js";
import { DataTableContext } from "./context.js";
import { TableHead, densityCell, densityRow, pinnedCellClass, pinnedStyle } from "./pieces.js";
import { RowFragment } from "./row-fragment.js";
import { useDataTableCore } from "./table-core.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
//#region src/table/data-table.tsx
function DataTable({ ariaLabel, ariaDescription, caption, state: tableState = "ready", loadingRows = 8, emptyState, errorState, density = "comfortable", stickyHeader = false, maxHeight, showColumnBorders = false, toolbar, footer, renderSubRow, onRowClick, rowClassName, className, scrollClassName, ...core }) {
	const table = useDataTableCore(core);
	const rows = table.getRowModel().rows;
	const columnCount = table.getVisibleLeafColumns().length;
	const interactive = Boolean(onRowClick);
	const body = useMemo(() => {
		if (tableState === "loading") return Array.from({ length: loadingRows }).map((_, rowIndex) => /* @__PURE__ */ jsx("tr", {
			className: densityRow[density],
			children: table.getVisibleLeafColumns().map((column) => /* @__PURE__ */ jsx("td", {
				className: densityCell[density],
				children: /* @__PURE__ */ jsx(Skeleton, { className: "h-3.5 w-full max-w-[7rem]" })
			}, column.id))
		}, `skeleton-${rowIndex}`));
		if (tableState === "error" || tableState === "empty" || rows.length === 0) return /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
			colSpan: Math.max(columnCount, 1),
			className: "px-4 py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "flex flex-col items-center gap-1.5 text-center",
				children: tableState === "error" ? errorState ?? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
					className: "text-label font-medium text-fg-primary",
					children: "Could not load rows"
				}), /* @__PURE__ */ jsx("p", {
					className: "max-w-[32rem] text-caption text-fg-muted",
					children: "The request failed. Retry, or widen the filters above."
				})] }) : emptyState ?? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
					className: "text-label font-medium text-fg-primary",
					children: "No rows"
				}), /* @__PURE__ */ jsx("p", {
					className: "max-w-[32rem] text-caption text-fg-muted",
					children: "Nothing matches the current filters."
				})] })
			})
		}) });
		return rows.map((row) => /* @__PURE__ */ jsx(RowFragment, {
			row,
			density,
			interactive,
			showColumnBorders,
			pinnedCellClass,
			pinnedStyle,
			renderSubRow,
			rowClassName,
			onRowClick
		}, row.id));
	}, [
		columnCount,
		density,
		emptyState,
		errorState,
		interactive,
		loadingRows,
		onRowClick,
		renderSubRow,
		rowClassName,
		rows,
		showColumnBorders,
		table,
		tableState
	]);
	return /* @__PURE__ */ jsx(DataTableContext.Provider, {
		value: {
			table,
			density,
			stickyHeader,
			visibleRowCount: rows.length
		},
		children: /* @__PURE__ */ jsxs("div", {
			"data-slot": "data-table",
			className: cn("flex min-w-0 flex-col", className),
			children: [
				toolbar,
				/* @__PURE__ */ jsx("div", {
					"data-slot": "data-table-scroll",
					style: maxHeight !== void 0 ? { maxHeight } : void 0,
					className: cn("relative min-h-0 overflow-auto overscroll-x-contain", "isolate rounded-lg border border-line-subtle bg-surface-default", scrollClassName),
					children: /* @__PURE__ */ jsxs("table", {
						"aria-label": ariaLabel,
						"aria-busy": tableState === "loading" || void 0,
						className: "w-full table-fixed border-collapse text-left",
						children: [
							/* @__PURE__ */ jsx("caption", {
								className: "sr-only",
								children: caption ?? ariaDescription ?? ariaLabel
							}),
							/* @__PURE__ */ jsx(TableHead, {
								table,
								density,
								stickyHeader,
								showColumnBorders
							}),
							/* @__PURE__ */ jsx("tbody", { children: body })
						]
					})
				}),
				footer
			]
		})
	});
}
//#endregion
export { DataTable };

//# sourceMappingURL=data-table.js.map