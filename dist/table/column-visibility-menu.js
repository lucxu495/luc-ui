"use client";
import { cn } from "../utils/cn.js";
import { Checkbox } from "../components/checkbox.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover.js";
import { useDataTable } from "./context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { RiLayoutColumnLine } from "@remixicon/react";
//#region src/table/column-visibility-menu.tsx
function ColumnVisibilityMenu({ label = "Columns", className }) {
	const { table } = useDataTable();
	const columns = table.getAllLeafColumns();
	const hiddenCount = columns.filter((column) => !column.getIsVisible()).length;
	return /* @__PURE__ */ jsxs(PopoverRoot, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsxs("button", {
			type: "button",
			className: cn("inline-flex h-control-sm items-center gap-1.5 rounded-sm border border-line-default bg-surface-sunken px-2.5 text-label text-fg-secondary", "luc-transition hover:border-line-strong hover:text-fg-primary luc-focus", className),
			children: [
				/* @__PURE__ */ jsx(RiLayoutColumnLine, {
					"aria-hidden": "true",
					className: "size-3.5 text-fg-muted"
				}),
				label,
				hiddenCount > 0 ? /* @__PURE__ */ jsxs("span", {
					className: "luc-numeric rounded-xs bg-surface-interactive px-1 text-micro text-fg-muted",
					children: [hiddenCount, " hidden"]
				}) : null
			]
		})
	}), /* @__PURE__ */ jsxs(PopoverContent, {
		width: "sm",
		align: "end",
		className: "flex flex-col gap-1 p-1.5",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "px-1.5 pt-1 pb-0.5 text-micro font-medium text-fg-muted uppercase",
				children: label
			}),
			columns.map((column) => {
				const meta = column.columnDef.meta;
				const canHide = column.getCanHide();
				const columnLabel = meta?.label ?? (typeof column.columnDef.header === "string" ? column.columnDef.header : column.id);
				return /* @__PURE__ */ jsxs("label", {
					className: cn("flex items-center gap-2 rounded-sm px-2 py-1.5 luc-transition", canHide ? "cursor-pointer hover:bg-surface-interactive-hover" : "cursor-default opacity-70"),
					children: [
						/* @__PURE__ */ jsx(Checkbox, {
							checked: column.getIsVisible(),
							disabled: !canHide,
							onCheckedChange: () => column.toggleVisibility()
						}),
						/* @__PURE__ */ jsx("span", {
							className: "min-w-0 flex-1 truncate text-label text-fg-secondary",
							children: columnLabel
						}),
						!canHide ? /* @__PURE__ */ jsx("span", {
							className: "text-micro text-fg-disabled uppercase",
							children: "fixed"
						}) : null
					]
				}, column.id);
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mt-0.5 flex items-center justify-between border-t border-line-subtle px-1.5 pt-2",
				children: [/* @__PURE__ */ jsxs("span", {
					className: "text-caption text-fg-muted",
					children: [
						columns.length - hiddenCount,
						" of ",
						columns.length,
						" shown"
					]
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => table.toggleAllColumnsVisible(true),
					className: "rounded-xs text-caption text-fg-muted luc-transition hover:text-fg-primary luc-focus",
					children: "Show all"
				})]
			})
		]
	})] });
}
//#endregion
export { ColumnVisibilityMenu };

//# sourceMappingURL=column-visibility-menu.js.map