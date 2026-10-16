"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { usePersistentState } from "../hooks/use-persistent-state.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { Tooltip as Tooltip$1 } from "../components/tooltip.js";
import { isNavigationItemActive, isNavigationItemCurrent } from "./navigation.js";
import { NavigationLink, useNavigation } from "./navigation-context.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Collapsible } from "radix-ui";
import { createContext, useCallback, useContext, useEffect, useMemo } from "react";
import { RiArrowDownSLine, RiArrowRightSLine, RiSidebarFoldLine, RiSidebarUnfoldLine } from "@remixicon/react";
//#region src/app-shell/sidebar.tsx
const SidebarContext = createContext(null);
function useSidebar() {
	const context = useContext(SidebarContext);
	if (!context) throw new Error("useSidebar must be used inside <SidebarProvider> (or <AppShell>).");
	return context;
}
function SidebarProvider({ children, collapsed: collapsedProp, defaultCollapsed = false, onCollapsedChange, collapsible = true, persistKey, persistVersion = 1, storage, shortcut = true, mobileOpen: mobileOpenProp, defaultMobileOpen = false, onMobileOpenChange }) {
	const [persistedCollapsed, setPersistedCollapsed] = usePersistentState({
		key: persistKey ?? "luc-ui:sidebar",
		version: persistVersion,
		defaultValue: defaultCollapsed,
		storage: persistKey ? storage : void 0,
		decode: (raw) => typeof raw === "boolean" ? raw : void 0
	});
	const collapsed = collapsible ? collapsedProp ?? persistedCollapsed : false;
	const setCollapsed = useCallback((next) => {
		if (!collapsible) return;
		if (collapsedProp === void 0) setPersistedCollapsed(next);
		onCollapsedChange?.(next);
	}, [
		collapsedProp,
		collapsible,
		onCollapsedChange,
		setPersistedCollapsed
	]);
	const toggleCollapsed = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);
	const [mobileOpen, setMobileOpen] = useControllableState({
		value: mobileOpenProp,
		defaultValue: defaultMobileOpen,
		onChange: onMobileOpenChange
	});
	useEffect(() => {
		if (!collapsible || !shortcut) return;
		const onKeyDown = (event) => {
			if (event.key !== "b" && event.key !== "B") return;
			if (!event.metaKey && !event.ctrlKey) return;
			const target = event.target;
			if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
			event.preventDefault();
			toggleCollapsed();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [
		collapsible,
		shortcut,
		toggleCollapsed
	]);
	const value = useMemo(() => ({
		collapsed,
		setCollapsed,
		toggleCollapsed,
		collapsible,
		mobileOpen,
		setMobileOpen
	}), [
		collapsed,
		collapsible,
		mobileOpen,
		setCollapsed,
		setMobileOpen,
		toggleCollapsed
	]);
	return /* @__PURE__ */ jsx(SidebarContext.Provider, {
		value,
		children
	});
}
/** The sidebar column's contents. Its width and edge belong to `AppShell`. */
function Sidebar({ className, children, ...props }) {
	const { collapsed } = useSidebar();
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "sidebar",
		"data-state": collapsed ? "collapsed" : "expanded",
		className: cn("group/sidebar relative flex h-full min-h-0 flex-col gap-2", collapsed ? "px-2" : "px-3", className),
		...props,
		children
	});
}
function SidebarHeader({ className, ...props }) {
	const { collapsed } = useSidebar();
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "sidebar-header",
		className: cn("flex shrink-0 items-center gap-2", collapsed ? "justify-center" : "px-1", className),
		...props
	});
}
/**
* The scrolling navigation region — and the sidebar's single `<nav>` landmark.
* One named landmark per sidebar, so a screen-reader user can jump straight to
* it and hear which sidebar it is.
*/
function SidebarContent({ className, ariaLabel = "Sections", ...props }) {
	return /* @__PURE__ */ jsx("nav", {
		"aria-label": ariaLabel,
		"data-slot": "sidebar-content",
		className: cn("luc-table-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pb-4", className),
		...props
	});
}
function SidebarFooter({ className, ...props }) {
	const { collapsed } = useSidebar();
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "sidebar-footer",
		className: cn("mt-auto flex shrink-0 flex-col gap-2", collapsed ? "items-center" : void 0, className),
		...props
	});
}
/**
* One section of the sidebar: a heading and its rows.
*
* Two visual tiers, deliberately: the heading is a normal-case, heavier, brighter
* label, and the rows sit indented beneath it. The previous heading was 11px
* uppercase in a muted grey — *smaller* and quieter than the 13px links below it,
* so eight sections read as one long list of forty links. Hierarchy that a reader
* has to reconstruct from letter-spacing is not hierarchy.
*
* Collapsing is opt-in per group because it is only worth it on a long tree; the
* caller decides, from the length of the list it is rendering. The open state is
* held by Radix, which is what keeps this a disclosure rather than a second
* implementation of one — `aria-expanded`, `aria-controls`, the height animation
* hooks and the state attribute are all the library's.
*
* "Open when the current route moves inside it" is the caller's job, and it does
* it by remounting: the route-derived `defaultOpen` is part of the group's key in
* `components/shell/app-frame.tsx`, so entering a section unfolds it, and a
* reader's own fold survives navigation that does not change where they are.
*/
function SidebarGroup({ label, children, collapsible = false, defaultOpen = false, badge, className, ...props }) {
	const { collapsed } = useSidebar();
	const groupClass = cn("flex flex-col gap-1", className);
	if (!label || collapsed || !collapsible) return /* @__PURE__ */ jsxs("div", {
		"data-slot": "sidebar-group",
		className: groupClass,
		...props,
		children: [label ? /* @__PURE__ */ jsx(SidebarGroupLabel, { children: label }) : null, children]
	});
	return /* @__PURE__ */ jsxs(Collapsible.Root, {
		"data-slot": "sidebar-group",
		defaultOpen,
		className: cn("group/group", groupClass),
		...props,
		children: [/* @__PURE__ */ jsx(Collapsible.Trigger, {
			asChild: true,
			children: /* @__PURE__ */ jsxs("button", {
				type: "button",
				"data-slot": "sidebar-group-label",
				className: cn("luc-transition luc-focus flex h-7 w-full items-center gap-2 rounded-sm px-2 text-left", "text-label font-semibold text-fg-secondary", "hover:bg-surface-interactive-hover hover:text-fg-primary", "group-data-[state=open]/group:text-fg-primary"),
				children: [
					/* @__PURE__ */ jsx("span", {
						className: "min-w-0 flex-1 truncate",
						children: label
					}),
					badge ? /* @__PURE__ */ jsx("span", {
						className: "shrink-0 text-micro text-fg-muted",
						children: badge
					}) : null,
					/* @__PURE__ */ jsx(RiArrowDownSLine, {
						"aria-hidden": "true",
						className: cn("size-3.5 shrink-0 text-fg-muted luc-transition", "group-data-[state=closed]/group:-rotate-90")
					})
				]
			})
		}), /* @__PURE__ */ jsx(Collapsible.Content, {
			className: cn("overflow-hidden", "data-[state=open]:animate-[luc-collapsible-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-collapsible-out_var(--motion-fast)_var(--ease-exit)]"),
			children: /* @__PURE__ */ jsx("div", {
				className: "pl-2",
				children
			})
		})]
	});
}
/**
* The group heading.
*
* Normal case, at the same size as the rows and heavier than them — the two
* signals that survive being skimmed. The `data-slot` is the hook the browser
* gates read to check the hierarchy is really rendered.
*/
function SidebarGroupLabel({ className, children, ...props }) {
	const { collapsed } = useSidebar();
	if (collapsed) return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: cn("mt-1 h-px w-full bg-line-subtle", className)
	});
	return /* @__PURE__ */ jsx("p", {
		"data-slot": "sidebar-group-label",
		className: cn("flex h-7 items-center px-2 text-label font-semibold text-fg-secondary", className),
		...props,
		children: /* @__PURE__ */ jsx("span", {
			className: "min-w-0 flex-1 truncate",
			children
		})
	});
}
function SidebarMenu({ className, ...props }) {
	return /* @__PURE__ */ jsx("ul", {
		"data-slot": "sidebar-menu",
		className: cn("flex flex-col gap-px", className),
		...props
	});
}
const itemBase = "luc-transition luc-focus group/item relative flex h-8 w-full items-center gap-2.5 rounded-sm text-label text-left";
const itemIdle = "text-fg-secondary hover:bg-surface-interactive-hover hover:text-fg-primary";
const itemActive = "bg-surface-selected text-fg-primary";
/** The section an item belongs to is lit, but never filled: one selection only. */
const itemInSection = "text-fg-accent hover:bg-surface-interactive-hover";
const itemDisabled = "pointer-events-none text-fg-disabled";
/**
* Two states, one row:
*   current  → the page the reader is on (selected surface, accent edge, aria-current)
*   section  → an ancestor of that page (accent text only)
* Anything else is idle. Before this split a section and its detail page were
* both rendered as selected *and* both claimed `aria-current="page"`.
*/
function itemStateClass(isActive, isCurrentPage) {
	if (isCurrentPage) return itemActive;
	if (isActive) return itemInSection;
	return itemIdle;
}
function ActiveEdge() {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		className: "absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent-default motion-safe:animate-[luc-enter-fade_var(--motion-fast)_var(--ease-enter)]"
	});
}
function ItemRow({ label, icon, badge, isActive, collapsed }) {
	return /* @__PURE__ */ jsxs("span", {
		className: cn("relative flex size-full items-center", collapsed ? "justify-center" : "gap-2.5 px-2"),
		children: [
			isActive ? /* @__PURE__ */ jsx(ActiveEdge, {}) : null,
			icon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("grid size-4 shrink-0 place-items-center [&_svg]:size-4", isActive ? "text-fg-accent" : "text-fg-muted group-hover/item:text-fg-secondary"),
				children: icon
			}) : null,
			/* @__PURE__ */ jsx("span", {
				className: cn("min-w-0 flex-1 truncate text-left", collapsed && "sr-only"),
				children: label
			}),
			badge ? /* @__PURE__ */ jsx("span", {
				className: cn("shrink-0 text-micro text-fg-muted", collapsed && "absolute -top-0.5 -right-0.5 rounded-full border border-line-default bg-surface-raised px-1 py-px text-[9px] leading-none"),
				children: badge
			}) : null
		]
	});
}
function SidebarItem({ label, href, icon, badge, active, disabled = false, children, defaultOpen = false, onSelect, className, ...props }) {
	const { collapsed } = useSidebar();
	const navigation = useNavigation();
	const isActive = active ?? isNavigationItemActive(navigation.pathname, href);
	const isCurrentPage = active ?? isNavigationItemCurrent(navigation.pathname, href);
	if (children) return /* @__PURE__ */ jsx(SidebarSubmenu, {
		label,
		href,
		icon,
		badge,
		active: isActive,
		defaultOpen,
		className,
		...props,
		children
	});
	const row = /* @__PURE__ */ jsx(ItemRow, {
		label,
		icon,
		badge,
		isActive: isCurrentPage,
		collapsed
	});
	const content = disabled ? /* @__PURE__ */ jsx("span", {
		className: cn(itemBase, itemDisabled, collapsed && "justify-center"),
		"aria-disabled": "true",
		children: row
	}) : href ? /* @__PURE__ */ jsx(NavigationLink, {
		href,
		"aria-current": isCurrentPage ? "page" : void 0,
		onNavigate: onSelect,
		className: cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center"),
		children: row
	}) : /* @__PURE__ */ jsx("button", {
		type: "button",
		onClick: onSelect,
		"aria-current": isCurrentPage ? "page" : void 0,
		className: cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center"),
		children: row
	});
	return /* @__PURE__ */ jsx("li", {
		"data-slot": "sidebar-item",
		"data-active": isActive ? "true" : void 0,
		"data-current": isCurrentPage ? "true" : void 0,
		className,
		...props,
		children: collapsed ? /* @__PURE__ */ jsx(Tooltip$1, {
			content: label,
			side: "right",
			align: "center",
			children: content
		}) : content
	});
}
/**
* A parent item with nested children.
*
* Radix `Collapsible` owns `aria-expanded`/`aria-controls` and the height
* animation hooks, so this is composition rather than another disclosure
* implementation. In rail mode there is no room to expand inline, so the first
* click expands the sidebar and opens the tree — nested navigation stays
* reachable instead of becoming decorative.
*/
function SidebarSubmenu({ label, href, icon, badge, active, defaultOpen = false, className, children, ...props }) {
	const { collapsed, setCollapsed, collapsible } = useSidebar();
	const navigation = useNavigation();
	const isActive = active ?? isNavigationItemActive(navigation.pathname, href);
	const isCurrentPage = active ?? isNavigationItemCurrent(navigation.pathname, href);
	const [open, setOpen] = useControllableState({ defaultValue: defaultOpen || isActive });
	const handleTrigger = () => {
		if (collapsed && collapsible) setCollapsed(false);
		setOpen(!open);
	};
	const trigger = /* @__PURE__ */ jsx("button", {
		type: "button",
		"aria-current": isCurrentPage ? "page" : void 0,
		onClick: handleTrigger,
		className: cn(itemBase, itemStateClass(isActive, isCurrentPage), collapsed && "justify-center"),
		children: /* @__PURE__ */ jsxs("span", {
			className: cn("relative flex size-full items-center", collapsed ? "justify-center" : "gap-2.5 px-2"),
			children: [
				isCurrentPage ? /* @__PURE__ */ jsx(ActiveEdge, {}) : null,
				icon ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("grid size-4 shrink-0 place-items-center [&_svg]:size-4", isCurrentPage ? "text-fg-accent" : "text-fg-muted group-hover/item:text-fg-secondary"),
					children: icon
				}) : null,
				/* @__PURE__ */ jsx("span", {
					className: cn("min-w-0 flex-1 truncate text-left", collapsed && "sr-only"),
					children: label
				}),
				badge ? /* @__PURE__ */ jsx("span", {
					className: "shrink-0 text-micro text-fg-muted",
					children: badge
				}) : null,
				collapsed ? null : /* @__PURE__ */ jsx(RiArrowRightSLine, {
					"aria-hidden": "true",
					className: cn("size-4 shrink-0 text-fg-muted luc-transition", open && "rotate-90")
				})
			]
		})
	});
	return /* @__PURE__ */ jsx("li", {
		"data-slot": "sidebar-item",
		"data-active": isActive ? "true" : void 0,
		"data-current": isCurrentPage ? "true" : void 0,
		className,
		...props,
		children: /* @__PURE__ */ jsxs(Collapsible.Root, {
			open,
			onOpenChange: setOpen,
			children: [/* @__PURE__ */ jsx(Collapsible.Trigger, {
				asChild: true,
				children: trigger
			}), /* @__PURE__ */ jsx(Collapsible.Content, {
				className: cn("overflow-hidden", "data-[state=open]:animate-[luc-collapsible-in_var(--motion-normal)_var(--ease-enter)]", "data-[state=closed]:animate-[luc-collapsible-out_var(--motion-fast)_var(--ease-exit)]"),
				children: /* @__PURE__ */ jsxs("ul", {
					className: "relative mt-0.5 flex flex-col gap-px pl-4",
					children: [/* @__PURE__ */ jsx("span", {
						"aria-hidden": "true",
						className: "absolute inset-y-0.5 left-2 w-px bg-line-subtle"
					}), children]
				})
			})]
		})
	});
}
/**
* The thin edge strip that collapses the sidebar, like a rail you can push.
* It is a real button, so the action is in the tab order and announced.
*/
function SidebarRail({ className, expandLabel = "Expand sidebar", collapseLabel = "Collapse sidebar", ...props }) {
	const { collapsed, toggleCollapsed, collapsible } = useSidebar();
	if (!collapsible) return null;
	return /* @__PURE__ */ jsx("button", {
		type: "button",
		"data-slot": "sidebar-rail",
		"aria-label": collapsed ? expandLabel : collapseLabel,
		"aria-expanded": !collapsed,
		onClick: toggleCollapsed,
		className: cn("group/rail absolute inset-y-0 -right-3 z-[var(--z-raised)] flex w-6 cursor-col-resize items-center justify-center", "luc-focus", className),
		...props,
		children: /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: cn("h-10 w-px rounded-full bg-line-default luc-transition", "group-hover/rail:h-full group-hover/rail:bg-accent-default group-focus-visible/rail:bg-accent-default")
		})
	});
}
/** A labelled toggle for the topbar or the sidebar header. */
function SidebarToggle({ className, label, ...props }) {
	const { collapsed, toggleCollapsed, collapsible } = useSidebar();
	if (!collapsible) return null;
	return /* @__PURE__ */ jsx(IconButton, {
		variant: "ghost",
		size: "sm",
		label: label ?? (collapsed ? "Expand sidebar" : "Collapse sidebar"),
		onClick: toggleCollapsed,
		className,
		icon: collapsed ? /* @__PURE__ */ jsx(RiSidebarUnfoldLine, {}) : /* @__PURE__ */ jsx(RiSidebarFoldLine, {}),
		...props
	});
}
//#endregion
export { Sidebar, SidebarContent, SidebarContext, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem, SidebarMenu, SidebarProvider, SidebarRail, SidebarSubmenu, SidebarToggle, useSidebar };

//# sourceMappingURL=sidebar.js.map