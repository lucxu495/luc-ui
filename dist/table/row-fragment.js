"use client";
import { cn } from "../utils/cn.js";
import { densityCell, densityRow } from "./pieces.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { flexRender } from "@tanstack/react-table";
//#region src/table/row-fragment.tsx
/**
* One body row (plus its expansion strip). Kept separate from `DataTable` so
* the virtualised table renders byte-identical rows and the two can never
* drift into different hover, selection or alignment behaviour.
*/
function RowFragment({ row, density, interactive, showColumnBorders, pinnedCellClass, pinnedStyle, renderSubRow, rowClassName, onRowClick, rowHeight }) {
	const selected = row.getIsSelected();
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("tr", {
		"data-selected": selected ? true : void 0,
		style: rowHeight !== void 0 ? { height: rowHeight } : void 0,
		className: cn("group/row border-b border-line-subtle last:border-b-0 luc-transition", "hover:bg-surface-interactive-hover hover:shadow-xs data-[selected=true]:bg-surface-selected", densityRow[density], interactive && "cursor-pointer", rowClassName?.(row.original)),
		...interactive ? {
			tabIndex: 0,
			onClick: () => onRowClick?.(row.original),
			onKeyDown: (event) => {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();
					onRowClick?.(row.original);
				}
			}
		} : {},
		children: row.getVisibleCells().map((cell) => {
			const meta = cell.column.columnDef.meta;
			return /* @__PURE__ */ jsx("td", {
				style: {
					width: cell.column.getSize(),
					...pinnedStyle(cell.column)
				},
				className: cn(densityCell[density], "align-middle text-label text-fg-secondary", meta?.align === "right" && "text-right", meta?.align === "center" && "text-center", showColumnBorders && "border-r border-line-subtle last:border-r-0", pinnedCellClass(cell.column), meta?.cellClassName),
				children: flexRender(cell.column.columnDef.cell, cell.getContext())
			}, cell.id);
		})
	}), renderSubRow && row.getIsExpanded() ? /* @__PURE__ */ jsx("tr", {
		className: "border-b border-line-subtle bg-surface-sunken/60",
		children: /* @__PURE__ */ jsx("td", {
			colSpan: row.getVisibleCells().length,
			className: "px-4 py-4",
			children: renderSubRow(row.original)
		})
	}) : null] });
}
//#endregion
export { RowFragment };

//# sourceMappingURL=row-fragment.js.map