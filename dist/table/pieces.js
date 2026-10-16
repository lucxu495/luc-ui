"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiArrowDownSLine, RiArrowUpDownLine, RiArrowUpSLine } from "@remixicon/react";
import { flexRender } from "@tanstack/react-table";
//#region src/table/pieces.tsx
/**
* Small shared pieces of the table chrome. `DataTable` and `VirtualDataTable`
* must be indistinguishable to the reader, so the rhythm, the sort affordance
* and the sticky/pinned surface rules live here once.
*/
const densityRow = {
	compact: "h-8",
	comfortable: "h-10"
};
const densityCell = {
	compact: "px-3 py-1",
	comfortable: "px-3.5 py-2"
};
/** Sort state as one icon, not three competing chevrons. */
function SortIndicator({ column }) {
	const sorted = column.getIsSorted();
	if (sorted === "asc") return /* @__PURE__ */ jsx(RiArrowUpSLine, {
		"aria-hidden": "true",
		className: "size-3.5 text-fg-accent"
	});
	if (sorted === "desc") return /* @__PURE__ */ jsx(RiArrowDownSLine, {
		"aria-hidden": "true",
		className: "size-3.5 text-fg-accent"
	});
	return /* @__PURE__ */ jsx(RiArrowUpDownLine, {
		"aria-hidden": "true",
		className: "size-3.5 text-fg-disabled luc-transition group-hover/head:text-fg-muted"
	});
}
/**
* A pinned cell is a sticky information surface, so it must stay opaque: a
* translucent one lets scrolled content show through underneath (the chart
* tooltip lesson, applied to tables). Hover and selection are mirrored here
* because the row background cannot paint beneath a sticky cell.
*/
function pinnedCellClass(column) {
	const pinned = column.getIsPinned();
	if (!pinned) return "";
	return cn("sticky z-[var(--z-raised)] bg-surface-default", "group-hover/row:bg-surface-interactive-hover group-data-[selected=true]/row:bg-surface-selected", pinned === "start" ? "border-r border-line-subtle" : "border-l border-line-subtle");
}
function pinnedStyle(column) {
	const pinned = column.getIsPinned();
	if (!pinned) return void 0;
	return pinned === "start" ? { left: column.getStart("start") } : { right: column.getAfter("end") };
}
/**
* The header row. Sorting is a real `<button>` inside a `<th scope="col">` with
* `aria-sort`, so the affordance is keyboard reachable and announced. A column
* that cannot sort renders as plain text — no fake clickable headers.
*/
function TableHead({ table, density, stickyHeader, showColumnBorders }) {
	return /* @__PURE__ */ jsx("thead", { children: table.getHeaderGroups().map((headerGroup) => /* @__PURE__ */ jsx("tr", { children: headerGroup.headers.map((header) => {
		const column = header.column;
		const canSort = column.getCanSort();
		const meta = column.columnDef.meta;
		const sorted = column.getIsSorted();
		const pinned = column.getIsPinned();
		return /* @__PURE__ */ jsx("th", {
			scope: "col",
			"aria-sort": canSort ? sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none" : void 0,
			style: {
				width: header.getSize(),
				...pinnedStyle(column)
			},
			className: cn("group/head border-b border-line-subtle text-micro font-medium text-fg-muted", densityCell[density], meta?.align === "right" && "text-right", meta?.align === "center" && "text-center", stickyHeader && "sticky top-0 z-[var(--z-sticky)] bg-surface-raised", pinned && cn("sticky z-[var(--z-sticky)] bg-surface-raised", pinned === "start" ? "border-r border-line-subtle" : "border-l border-line-subtle"), showColumnBorders && "border-r border-line-subtle last:border-r-0", meta?.headerClassName),
			children: header.isPlaceholder ? null : canSort ? /* @__PURE__ */ jsxs("button", {
				type: "button",
				onClick: column.getToggleSortingHandler(),
				className: cn("-mx-1 luc-hit inline-flex w-[calc(100%+0.5rem)] items-center gap-1 rounded-xs px-1 py-0.5 uppercase luc-transition", "hover:bg-surface-interactive-hover hover:text-fg-secondary luc-focus-inset", meta?.align === "right" && "justify-end", meta?.align === "center" && "justify-center", sorted && "text-fg-secondary"),
				children: [/* @__PURE__ */ jsx("span", {
					className: "truncate",
					children: flexRender(column.columnDef.header, header.getContext())
				}), /* @__PURE__ */ jsx(SortIndicator, { column })]
			}) : /* @__PURE__ */ jsx("span", {
				className: "block truncate",
				children: flexRender(column.columnDef.header, header.getContext())
			})
		}, header.id);
	}) }, headerGroup.id)) });
}
//#endregion
export { SortIndicator, TableHead, densityCell, densityRow, pinnedCellClass, pinnedStyle };

//# sourceMappingURL=pieces.js.map