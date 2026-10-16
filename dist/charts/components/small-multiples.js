"use client";
import { cn } from "../../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/charts/components/small-multiples.tsx
const COLUMN_CLASS = {
	1: "grid-cols-1",
	2: "grid-cols-1 sm:grid-cols-2",
	3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
	4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4"
};
function SmallMultiples({ className, children, columns = 2, label, legend, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "small-multiples",
		className: cn("flex min-w-0 flex-col gap-3", className),
		...props,
		children: [label || legend ? /* @__PURE__ */ jsxs("div", {
			className: "flex flex-wrap items-baseline justify-between gap-2",
			children: [label ? /* @__PURE__ */ jsx("span", {
				className: "text-label font-medium text-fg-secondary",
				children: label
			}) : null, legend]
		}) : null, /* @__PURE__ */ jsx("div", {
			className: cn("grid min-w-0 gap-3", COLUMN_CLASS[columns]),
			children
		})]
	});
}
function SmallMultiple({ className, title, caption, aside, children, ...props }) {
	return /* @__PURE__ */ jsxs("figure", {
		"data-slot": "small-multiple",
		className: cn("m-0 flex min-w-0 flex-col gap-2 rounded-lg border border-line-subtle bg-surface-default p-3", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("figcaption", {
				className: "flex items-baseline justify-between gap-2",
				children: [/* @__PURE__ */ jsx("span", {
					className: "text-caption font-medium text-fg-secondary",
					children: title
				}), aside ? /* @__PURE__ */ jsx("span", {
					className: "text-caption text-fg-muted luc-numeric",
					children: aside
				}) : null]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "min-w-0",
				children
			}),
			caption ? /* @__PURE__ */ jsx("p", {
				className: "text-micro text-fg-muted",
				children: caption
			}) : null
		]
	});
}
//#endregion
export { SmallMultiple, SmallMultiples };

//# sourceMappingURL=small-multiples.js.map