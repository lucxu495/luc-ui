"use client";
import { cn } from "../utils/cn.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select.js";
import { useDataTable } from "./context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine } from "@remixicon/react";
//#region src/table/data-table-pagination.tsx
function PageButton({ label, disabled, onClick, children }) {
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		"aria-label": label,
		disabled,
		onClick,
		className: cn("grid size-7 place-items-center rounded-sm border border-line-default bg-surface-sunken text-fg-muted", "luc-transition hover:border-line-strong hover:text-fg-primary luc-focus", "disabled:pointer-events-none disabled:opacity-45"),
		children
	});
}
function DataTablePagination({ className, pageSizeOptions = [
	10,
	20,
	50,
	100
], rowLabel = "rows" }) {
	const { table } = useDataTable();
	const { pageIndex, pageSize } = table.state.pagination;
	const pageCount = table.getPageCount();
	const total = table.getFilteredRowModel().rows.length;
	const first = total === 0 ? 0 : pageIndex * pageSize + 1;
	const last = Math.min((pageIndex + 1) * pageSize, total);
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "data-table-pagination",
		className: cn("flex flex-wrap items-center justify-between gap-3 border-t border-line-subtle px-3 py-2.5", className),
		children: [/* @__PURE__ */ jsxs("p", {
			className: "text-caption text-fg-muted",
			"aria-live": "polite",
			children: [
				/* @__PURE__ */ jsxs("span", {
					className: "luc-numeric",
					children: [
						first,
						"–",
						last
					]
				}),
				" ",
				"of ",
				/* @__PURE__ */ jsx("span", {
					className: "luc-numeric",
					children: total
				}),
				" ",
				rowLabel
			]
		}), /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-center gap-3",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-2 text-caption text-fg-muted",
				children: [/* @__PURE__ */ jsx("span", {
					id: "luc-table-page-size",
					children: "Rows per page"
				}), /* @__PURE__ */ jsxs(Select, {
					size: "sm",
					value: String(pageSize),
					onValueChange: (value) => table.setPageSize(Number(value)),
					children: [/* @__PURE__ */ jsx(SelectTrigger, {
						size: "sm",
						className: "w-[4.75rem]",
						"aria-labelledby": "luc-table-page-size",
						children: /* @__PURE__ */ jsx(SelectValue, {})
					}), /* @__PURE__ */ jsx(SelectContent, {
						size: "sm",
						children: pageSizeOptions.map((option) => /* @__PURE__ */ jsx(SelectItem, {
							value: String(option),
							children: option
						}, option))
					})]
				})]
			}), /* @__PURE__ */ jsxs("div", {
				className: "flex items-center gap-1",
				children: [
					/* @__PURE__ */ jsx(PageButton, {
						label: "First page",
						disabled: !table.getCanPreviousPage(),
						onClick: () => table.firstPage(),
						children: /* @__PURE__ */ jsx(RiArrowLeftDoubleLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					}),
					/* @__PURE__ */ jsx(PageButton, {
						label: "Previous page",
						disabled: !table.getCanPreviousPage(),
						onClick: () => table.previousPage(),
						children: /* @__PURE__ */ jsx(RiArrowLeftSLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					}),
					/* @__PURE__ */ jsxs("span", {
						className: "px-1.5 text-caption text-fg-secondary luc-numeric",
						children: [
							pageCount > 0 ? pageIndex + 1 : 0,
							" / ",
							Math.max(pageCount, 0)
						]
					}),
					/* @__PURE__ */ jsx(PageButton, {
						label: "Next page",
						disabled: !table.getCanNextPage(),
						onClick: () => table.nextPage(),
						children: /* @__PURE__ */ jsx(RiArrowRightSLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					}),
					/* @__PURE__ */ jsx(PageButton, {
						label: "Last page",
						disabled: !table.getCanLastPage(),
						onClick: () => table.lastPage(),
						children: /* @__PURE__ */ jsx(RiArrowRightDoubleLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						})
					})
				]
			})]
		})]
	});
}
//#endregion
export { DataTablePagination };

//# sourceMappingURL=data-table-pagination.js.map