"use client";
import { cn } from "../utils/cn.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "../components/popover.js";
import { NavigationLink } from "./navigation-context.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Fragment as Fragment$1 } from "react";
import { RiArrowRightSLine, RiMoreLine } from "@remixicon/react";
//#region src/app-shell/breadcrumbs.tsx
function Breadcrumb({ className, ...props }) {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": "Breadcrumb",
		"data-slot": "breadcrumb",
		className: cn("min-w-0", className),
		...props
	});
}
function BreadcrumbList({ className, ...props }) {
	return /* @__PURE__ */ jsx("ol", {
		"data-slot": "breadcrumb-list",
		className: cn("flex min-w-0 flex-wrap items-center gap-1.5 text-label", className),
		...props
	});
}
function BreadcrumbItem({ className, ...props }) {
	return /* @__PURE__ */ jsx("li", {
		"data-slot": "breadcrumb-item",
		className: cn("flex min-w-0 items-center gap-1.5", className),
		...props
	});
}
function BreadcrumbLink({ className, href, children, ...props }) {
	return /* @__PURE__ */ jsx(NavigationLink, {
		href,
		className: cn("luc-transition luc-focus truncate rounded-xs text-fg-muted hover:text-fg-primary", className),
		...props,
		children
	});
}
function BreadcrumbPage({ className, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-current": "page",
		"data-slot": "breadcrumb-page",
		className: cn("truncate text-fg-primary", className),
		...props
	});
}
function BreadcrumbSeparator({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("li", {
		role: "presentation",
		"aria-hidden": "true",
		"data-slot": "breadcrumb-separator",
		className: cn("flex shrink-0 text-fg-disabled", className),
		...props,
		children: children ?? /* @__PURE__ */ jsx(RiArrowRightSLine, { className: "size-3.5" })
	});
}
function BreadcrumbEllipsis({ items }) {
	return /* @__PURE__ */ jsxs(PopoverRoot, { children: [/* @__PURE__ */ jsx(PopoverTrigger, {
		asChild: true,
		children: /* @__PURE__ */ jsx("button", {
			type: "button",
			"aria-label": `Show ${items.length} hidden breadcrumb${items.length === 1 ? "" : "s"}`,
			className: "luc-transition luc-focus grid size-5 shrink-0 place-items-center rounded-xs text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
			children: /* @__PURE__ */ jsx(RiMoreLine, { className: "size-4" })
		})
	}), /* @__PURE__ */ jsx(PopoverContent, {
		align: "start",
		className: "flex flex-col gap-0.5 p-1.5",
		children: items.map((item) => /* @__PURE__ */ jsx(BreadcrumbLink, {
			href: item.href ?? "#",
			className: "px-2 py-1 hover:bg-surface-interactive-hover",
			children: item.label
		}, `${item.href ?? item.label}`))
	})] });
}
/**
* The shorthand trail.
*
* A deep path on a phone is unreadable, so by default anything past four crumbs
* folds into an ellipsis that opens the hidden ones — the trail keeps its
* meaning instead of being clipped.
*/
function Breadcrumbs({ items, maxItems = 4, className, trailing }) {
	const collapse = maxItems !== false && items.length > maxItems;
	const hidden = collapse ? items.slice(1, items.length - 2) : [];
	const visible = collapse ? [items[0], ...items.slice(-2)] : items;
	return /* @__PURE__ */ jsxs(Breadcrumb, {
		className: cn("flex min-w-0 items-center gap-2", className),
		children: [/* @__PURE__ */ jsx(BreadcrumbList, { children: visible.map((item, index) => {
			const isLast = index === visible.length - 1;
			return /* @__PURE__ */ jsxs(Fragment$1, { children: [
				index > 0 ? /* @__PURE__ */ jsx(BreadcrumbSeparator, {}) : null,
				collapse && index === 1 ? /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx(BreadcrumbEllipsis, { items: hidden }), /* @__PURE__ */ jsx(BreadcrumbSeparator, {})] }) : null,
				/* @__PURE__ */ jsx(BreadcrumbItem, { children: isLast || !item.href ? /* @__PURE__ */ jsx(BreadcrumbPage, { children: item.label }) : /* @__PURE__ */ jsx(BreadcrumbLink, {
					href: item.href,
					children: item.label
				}) })
			] }, `${item.href ?? item.label}-${index}`);
		}) }), trailing ? /* @__PURE__ */ jsx("span", {
			className: "flex shrink-0 items-center gap-1.5",
			children: trailing
		}) : null]
	});
}
//#endregion
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, Breadcrumbs };

//# sourceMappingURL=breadcrumbs.js.map