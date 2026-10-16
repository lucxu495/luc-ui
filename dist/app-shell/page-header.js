"use client";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/app-shell/page-header.tsx
function PageHeader({ eyebrow, title, description, meta, actions, controls, tabs, density = "comfortable", sticky = false, className, children, ...props }) {
	const dense = density === "dense";
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "page-header",
		"data-density": dense ? "dense" : void 0,
		className: cn("flex flex-col gap-3 border-b border-line-subtle bg-surface-canvas", dense ? "px-4 py-3.5 sm:px-6" : "px-4 py-5 sm:px-6", sticky && "sticky top-[var(--shell-topbar-height)] z-[var(--z-sticky)]", className),
		...props,
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-wrap items-start justify-between gap-x-6 gap-y-3",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "flex min-w-0 flex-col gap-1",
					children: [
						eyebrow ? /* @__PURE__ */ jsx("p", {
							className: "text-micro text-fg-muted uppercase",
							children: eyebrow
						}) : null,
						/* @__PURE__ */ jsx("h1", {
							className: cn("text-heading-sm text-fg-primary", dense && "text-title"),
							children: title
						}),
						description ? /* @__PURE__ */ jsx("p", {
							className: "max-w-[var(--container-prose)] text-body text-fg-secondary",
							children: description
						}) : null,
						meta ? /* @__PURE__ */ jsx("div", {
							className: "mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-caption text-fg-muted",
							children: meta
						}) : null
					]
				}), actions || controls ? /* @__PURE__ */ jsxs("div", {
					className: "flex shrink-0 flex-wrap items-center gap-2",
					children: [controls, actions]
				}) : null]
			}),
			children,
			tabs ? /* @__PURE__ */ jsx("div", {
				className: "-mb-px flex min-w-0 items-center gap-1 overflow-x-auto",
				children: tabs
			}) : null
		]
	});
}
/** One quiet fact in the header's metadata row. */
function PageHeaderMeta({ marker, className, children, ...props }) {
	return /* @__PURE__ */ jsxs("span", {
		className: cn("inline-flex items-center gap-1.5", className),
		...props,
		children: [marker ? /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "grid place-items-center",
			children: marker
		}) : null, children]
	});
}
//#endregion
export { PageHeader, PageHeaderMeta };

//# sourceMappingURL=page-header.js.map