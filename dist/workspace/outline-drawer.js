"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiListUnordered } from "@remixicon/react";
//#region src/workspace/outline-drawer.tsx
/** A plain left click on a link we may intercept; anything else is the browser's. */
function isPlainLeftClick(event) {
	return event.button === 0 && !event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
function OutlineDrawer({ label, groups, open: openProp, defaultOpen = true, onOpenChange, expandedGroupId, pendingGroupId = null, activeItemId = null, activeSectionId = null, anchorHref = (id) => `#${id}`, onSelectGroup, onSelectItem, collapsible = true, footer, className }) {
	const [open, setOpen] = useControllableState({
		value: openProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange
	});
	const listRef = useRef(null);
	const reducedMotion = useReducedMotion();
	useEffect(() => {
		if (!open || !activeItemId) return;
		const frame = requestAnimationFrame(() => {
			const container = listRef.current;
			const target = container?.querySelector(`[data-outline-target-id="${CSS.escape(activeItemId)}"]`);
			if (!container || !target) return;
			const bounds = container.getBoundingClientRect();
			const item = target.getBoundingClientRect();
			let delta = 0;
			if (item.top < bounds.top) delta = item.top - bounds.top;
			else if (item.bottom > bounds.bottom) delta = item.bottom - bounds.bottom;
			if (delta === 0) return;
			container.scrollTo({
				top: container.scrollTop + delta,
				behavior: reducedMotion ? "auto" : "smooth"
			});
		});
		return () => cancelAnimationFrame(frame);
	}, [
		activeItemId,
		open,
		reducedMotion
	]);
	const hasAnchors = (group) => (group.items?.length ?? 0) > 0 || (group.sections?.length ?? 0) > 0;
	const expanded = pendingGroupId ?? expandedGroupId ?? groups.find(hasAnchors)?.id ?? groups[0]?.id ?? null;
	if (groups.length === 0) return null;
	if (!open) return /* @__PURE__ */ jsxs("nav", {
		"data-slot": "outline-drawer",
		"data-state": "collapsed",
		"aria-label": label,
		className: cn("sticky top-[calc(var(--shell-topbar-height,4rem)+1.5rem)] flex w-10 shrink-0 flex-col items-center gap-1", className),
		children: [collapsible ? /* @__PURE__ */ jsx(IconButton, {
			label,
			size: "sm",
			variant: "ghost",
			icon: open ? /* @__PURE__ */ jsx(RiArrowRightSLine, {}) : /* @__PURE__ */ jsx(RiListUnordered, {}),
			onClick: () => setOpen(true)
		}) : null, /* @__PURE__ */ jsx("ul", {
			className: "flex flex-col items-center gap-0.5",
			children: groups.map((group) => {
				const current = group.id === expanded;
				return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
					href: group.href ?? anchorHref(group.id),
					"aria-current": current ? "true" : void 0,
					"data-active": current ? "true" : void 0,
					onClick: (event) => {
						setOpen(true);
						if (!group.href) return;
						if (!isPlainLeftClick(event)) return;
						if (onSelectGroup?.(group) === false) event.preventDefault();
					},
					className: cn("luc-focus luc-numeric flex size-7 items-center justify-center rounded-sm text-micro transition-colors", current ? "bg-surface-sunken text-fg-primary" : "text-fg-muted hover:text-fg-secondary"),
					children: group.index ?? group.label.slice(0, 2)
				}) }, group.id);
			})
		})]
	});
	return /* @__PURE__ */ jsxs("nav", {
		"data-slot": "outline-drawer",
		"data-state": "expanded",
		"aria-label": label,
		className: cn("sticky top-[calc(var(--shell-topbar-height,4rem)+1.5rem)] flex w-60 shrink-0 flex-col", className),
		children: [
			/* @__PURE__ */ jsxs("div", {
				className: "mb-2 flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ jsx("p", {
					className: "text-micro font-medium uppercase tracking-wide text-fg-muted",
					children: label
				}), collapsible ? /* @__PURE__ */ jsx(IconButton, {
					label,
					size: "sm",
					variant: "ghost",
					icon: /* @__PURE__ */ jsx(RiArrowRightSLine, {}),
					onClick: () => setOpen(false)
				}) : null]
			}),
			/* @__PURE__ */ jsx("ul", {
				ref: listRef,
				className: "flex max-h-[calc(100dvh-var(--shell-topbar-height,4rem)-6rem)] flex-col gap-0.5 overflow-y-auto overscroll-contain pr-1",
				"data-slot": "outline-drawer-groups",
				children: groups.map((group) => {
					const isExpanded = group.id === expanded;
					const isPending = group.id === pendingGroupId;
					const items = group.items ?? [];
					const sections = group.sections ?? [];
					const hasItems = items.length > 0 || sections.length > 0;
					return /* @__PURE__ */ jsxs("li", {
						"data-group-id": group.id,
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "flex items-stretch",
								children: /* @__PURE__ */ jsxs("a", {
									href: group.href ?? anchorHref(group.id),
									...hasItems ? { "aria-expanded": isExpanded } : {},
									"aria-current": isExpanded ? "page" : void 0,
									"data-active": isExpanded ? "true" : void 0,
									"data-pending": isPending ? "true" : void 0,
									onClick: (event) => {
										if (!isPlainLeftClick(event)) return;
										if (hasItems && !group.href) {
											event.preventDefault();
											setOpen(true);
											onSelectItem?.(group.id);
											return;
										}
										setOpen(true);
										if (group.href && onSelectGroup?.(group) === false) event.preventDefault();
									},
									className: cn("luc-focus flex min-w-0 flex-1 items-center gap-2 rounded-sm py-1 pl-2 pr-1 text-caption transition-colors", isExpanded ? "text-fg-primary" : "text-fg-secondary hover:bg-surface-sunken hover:text-fg-primary"),
									children: [
										group.index ? /* @__PURE__ */ jsx("span", {
											"aria-hidden": "true",
											className: "luc-numeric w-4 shrink-0 text-micro text-fg-muted",
											children: group.index
										}) : null,
										/* @__PURE__ */ jsx("span", {
											className: "min-w-0 flex-1 truncate",
											children: group.label
										}),
										/* @__PURE__ */ jsx(RiArrowRightSLine, {
											"aria-hidden": "true",
											className: cn("size-4 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none", isExpanded && "rotate-90")
										})
									]
								})
							}),
							isExpanded && items.length > 0 ? /* @__PURE__ */ jsx("ul", {
								className: "ml-4 flex flex-col gap-px border-l border-line-subtle",
								"data-slot": "outline-drawer-items",
								children: items.map((item) => {
									const current = item.id === activeItemId;
									return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
										href: anchorHref(item.id),
										"data-outline-target-id": item.id,
										"aria-current": current ? "true" : void 0,
										"data-active": current ? "true" : void 0,
										onClick: (event) => {
											if (!isPlainLeftClick(event)) return;
											if (onSelectItem?.(item.id) === false) event.preventDefault();
										},
										className: cn("luc-focus -ml-px block border-l-2 py-1 pl-3 pr-2 text-caption transition-colors", current ? "border-accent-default bg-surface-selected font-medium text-accent-strong" : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg-secondary"),
										children: item.label
									}) }, item.id);
								})
							}) : null,
							isExpanded && sections.length > 0 ? /* @__PURE__ */ jsx("div", {
								className: "ml-4 border-l border-line-subtle",
								"data-slot": "outline-drawer-sections",
								children: sections.map((section) => /* @__PURE__ */ jsxs("div", {
									"data-outline-section-id": section.id,
									children: [/* @__PURE__ */ jsx("a", {
										href: anchorHref(section.id),
										"data-outline-target-id": section.id,
										"aria-current": section.id === activeItemId || section.id === activeSectionId ? "true" : void 0,
										"data-active": section.id === activeItemId || section.id === activeSectionId ? "true" : void 0,
										onClick: (event) => {
											if (!isPlainLeftClick(event)) return;
											if (onSelectItem?.(section.id) === false) event.preventDefault();
										},
										className: cn("luc-focus -ml-px block border-l-2 py-1 pl-3 pr-2 text-caption font-medium transition-colors", section.id === activeItemId || section.id === activeSectionId ? "border-accent-default bg-surface-selected/60 text-accent-strong" : "border-transparent text-fg-secondary hover:border-line-strong hover:text-fg-primary"),
										children: section.label
									}), (section.items?.length ?? 0) > 0 ? /* @__PURE__ */ jsx("ul", {
										className: "ml-3 flex flex-col gap-px border-l border-line-subtle",
										children: section.items.map((item) => {
											const current = item.id === activeItemId;
											return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
												href: anchorHref(item.id),
												"data-outline-target-id": item.id,
												"aria-current": current ? "true" : void 0,
												"data-active": current ? "true" : void 0,
												onClick: (event) => {
													if (!isPlainLeftClick(event)) return;
													if (onSelectItem?.(item.id) === false) event.preventDefault();
												},
												className: cn("luc-focus -ml-px block border-l-2 py-0.5 pl-3 pr-2 text-micro transition-colors", current ? "border-accent-default bg-surface-selected font-medium text-accent-strong" : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg-secondary"),
												children: item.label
											}) }, item.id);
										})
									}) : null]
								}, section.id))
							}) : null
						]
					}, group.id);
				})
			}),
			footer ? /* @__PURE__ */ jsx("div", {
				className: "mt-3 border-t border-line-subtle pt-3",
				children: footer
			}) : null
		]
	});
}
/** Collapse/expand control a header can host when the drawer starts collapsed. */
function OutlineDrawerToggle({ open, onOpenChange, label }) {
	return /* @__PURE__ */ jsx(IconButton, {
		label,
		size: "sm",
		variant: "ghost",
		icon: open ? /* @__PURE__ */ jsx(RiArrowRightSLine, {}) : /* @__PURE__ */ jsx(RiArrowLeftSLine, {}),
		onClick: () => onOpenChange(!open)
	});
}
//#endregion
export { OutlineDrawer, OutlineDrawerToggle };

//# sourceMappingURL=outline-drawer.js.map