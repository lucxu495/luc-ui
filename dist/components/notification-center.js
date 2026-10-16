"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { Text } from "../typography.js";
import { Badge } from "./badge.js";
import { PopoverContent, PopoverRoot, PopoverTrigger } from "./popover.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useMemo, useState } from "react";
import { RiBellLine, RiCheckDoubleLine, RiCloseLine } from "@remixicon/react";
//#region src/components/notification-center.tsx
const toneDot = {
	neutral: "bg-fg-muted",
	info: "bg-info",
	positive: "bg-positive",
	warning: "bg-warning",
	negative: "bg-negative"
};
function NotificationCenter({ items, onRead, onReadAll, onDismiss, onOpenItem, label = "Notifications", emptyTitle = "You are up to date", emptyDescription = "New notifications will appear here.", footer, className }) {
	const [open, setOpen] = useState(false);
	const headingId = useId();
	const unread = useMemo(() => items.filter((item) => !item.read).length, [items]);
	return /* @__PURE__ */ jsxs(PopoverRoot, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(PopoverTrigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				"aria-label": unread > 0 ? `${label}, ${unread} unread` : label,
				className: cn("luc-transition luc-focus relative inline-grid size-8 place-items-center rounded-md text-fg-secondary", "hover:bg-surface-interactive-hover hover:text-fg-primary", className),
				children: [/* @__PURE__ */ jsx(RiBellLine, {
					"aria-hidden": "true",
					className: "size-4"
				}), unread > 0 ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: "absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-accent-default px-1 text-[10px] leading-4 font-semibold text-fg-on-accent luc-numeric",
					children: unread > 99 ? "99+" : unread
				}) : null]
			})
		}), /* @__PURE__ */ jsxs(PopoverContent, {
			width: "md",
			align: "end",
			className: "flex max-h-[70vh] w-80 flex-col overflow-hidden p-0",
			children: [
				/* @__PURE__ */ jsxs("header", {
					className: "flex items-center justify-between gap-3 border-b border-line-subtle px-3.5 py-2.5",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 items-center gap-2",
						children: [/* @__PURE__ */ jsx("h2", {
							id: headingId,
							className: "text-label text-fg-primary",
							children: label
						}), unread > 0 ? /* @__PURE__ */ jsx(Badge, {
							tone: "accent",
							children: unread
						}) : null]
					}), unread > 0 && onReadAll ? /* @__PURE__ */ jsxs("button", {
						type: "button",
						onClick: onReadAll,
						className: "luc-transition luc-focus inline-flex items-center gap-1 rounded-sm px-1.5 py-1 text-caption text-fg-muted hover:bg-surface-interactive-hover hover:text-fg-primary",
						children: [/* @__PURE__ */ jsx(RiCheckDoubleLine, {
							"aria-hidden": "true",
							className: "size-3.5"
						}), "Mark all read"]
					}) : null]
				}),
				/* @__PURE__ */ jsx("ul", {
					"aria-labelledby": headingId,
					className: "flex min-h-0 flex-1 flex-col overflow-y-auto",
					children: items.length === 0 ? /* @__PURE__ */ jsxs("li", {
						className: "flex flex-col items-center gap-1 px-4 py-10 text-center",
						children: [
							/* @__PURE__ */ jsx("span", {
								"aria-hidden": "true",
								className: "grid size-9 place-items-center rounded-full bg-surface-interactive text-fg-muted",
								children: /* @__PURE__ */ jsx(RiCheckDoubleLine, { className: "size-4" })
							}),
							/* @__PURE__ */ jsx(Text, {
								variant: "label",
								className: "text-fg-primary",
								children: emptyTitle
							}),
							/* @__PURE__ */ jsx(Text, {
								variant: "caption",
								tone: "muted",
								children: emptyDescription
							})
						]
					}) : items.map((item) => {
						const Row = item.href ? "a" : "div";
						return /* @__PURE__ */ jsxs("li", {
							className: cn("group/notification relative border-b border-line-subtle last:border-b-0"),
							children: [/* @__PURE__ */ jsxs(Row, {
								...item.href ? { href: item.href } : {},
								onClick: () => {
									onOpenItem?.(item.id);
									if (!item.read) onRead?.(item.id);
								},
								onKeyDown: (event) => {
									if (!item.href && (event.key === "Enter" || event.key === " ")) {
										event.preventDefault();
										onOpenItem?.(item.id);
										if (!item.read) onRead?.(item.id);
									}
								},
								role: item.href ? void 0 : "button",
								tabIndex: item.href ? void 0 : 0,
								className: cn("luc-transition luc-focus-inset flex cursor-pointer gap-2.5 px-3.5 py-2.5 pr-9", "hover:bg-surface-interactive-hover", !item.read && "bg-surface-selected/40"),
								children: [/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: cn("mt-1 size-1.5 shrink-0 rounded-full", item.read ? "bg-transparent" : toneDot[item.tone ?? "neutral"])
								}), /* @__PURE__ */ jsxs("span", {
									className: "flex min-w-0 flex-1 flex-col gap-0.5",
									children: [/* @__PURE__ */ jsxs("span", {
										className: "flex items-baseline gap-2",
										children: [/* @__PURE__ */ jsx("span", {
											className: cn("min-w-0 flex-1 truncate text-label", item.read ? "text-fg-secondary" : "text-fg-primary"),
											children: item.title
										}), item.timestamp ? /* @__PURE__ */ jsx("span", {
											className: "shrink-0 text-micro text-fg-muted luc-numeric",
											children: item.timestamp
										}) : null]
									}), item.description ? /* @__PURE__ */ jsx("span", {
										className: "line-clamp-2 text-caption text-fg-muted",
										children: item.description
									}) : null]
								})]
							}), onDismiss ? /* @__PURE__ */ jsx(IconButton, {
								variant: "ghost",
								size: "sm",
								className: "absolute top-1.5 right-1.5 opacity-0 group-hover/notification:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100",
								label: `Dismiss ${typeof item.title === "string" ? item.title : label}`,
								icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
								onClick: () => onDismiss(item.id)
							}) : null]
						}, item.id);
					})
				}),
				footer ? /* @__PURE__ */ jsx("div", {
					className: "border-t border-line-subtle px-3.5 py-2",
					children: footer
				}) : null
			]
		})]
	});
}
//#endregion
export { NotificationCenter };

//# sourceMappingURL=notification-center.js.map