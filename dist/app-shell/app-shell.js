"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { Sheet, SheetContent, SheetTitle } from "../components/sheet.js";
import { NavigationProvider } from "./navigation-context.js";
import { Sidebar, SidebarProvider, SidebarRail, useSidebar } from "./sidebar.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback } from "react";
import { RiMenuLine } from "@remixicon/react";
//#region src/app-shell/app-shell.tsx
function AppShell({ children, sidebar, topbar, statusBar, mobileNav, mobileNavTitle = "Navigation", sidebarColumn = true, sidebarCollapsed, defaultSidebarCollapsed = false, onSidebarCollapsedChange, collapsibleSidebar = true, sidebarPersistKey, sidebarPersistVersion = 1, storage, sidebarShortcut = true, renderLink, pathname, onNavigate, density = "comfortable", height = "viewport", contentId = "luc-content", className }) {
	return /* @__PURE__ */ jsx(SidebarProvider, {
		collapsed: sidebarCollapsed,
		defaultCollapsed: defaultSidebarCollapsed,
		onCollapsedChange: onSidebarCollapsedChange,
		collapsible: collapsibleSidebar,
		persistKey: sidebarPersistKey,
		persistVersion: sidebarPersistVersion,
		storage,
		shortcut: sidebarShortcut && collapsibleSidebar,
		children: /* @__PURE__ */ jsx(ShellChrome, {
			sidebar,
			topbar,
			statusBar,
			mobileNav,
			mobileNavTitle,
			sidebarColumn,
			renderLink,
			pathname,
			onNavigate,
			density,
			height,
			contentId,
			className,
			children
		})
	});
}
function ShellChrome({ children, sidebar, topbar, statusBar, mobileNav, mobileNavTitle, sidebarColumn = true, renderLink, pathname, onNavigate, density, height, contentId, className }) {
	const { setMobileOpen } = useSidebar();
	const handleNavigate = useCallback((href) => {
		setMobileOpen(false);
		onNavigate?.(href);
	}, [onNavigate, setMobileOpen]);
	return /* @__PURE__ */ jsx(NavigationProvider, {
		renderLink,
		pathname,
		onNavigate: handleNavigate,
		children: /* @__PURE__ */ jsxs("div", {
			"data-slot": "app-shell",
			"data-density": density === "compact" ? "compact" : void 0,
			"data-height": height,
			className: cn("flex w-full", height === "fill" ? "h-full min-h-0" : "min-h-dvh", className),
			children: [
				/* @__PURE__ */ jsx("a", {
					href: `#${contentId}`,
					className: cn("luc-focus sr-only focus:not-sr-only", "focus:fixed focus:top-3 focus:left-3 focus:z-[var(--z-tooltip)]", "focus:rounded-md focus:border focus:border-line-default focus:bg-surface-overlay", "focus:px-3 focus:py-2 focus:text-label focus:text-fg-primary focus:luc-float"),
					children: "Skip to content"
				}),
				sidebar && sidebarColumn ? /* @__PURE__ */ jsxs(AppShellSidebar, {
					className: height === "fill" ? "h-full" : void 0,
					children: [/* @__PURE__ */ jsx(Sidebar, { children: sidebar }), /* @__PURE__ */ jsx(SidebarRail, {})]
				}) : null,
				/* @__PURE__ */ jsxs("div", {
					className: "flex min-w-0 flex-1 flex-col",
					children: [
						topbar,
						/* @__PURE__ */ jsx("main", {
							id: contentId,
							className: "flex min-w-0 flex-1 flex-col",
							children
						}),
						statusBar
					]
				}),
				sidebar || mobileNav ? /* @__PURE__ */ jsx(AppShellMobileNav, {
					title: mobileNavTitle,
					children: mobileNav ?? sidebar
				}) : null
			]
		})
	});
}
/**
* The sidebar `aside`. Its width is a token, and its whole purpose is to be the
* one place that changes when the sidebar collapses.
*/
function AppShellSidebar({ className, children, ...props }) {
	const { collapsed, collapsible } = useSidebar();
	return /* @__PURE__ */ jsx("aside", {
		"data-slot": "app-shell-sidebar",
		"data-state": collapsed ? "collapsed" : "expanded",
		className: cn("sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line-subtle bg-surface-sunken lg:flex", "transition-[width] duration-[var(--motion-normal)] ease-[var(--ease-standard)] motion-reduce:transition-none", collapsed ? "w-[var(--shell-sidebar-rail-width)]" : "w-[var(--shell-sidebar-width)]", !collapsible && "[&_[data-slot=sidebar-rail]]:hidden", className),
		...props,
		children
	});
}
/**
* The sticky topbar region.
*
* Opaque on purpose: a translucent bar carrying text is the exact pattern
* DESIGN_SYSTEM.md forbids. The hairline underneath does the separation.
*/
function AppShellTopbar({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("header", {
		"data-slot": "app-shell-topbar",
		className: cn("sticky top-0 z-[var(--z-sticky)] flex h-[var(--shell-topbar-height)] shrink-0 items-center gap-2", "border-b border-line-subtle bg-surface-canvas px-3 sm:px-4", className),
		...props,
		children
	});
}
/** The standard page container. Padding and max width live here, once. */
function AppShellContent({ className, width = "content", ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "app-shell-content",
		className: cn("w-full", width === "content" && "mx-auto max-w-[var(--container-content)] px-4 py-6 sm:px-6", width === "prose" && "mx-auto max-w-[var(--container-prose)] px-4 py-6 sm:px-6", width === "bleed" && "flex min-h-0 flex-1 flex-col", className),
		...props
	});
}
/** Optional status strip for research and developer surfaces. */
function AppShellStatusBar({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "app-shell-status-bar",
		role: "region",
		tabIndex: 0,
		className: cn("flex h-[var(--shell-statusbar-height)] shrink-0 items-center gap-3 overflow-x-auto whitespace-nowrap", "border-t border-line-subtle bg-surface-sunken px-3 text-caption text-fg-muted", className),
		...props
	});
}
/** The mobile navigation trigger. Place it in the topbar; it hides at `lg`. */
function AppShellMobileTrigger({ className }) {
	const { mobileOpen, setMobileOpen } = useSidebar();
	return /* @__PURE__ */ jsx(IconButton, {
		label: "Open navigation",
		"aria-expanded": mobileOpen,
		icon: /* @__PURE__ */ jsx(RiMenuLine, {}),
		variant: "ghost",
		size: "sm",
		onClick: () => setMobileOpen(true),
		className: cn("lg:hidden", className)
	});
}
/**
* Off-canvas navigation.
*
* It is the existing LUC `Sheet` — Radix Dialog underneath — so focus trapping,
* focus restore, Escape and the scrim are the behaviour the system already
* ships. The nav inside runs in a non-collapsible `SidebarProvider`, because a
* drawer has no rail.
*/
function AppShellMobileNav({ children, title = "Navigation" }) {
	const { mobileOpen, setMobileOpen } = useSidebar();
	return /* @__PURE__ */ jsx(Sheet, {
		open: mobileOpen,
		onOpenChange: setMobileOpen,
		children: /* @__PURE__ */ jsxs(SheetContent, {
			side: "left",
			size: "sm",
			className: "p-0 lg:hidden",
			children: [/* @__PURE__ */ jsx(SheetTitle, {
				className: "sr-only",
				children: title
			}), /* @__PURE__ */ jsx("div", {
				className: "flex min-h-0 flex-1 flex-col py-4",
				children: /* @__PURE__ */ jsx(SidebarProvider, {
					collapsible: false,
					shortcut: false,
					children: /* @__PURE__ */ jsx(Sidebar, { children })
				})
			})]
		})
	});
}
//#endregion
export { AppShell, AppShellContent, AppShellMobileNav, AppShellMobileTrigger, AppShellSidebar, AppShellStatusBar, AppShellTopbar };

//# sourceMappingURL=app-shell.js.map