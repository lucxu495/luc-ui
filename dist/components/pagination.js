"use client";
import { cn } from "../utils/cn.js";
import { formatNumber } from "../utils/format.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { RiArrowLeftDoubleLine, RiArrowLeftSLine, RiArrowRightDoubleLine, RiArrowRightSLine, RiMoreLine } from "@remixicon/react";
//#region src/components/pagination.tsx
/** The page window. Pure, exported and unit-tested — it is the whole component. */
function paginationWindow(page, pageCount, siblings = 1) {
	const total = Math.max(1, Math.floor(pageCount));
	const current = Math.min(Math.max(1, Math.floor(page)), total);
	const radius = Math.max(0, siblings);
	const first = Math.max(2, current - radius);
	const last = Math.min(total - 1, current + radius);
	const tokens = [1];
	if (first > 2) tokens.push("start-gap");
	for (let index = first; index <= last; index += 1) tokens.push(index);
	if (last < total - 1) tokens.push("end-gap");
	if (total > 1) tokens.push(total);
	return tokens;
}
function pageButtonClass(active) {
	return cn("inline-flex h-control-sm min-w-8 items-center justify-center rounded-md px-2 text-label luc-numeric", "cursor-pointer select-none luc-transition luc-focus luc-press", active ? "border border-line-accent bg-surface-selected text-fg-accent shadow-[var(--elevation-rest),var(--glow-subtle)]" : "border border-transparent text-fg-secondary hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest");
}
function Pagination({ className, page, pageCount, siblings = 1, edges = true, compact = false, onPageChange, label = "Pagination", previousLabel = "Previous", nextLabel = "Next", ...props }) {
	const total = Math.max(1, Math.floor(pageCount));
	const current = Math.min(Math.max(1, Math.floor(page)), total);
	const tokens = paginationWindow(current, total, siblings);
	const go = (next) => {
		const target = Math.min(Math.max(1, next), total);
		if (target !== current) onPageChange?.(target);
	};
	return /* @__PURE__ */ jsxs("nav", {
		"data-slot": "pagination",
		"aria-label": label,
		className: cn("flex flex-wrap items-center gap-1", className),
		...props,
		children: [
			edges ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"data-slot": "pagination-first",
				"aria-label": "First page",
				disabled: current <= 1,
				onClick: () => go(1),
				className: cn("inline-flex h-control-sm items-center justify-center rounded-md border border-transparent px-1.5 text-fg-secondary", "cursor-pointer luc-transition luc-focus luc-press", "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest", "disabled:pointer-events-none disabled:text-fg-disabled"),
				children: /* @__PURE__ */ jsx(RiArrowLeftDoubleLine, {
					"aria-hidden": "true",
					className: "size-4"
				})
			}) : null,
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				"data-slot": "pagination-previous",
				"aria-label": previousLabel,
				disabled: current <= 1,
				onClick: () => go(current - 1),
				className: cn("inline-flex h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-label text-fg-secondary", "cursor-pointer luc-transition luc-focus luc-press", "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest", "disabled:pointer-events-none disabled:text-fg-disabled"),
				children: [/* @__PURE__ */ jsx(RiArrowLeftSLine, {
					"aria-hidden": "true",
					className: "size-4"
				}), /* @__PURE__ */ jsx("span", {
					className: "hidden sm:inline",
					children: previousLabel
				})]
			}),
			compact ? /* @__PURE__ */ jsxs("span", {
				"data-slot": "pagination-compact-status",
				className: "px-2 text-label text-fg-secondary luc-numeric",
				children: [
					current,
					" / ",
					total
				]
			}) : /* @__PURE__ */ jsx("ul", {
				className: "flex items-center gap-1",
				children: tokens.map((token) => typeof token === "number" ? /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-label": `Page ${token}`,
					"aria-current": token === current ? "page" : void 0,
					onClick: () => go(token),
					className: pageButtonClass(token === current),
					children: token
				}) }, token) : /* @__PURE__ */ jsx("li", {
					"aria-hidden": "true",
					className: "px-1 text-fg-muted",
					children: /* @__PURE__ */ jsx(RiMoreLine, { className: "size-4" })
				}, token))
			}),
			/* @__PURE__ */ jsxs("button", {
				type: "button",
				"data-slot": "pagination-next",
				"aria-label": nextLabel,
				disabled: current >= total,
				onClick: () => go(current + 1),
				className: cn("inline-flex h-control-sm items-center gap-1 rounded-md border border-transparent px-2 text-label text-fg-secondary", "cursor-pointer luc-transition luc-focus luc-press", "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest", "disabled:pointer-events-none disabled:text-fg-disabled"),
				children: [/* @__PURE__ */ jsx("span", {
					className: "hidden sm:inline",
					children: nextLabel
				}), /* @__PURE__ */ jsx(RiArrowRightSLine, {
					"aria-hidden": "true",
					className: "size-4"
				})]
			}),
			edges ? /* @__PURE__ */ jsx("button", {
				type: "button",
				"data-slot": "pagination-last",
				"aria-label": "Last page",
				disabled: current >= total,
				onClick: () => go(total),
				className: cn("inline-flex h-control-sm items-center justify-center rounded-md border border-transparent px-1.5 text-fg-secondary", "cursor-pointer luc-transition luc-focus luc-press", "hover:border-line-default hover:bg-surface-interactive-hover hover:text-fg-primary hover:shadow-rest", "disabled:pointer-events-none disabled:text-fg-disabled"),
				children: /* @__PURE__ */ jsx(RiArrowRightDoubleLine, {
					"aria-hidden": "true",
					className: "size-4"
				})
			}) : null
		]
	});
}
/**
* The "showing 21–40 of 312" line. Separate from `Pagination` because the
* summary belongs where the row count is known, which is not always where the
* controls are.
*/
function PaginationSummary({ className, from, to, total, unit = "results", ...props }) {
	return /* @__PURE__ */ jsx("p", {
		"data-slot": "pagination-summary",
		className: cn("text-caption text-fg-muted luc-numeric", className),
		...props,
		children: total === 0 ? /* @__PURE__ */ jsxs(Fragment, { children: ["No ", unit] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
			/* @__PURE__ */ jsxs("span", {
				className: "text-fg-secondary",
				children: [
					formatNumber(from),
					"–",
					formatNumber(to)
				]
			}),
			" ",
			"of ",
			formatNumber(total),
			" ",
			unit
		] })
	});
}
//#endregion
export { Pagination, PaginationSummary, paginationWindow };

//# sourceMappingURL=pagination.js.map