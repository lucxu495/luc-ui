"use client";
import { cn } from "../utils/cn.js";
import { DataTableContext } from "./context.js";
import { TableHead, pinnedCellClass, pinnedStyle } from "./pieces.js";
import { RowFragment } from "./row-fragment.js";
import { useDataTableCore } from "./table-core.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
//#region src/table/virtual-data-table.tsx
function VirtualDataTable({ ariaLabel, ariaDescription, caption, state: tableState = "ready", emptyState, errorState, density = "comfortable", rowHeight, overscan = 12, height = "32rem", stickyHeader = true, showColumnBorders = false, toolbar, footer, onRowClick, onRenderedRowCountChange, className, ...core }) {
	const table = useDataTableCore({
		...core,
		enableExpansion: false
	});
	const scrollRef = useRef(null);
	const rows = table.getRowModel().rows;
	const columnCount = Math.max(table.getVisibleLeafColumns().length, 1);
	const estimate = rowHeight ?? (density === "compact" ? 32 : 40);
	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: () => estimate,
		overscan
	});
	const items = virtualizer.getVirtualItems();
	const first = items[0];
	const last = items[items.length - 1];
	const paddingTop = first ? first.start : 0;
	const paddingBottom = last ? virtualizer.getTotalSize() - last.end : 0;
	useEffect(() => {
		onRenderedRowCountChange?.(items.length);
	}, [items.length, onRenderedRowCountChange]);
	const interactive = Boolean(onRowClick);
	const isEmpty = tableState === "empty" || tableState === "error" || rows.length === 0;
	return /* @__PURE__ */ jsx(DataTableContext.Provider, {
		value: {
			table,
			density,
			stickyHeader,
			visibleRowCount: rows.length
		},
		children: /* @__PURE__ */ jsxs("div", {
			"data-slot": "data-table",
			"data-virtualized": "true",
			className: cn("flex min-w-0 flex-col", className),
			children: [
				toolbar,
				/* @__PURE__ */ jsx("div", {
					ref: scrollRef,
					"data-slot": "data-table-scroll",
					style: { height },
					className: "relative min-h-0 overflow-auto overscroll-x-contain isolate rounded-lg border border-line-subtle bg-surface-default",
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
							/* @__PURE__ */ jsx("tbody", { children: isEmpty ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", {
								colSpan: columnCount,
								className: "px-4 py-12",
								children: /* @__PURE__ */ jsx("div", {
									className: "flex flex-col items-center gap-1.5 text-center",
									children: tableState === "error" ? errorState ?? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
										className: "text-label font-medium text-fg-primary",
										children: "Could not load rows"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-caption text-fg-muted",
										children: "The request failed."
									})] }) : emptyState ?? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("p", {
										className: "text-label font-medium text-fg-primary",
										children: "No rows"
									}), /* @__PURE__ */ jsx("p", {
										className: "text-caption text-fg-muted",
										children: "Nothing matches the current filters."
									})] })
								})
							}) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
								paddingTop > 0 ? /* @__PURE__ */ jsx("tr", {
									"aria-hidden": "true",
									children: /* @__PURE__ */ jsx("td", {
										colSpan: columnCount,
										style: {
											height: paddingTop,
											padding: 0
										}
									})
								}) : null,
								items.map((item) => {
									const row = rows[item.index];
									if (!row) return null;
									return /* @__PURE__ */ jsx(RowFragment, {
										row,
										density,
										interactive,
										showColumnBorders,
										pinnedCellClass,
										pinnedStyle,
										onRowClick,
										rowHeight: estimate
									}, row.id);
								}),
								paddingBottom > 0 ? /* @__PURE__ */ jsx("tr", {
									"aria-hidden": "true",
									children: /* @__PURE__ */ jsx("td", {
										colSpan: columnCount,
										style: {
											height: paddingBottom,
											padding: 0
										}
									})
								}) : null
							] }) })
						]
					})
				}),
				footer
			]
		})
	});
}
//#endregion
export { VirtualDataTable };

//# sourceMappingURL=virtual-data-table.js.map