"use client";
import { cn } from "../utils/cn.js";
import { Checkbox } from "../components/checkbox.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover.js";
import { SearchInput } from "../components/search-input.js";
import { useDataTable } from "./context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { RiArrowDownSLine, RiFilter3Line } from "@remixicon/react";
//#region src/table/facet-filter.tsx
function FacetFilter({ columnId, label, formatValue, hideEmpty = true, searchable, className }) {
	const { table } = useDataTable();
	const [query, setQuery] = useState("");
	const column = table.getColumn(columnId);
	const filterValue = column?.getFilterValue();
	const selected = Array.isArray(filterValue) ? filterValue : [];
	const counts = column?.getFacetedUniqueValues() ?? /* @__PURE__ */ new Map();
	const options = Array.from(counts.entries()).filter(([value]) => value !== null && value !== void 0 && value !== "").filter(([, count]) => !hideEmpty || count > 0).map(([value, count]) => ({
		value: String(value),
		count
	})).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
	const needle = query.trim().toLowerCase();
	const visible = needle ? options.filter((option) => (formatValue?.(option.value) ?? option.value).toLowerCase().includes(needle)) : options;
	const showSearch = searchable ?? options.length >= 8;
	const toggle = (value, checked) => {
		const next = checked ? [...selected, value] : selected.filter((item) => item !== value);
		column?.setFilterValue(next.length > 0 ? next : void 0);
	};
	if (!column) return null;
	return /* @__PURE__ */ jsxs(PopoverRoot, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-label": `Filter by ${label}`,
			className: cn("inline-flex h-control-sm items-center gap-1.5 rounded-sm border px-2.5 text-label luc-transition luc-focus", selected.length > 0 ? "border-line-accent bg-surface-selected text-fg-primary" : "border-line-default bg-surface-sunken text-fg-secondary hover:border-line-strong hover:text-fg-primary", className),
			children: [
				/* @__PURE__ */ jsx(RiFilter3Line, {
					"aria-hidden": "true",
					className: "size-3.5 text-fg-muted"
				}),
				label,
				selected.length > 0 ? /* @__PURE__ */ jsx("span", {
					className: "luc-numeric rounded-xs bg-accent-soft px-1 text-micro text-fg-accent",
					children: selected.length
				}) : null,
				/* @__PURE__ */ jsx(RiArrowDownSLine, {
					"aria-hidden": "true",
					className: "size-3.5 text-fg-muted"
				})
			]
		})
	}), /* @__PURE__ */ jsxs(PopoverContent, {
		width: "sm",
		align: "start",
		className: "flex flex-col gap-1 p-0",
		children: [
			showSearch ? /* @__PURE__ */ jsx("div", {
				className: "border-b border-line-subtle p-2",
				children: /* @__PURE__ */ jsx(SearchInput, {
					size: "sm",
					placeholder: `Filter ${label.toLowerCase()}…`,
					"aria-label": `Filter ${label.toLowerCase()} options`,
					value: query,
					onValueChange: setQuery
				})
			}) : null,
			/* @__PURE__ */ jsx("div", {
				role: "group",
				"aria-label": `${label} filter`,
				className: "max-h-64 overflow-y-auto overscroll-contain p-1.5",
				children: visible.length === 0 ? /* @__PURE__ */ jsxs("p", {
					className: "px-2 py-3 text-caption text-fg-muted",
					children: [
						"No options match “",
						query,
						"”."
					]
				}) : visible.map((option) => /* @__PURE__ */ jsxs("label", {
					className: "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 luc-transition hover:bg-surface-interactive-hover",
					children: [
						/* @__PURE__ */ jsx(Checkbox, {
							checked: selected.includes(option.value),
							onCheckedChange: (checked) => toggle(option.value, checked === true)
						}),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate text-label text-fg-secondary",
							children: formatValue?.(option.value) ?? option.value
						}),
						/* @__PURE__ */ jsx("span", {
							"aria-hidden": "true",
							className: "luc-numeric shrink-0 text-caption text-fg-disabled",
							children: option.count
						})
					]
				}, option.value))
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between gap-2 border-t border-line-subtle px-2.5 py-2",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-caption text-fg-muted",
					children: selected.length > 0 ? `${selected.length} selected` : "All rows"
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					disabled: selected.length === 0,
					onClick: () => column.setFilterValue(void 0),
					className: "rounded-xs text-caption text-fg-muted luc-transition hover:text-fg-primary disabled:pointer-events-none disabled:text-fg-disabled luc-focus",
					children: "Clear"
				})]
			})
		]
	})] });
}
//#endregion
export { FacetFilter };

//# sourceMappingURL=facet-filter.js.map