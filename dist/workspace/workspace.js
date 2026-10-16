"use client";
import { useMediaQuery } from "../hooks/use-media-query.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { useWorkspaceLayout } from "./use-workspace-layout.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { Children, createContext, isValidElement, useCallback, useContext, useId, useMemo, useState } from "react";
import { RiContractLine, RiExpandDiagonalLine, RiRefreshLine } from "@remixicon/react";
import { Group, Panel, Separator } from "react-resizable-panels";
//#region src/workspace/workspace.tsx
const WorkspaceContext = createContext({
	mode: "panes",
	focusedId: null,
	setFocusedId: () => {},
	resizable: true
});
function useWorkspace() {
	return useContext(WorkspaceContext);
}
function Workspace({ className, mode: modeProp, focusedId: focusedIdProp, onFocusedIdChange, density = "comfortable", children, ...props }) {
	const wide = useMediaQuery("(min-width: 64rem)", true);
	const [internalFocus, setInternalFocus] = useState(null);
	const focusedId = focusedIdProp !== void 0 ? focusedIdProp : internalFocus;
	const setFocusedId = useCallback((next) => {
		if (focusedIdProp === void 0) setInternalFocus(next);
		onFocusedIdChange?.(next);
	}, [focusedIdProp, onFocusedIdChange]);
	const mode = modeProp ?? (wide ? "panes" : "stacked");
	const value = useMemo(() => ({
		mode,
		focusedId,
		setFocusedId,
		resizable: mode === "panes" && focusedId === null
	}), [
		focusedId,
		mode,
		setFocusedId
	]);
	return /* @__PURE__ */ jsx(WorkspaceContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "workspace",
			"data-mode": mode,
			"data-density": density === "compact" ? "compact" : void 0,
			className: cn("flex min-h-0 flex-col", className),
			...props,
			children
		})
	});
}
const WorkspaceGroupContext = createContext({
	resetLayout: () => {},
	persistenceEnabled: false,
	engine: false
});
function useWorkspaceGroup() {
	return useContext(WorkspaceGroupContext);
}
function WorkspaceGroup({ className, orientation = "horizontal", persistKey, persistVersion = 1, storage, defaultLayout, panelIds, locked = false, children, ...props }) {
	const { mode, focusedId } = useWorkspace();
	const autoId = useId();
	const groupId = persistKey ?? `luc-workspace-${autoId}`;
	const childIds = useMemo(() => {
		const ids = [];
		Children.forEach(children, (child) => {
			if (!isValidElement(child)) return;
			const id = child.props.id;
			if (typeof id === "string") ids.push(id);
		});
		return ids;
	}, [children]);
	const resolvedPanelIds = panelIds ?? childIds;
	const persistenceEnabled = Boolean(persistKey);
	const layout = useWorkspaceLayout({
		id: groupId,
		panelIds: resolvedPanelIds,
		version: persistVersion,
		storage,
		defaultLayout,
		persist: persistenceEnabled
	});
	const groupContext = useMemo(() => ({
		resetLayout: layout.resetLayout,
		persistenceEnabled,
		engine: true
	}), [layout.resetLayout, persistenceEnabled]);
	const blockContext = useMemo(() => ({
		resetLayout: layout.resetLayout,
		persistenceEnabled,
		engine: false
	}), [layout.resetLayout, persistenceEnabled]);
	if (focusedId !== null && resolvedPanelIds.includes(focusedId)) return /* @__PURE__ */ jsx(WorkspaceGroupContext.Provider, {
		value: blockContext,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "workspace-group",
			"data-orientation": orientation,
			"data-focus": "true",
			className: cn("flex min-h-0 flex-1 flex-col", className),
			...props,
			children: Children.map(children, (child) => {
				if (!isValidElement(child)) return null;
				return child.props.id === focusedId ? child : null;
			})
		})
	});
	if (mode === "stacked") return /* @__PURE__ */ jsx(WorkspaceGroupContext.Provider, {
		value: blockContext,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "workspace-group",
			"data-orientation": orientation,
			"data-stacked": "true",
			className: cn("flex min-h-0 flex-1 flex-col", className),
			...props,
			children
		})
	});
	return /* @__PURE__ */ jsx(WorkspaceGroupContext.Provider, {
		value: groupContext,
		children: /* @__PURE__ */ jsx(Group, {
			id: groupId,
			orientation,
			defaultLayout: layout.defaultLayout,
			onLayoutChanged: layout.onLayoutChanged,
			disabled: locked,
			groupRef: layout.groupRef,
			"data-slot": "workspace-group",
			"data-orientation": orientation,
			className: cn("min-h-0", className),
			...props,
			children
		}, layout.epoch)
	});
}
/**
* One resizable pane.
*
* It renders the engine's Panel directly, without a wrapper element, because
* the engine requires its children to be its own direct DOM children and sets
* the flex geometry inline.
*/
function WorkspacePane({ id, defaultSize, minSize = "12rem", maxSize, collapsible = false, collapsedSize = "0%", hideOnStacked = false, panelRef, onSizeChange, className, children, ...props }) {
	const { mode, focusedId, setFocusedId } = useWorkspace();
	const group = useWorkspaceGroup();
	const focused = focusedId === id;
	if (mode === "stacked" || !group.engine) {
		if (hideOnStacked) return null;
		return /* @__PURE__ */ jsx("div", {
			"data-slot": "workspace-pane",
			"data-pane-id": id,
			"data-focused": focused ? "true" : void 0,
			className: cn("flex min-h-0 flex-1 flex-col overflow-hidden", className),
			...props,
			children
		});
	}
	const handleResize = (size) => {
		onSizeChange?.(size.asPercentage === 0);
		if (focused) setFocusedId(null);
	};
	return /* @__PURE__ */ jsx(Panel, {
		id,
		defaultSize,
		minSize,
		maxSize,
		collapsible,
		collapsedSize,
		panelRef,
		"data-slot": "workspace-pane",
		"data-pane-id": id,
		"data-focused": focused ? "true" : void 0,
		className: cn("flex min-h-0 flex-col overflow-hidden", className),
		onResize: handleResize,
		children
	});
}
/**
* The drag target between two panes.
*
* The visible rule is a hairline; the hit area is wide enough to grab. The
* engine supplies the separator role, the aria values and arrow-key resizing,
* and marks its state as `data-separator` = active, focus or inactive. The
* classes below read that attribute instead of inventing a second state machine.
*/
function WorkspaceResizeHandle({ className, label = "Resize panes", ...props }) {
	const { mode } = useWorkspace();
	if (mode !== "panes") return null;
	return /* @__PURE__ */ jsx(Separator, {
		"aria-label": label,
		"data-slot": "workspace-handle",
		className: cn("group/handle relative flex items-center justify-center luc-focus", "aria-[orientation=vertical]:w-[var(--workspace-handle-hit-size)] aria-[orientation=vertical]:cursor-col-resize", "aria-[orientation=horizontal]:h-[var(--workspace-handle-hit-size)] aria-[orientation=horizontal]:cursor-row-resize", className),
		...props,
		children: /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: cn("rounded-full bg-line-subtle luc-transition", "group-aria-[orientation=vertical]/handle:h-10 group-aria-[orientation=vertical]/handle:w-[var(--workspace-handle-size)]", "group-aria-[orientation=horizontal]/handle:h-[var(--workspace-handle-size)] group-aria-[orientation=horizontal]/handle:w-10", "group-hover/handle:bg-line-strong", "group-data-[separator=active]/handle:bg-accent-default", "group-data-[separator=focus]/handle:bg-accent-default")
		})
	});
}
/** The persistent strip at the top of a pane. */
function WorkspacePaneHeader({ title, description, icon, actions, paneId, showReset = false, className, children, ...props }) {
	const { focusedId, setFocusedId, mode } = useWorkspace();
	const group = useWorkspaceGroup();
	const focused = paneId !== void 0 && focusedId === paneId;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "workspace-pane-header",
		className: cn("flex shrink-0 items-center gap-3 border-b border-line-subtle px-3 py-2", className),
		...props,
		children: [
			icon ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: "grid size-6 shrink-0 place-items-center text-fg-muted [&_svg]:size-3.5",
				children: icon
			}) : null,
			/* @__PURE__ */ jsxs("div", {
				className: "flex min-w-0 flex-1 flex-col",
				children: [/* @__PURE__ */ jsx("p", {
					className: "truncate text-label text-fg-primary",
					children: title
				}), description ? /* @__PURE__ */ jsx("p", {
					className: "truncate text-caption text-fg-muted",
					children: description
				}) : null]
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex shrink-0 items-center gap-0.5",
				children: [
					children,
					showReset && group.persistenceEnabled ? /* @__PURE__ */ jsx(IconButton, {
						label: "Reset pane sizes",
						size: "sm",
						variant: "ghost",
						icon: /* @__PURE__ */ jsx(RiRefreshLine, {}),
						onClick: group.resetLayout
					}) : null,
					mode === "panes" && paneId ? /* @__PURE__ */ jsx(IconButton, {
						label: focused ? "Exit focus mode" : "Focus this pane",
						size: "sm",
						variant: "ghost",
						"aria-pressed": focused,
						icon: focused ? /* @__PURE__ */ jsx(RiContractLine, {}) : /* @__PURE__ */ jsx(RiExpandDiagonalLine, {}),
						onClick: () => setFocusedId(focused ? null : paneId)
					}) : null,
					actions
				]
			})
		]
	});
}
/**
* The scrolling region of a pane. Header and footer stay put.
*
* It is focusable on purpose: a scroll region that cannot be reached by
* keyboard is a defect, and a pane's content can be taller than its box. Give
* it an `ariaLabel` when it is a named region rather than the pane's only body.
*/
function WorkspacePaneBody({ className, flush = false, ariaLabel, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "workspace-pane-body",
		tabIndex: 0,
		role: ariaLabel ? "region" : void 0,
		"aria-label": ariaLabel,
		className: cn("luc-table-scroll min-h-0 flex-1 overflow-auto overscroll-contain luc-focus", !flush && "p-3", className),
		...props
	});
}
/** A pane's footer row. Opaque, because it sits over scrolling content. */
function WorkspacePaneFooter({ className, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "workspace-pane-footer",
		className: cn("flex shrink-0 items-center gap-2 border-t border-line-subtle bg-surface-raised px-3 py-2 text-caption text-fg-muted", className),
		...props
	});
}
/** A quiet banner shown while a pane is in focus mode, so Escape has a target. */
function WorkspaceFocusBanner({ label = "Focus mode" }) {
	const { focusedId, setFocusedId } = useWorkspace();
	if (!focusedId) return null;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "workspace-focus-banner",
		className: "flex shrink-0 items-center justify-between gap-3 border-b border-line-subtle bg-accent-soft px-3 py-1.5 text-caption text-fg-secondary",
		children: [/* @__PURE__ */ jsx("span", { children: label }), /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: () => setFocusedId(null),
			className: "luc-focus rounded-xs px-1.5 py-0.5 text-caption text-fg-accent hover:bg-accent-soft-hover",
			children: "Exit (Esc)"
		})]
	});
}
//#endregion
export { Workspace, WorkspaceFocusBanner, WorkspaceGroup, WorkspacePane, WorkspacePaneBody, WorkspacePaneFooter, WorkspacePaneHeader, WorkspaceResizeHandle, useWorkspace, useWorkspaceGroup };

//# sourceMappingURL=workspace.js.map