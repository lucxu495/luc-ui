"use client";
import { cn } from "../utils/cn.js";
import { SearchInput } from "../components/search-input.js";
import { useDataTable } from "./context.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/table/data-table-toolbar.tsx
function DataTableToolbar({ className, children, search = false, actions }) {
	const { table } = useDataTable();
	const config = typeof search === "object" ? search : {};
	const globalFilter = table.state.globalFilter ?? "";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "data-table-toolbar",
		className: cn("flex flex-wrap items-center gap-2 border-b border-line-subtle px-3 py-2.5", className),
		children: [
			search ? /* @__PURE__ */ jsx(SearchInput, {
				size: "sm",
				className: cn("w-full sm:w-64", config?.className),
				placeholder: config?.placeholder ?? "Search rows…",
				"aria-label": config?.label ?? "Search rows",
				value: globalFilter,
				onValueChange: (value) => table.setGlobalFilter(value)
			}) : null,
			children ? /* @__PURE__ */ jsx("div", {
				className: "flex flex-wrap items-center gap-2",
				children
			}) : null,
			actions ? /* @__PURE__ */ jsx("div", {
				className: "ml-auto flex flex-wrap items-center gap-2",
				children: actions
			}) : null
		]
	});
}
/** Live count plus a clear action. Renders nothing when the selection is empty. */
function DataTableSelectionCount({ className, label = "selected" }) {
	const { table } = useDataTable();
	const selection = table.state.rowSelection ?? {};
	const count = Object.keys(selection).length;
	if (count === 0) return null;
	return /* @__PURE__ */ jsxs("span", {
		className: cn("flex items-center gap-2 text-caption text-fg-secondary", className),
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "luc-numeric",
				"aria-live": "polite",
				children: [
					count,
					" ",
					label
				]
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "h-3 w-px bg-line-default"
			}),
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => table.resetRowSelection(),
				className: "rounded-xs text-fg-muted luc-transition hover:text-fg-primary luc-focus",
				children: "Clear"
			})
		]
	});
}
//#endregion
export { DataTableSelectionCount, DataTableToolbar };

//# sourceMappingURL=data-table-toolbar.js.map