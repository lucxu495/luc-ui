import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/list.tsx
function List({ className, divided = false, bordered = false, ...props }) {
	return /* @__PURE__ */ jsx("ul", {
		"data-slot": "list",
		className: cn("m-0 flex list-none flex-col p-0", bordered && "overflow-hidden rounded-lg border border-line-subtle bg-surface-default", divided && "[&>[data-slot=list-item]+[data-slot=list-item]]:border-t [&>[data-slot=list-item]+[data-slot=list-item]]:border-line-subtle", className),
		...props
	});
}
function ListItem({ className, leading, title, description, meta, trailing, children, ...props }) {
	return /* @__PURE__ */ jsxs("li", {
		"data-slot": "list-item",
		className: cn("flex items-start gap-3 px-3.5 py-3", className),
		...props,
		children: [
			leading ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "mt-0.5 grid size-6 shrink-0 place-items-center text-fg-muted [&_svg]:size-4",
				children: leading
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 flex-col gap-0.5",
				children: [
					/* @__PURE__ */ jsx("p", {
						className: "text-label text-fg-primary",
						children: title
					}),
					description ? /* @__PURE__ */ jsx("p", {
						className: "text-caption text-fg-muted",
						children: description
					}) : null,
					children
				]
			}),
			meta ? /* @__PURE__ */ jsx("span", {
				className: "shrink-0 text-caption text-fg-muted luc-numeric",
				children: meta
			}) : null,
			trailing ? /* @__PURE__ */ jsx("span", {
				className: "flex shrink-0 items-center gap-1",
				children: trailing
			}) : null
		]
	});
}
function ListHeader({ className, title, description, actions, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "list-header",
		className: cn("flex flex-wrap items-start justify-between gap-2 border-b border-line-subtle px-3.5 py-3", className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			className: "flex min-w-0 flex-col gap-0.5",
			children: [/* @__PURE__ */ jsx("p", {
				className: "text-label font-medium text-fg-primary",
				children: title
			}), description ? /* @__PURE__ */ jsx("p", {
				className: "text-caption text-fg-muted",
				children: description
			}) : null]
		}), actions ? /* @__PURE__ */ jsx("div", {
			className: "flex shrink-0 items-center gap-1.5",
			children: actions
		}) : null]
	});
}
function ListFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "list-footer",
		className: cn("flex flex-wrap items-center justify-between gap-2 border-t border-line-subtle px-3.5 py-2.5 text-caption text-fg-muted", className),
		...props
	});
}
//#endregion
export { List, ListFooter, ListHeader, ListItem };

//# sourceMappingURL=list.js.map