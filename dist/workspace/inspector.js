"use client";
import { useControllableState } from "../hooks/use-controllable-state.js";
import { cn } from "../utils/cn.js";
import { IconButton } from "../components/icon-button.js";
import { Skeleton } from "../components/skeleton.js";
import { WorkspacePane, WorkspacePaneHeader } from "./workspace.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import { usePanelRef } from "react-resizable-panels";
//#region src/workspace/inspector.tsx
function InspectorPane({ id, open: openProp, defaultOpen = true, onOpenChange, title = "Inspector", description, actions, footer, side = "end", minSize = "18rem", defaultSize = "22rem", className, children, ...props }) {
	const panelRef = usePanelRef();
	const [open, setOpen] = useControllableState({
		value: openProp,
		defaultValue: defaultOpen,
		onChange: onOpenChange
	});
	useEffect(() => {
		const handle = panelRef.current;
		if (!handle) return;
		if (open) handle.expand();
		else handle.collapse();
	}, [open, panelRef]);
	return /* @__PURE__ */ jsxs(WorkspacePane, {
		id,
		minSize,
		defaultSize,
		collapsible: true,
		collapsedSize: "0%",
		panelRef,
		onSizeChange: (collapsed) => {
			if (collapsed === open) return;
			setOpen(!collapsed);
		},
		className: cn("bg-surface-default", side === "start" ? "border-r" : "border-l", "border-line-subtle", className),
		...props,
		children: [
			/* @__PURE__ */ jsx(WorkspacePaneHeader, {
				"data-slot": "inspector-header",
				title,
				description,
				paneId: id,
				actions: /* @__PURE__ */ jsxs(Fragment, { children: [actions, /* @__PURE__ */ jsx(IconButton, {
					label: "Collapse inspector",
					size: "sm",
					variant: "ghost",
					icon: side === "start" ? /* @__PURE__ */ jsx(RiArrowLeftSLine, {}) : /* @__PURE__ */ jsx(RiArrowRightSLine, {}),
					onClick: () => setOpen(false)
				})] })
			}),
			/* @__PURE__ */ jsx("div", {
				"data-slot": "inspector-body",
				className: "luc-table-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 text-body text-fg-secondary",
				children
			}),
			footer ? /* @__PURE__ */ jsx("div", {
				className: "flex shrink-0 items-center gap-2 border-t border-line-subtle bg-surface-raised px-3 py-2",
				children: footer
			}) : null
		]
	});
}
/**
* The control that reopens a collapsed inspector.
*
* A collapsed pane has no header, so the way back has to live somewhere the
* reader can still reach — usually the main pane's header or the topbar.
*/
function InspectorToggle({ open, onOpenChange, label, className }) {
	return /* @__PURE__ */ jsx(IconButton, {
		label: label ?? (open ? "Hide inspector" : "Show inspector"),
		size: "sm",
		variant: open ? "ghost" : "solid",
		"aria-pressed": open,
		className,
		icon: open ? /* @__PURE__ */ jsx(RiArrowRightSLine, {}) : /* @__PURE__ */ jsx(RiArrowLeftSLine, {}),
		onClick: () => onOpenChange(!open)
	});
}
/** A titled block inside the inspector. */
function InspectorSection({ label, className, children, ...props }) {
	return /* @__PURE__ */ jsxs("section", {
		"data-slot": "inspector-section",
		className: cn("flex flex-col gap-2", className),
		...props,
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-micro text-fg-muted uppercase",
			children: label
		}), children]
	});
}
/** One label/value pair. Numeric values never jitter. */
function InspectorRow({ label, value, numeric = false, className, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		className: cn("flex items-baseline justify-between gap-4 text-label", className),
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			className: "text-fg-muted",
			children: label
		}), /* @__PURE__ */ jsx("span", {
			className: cn("text-fg-primary", numeric && "luc-numeric"),
			children: value
		})]
	});
}
/** Placeholder for an inspector that is still resolving its subject. */
function InspectorSkeleton() {
	return /* @__PURE__ */ jsxs("div", {
		className: "flex flex-col gap-4",
		"aria-busy": "true",
		"aria-live": "polite",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Loading details"
			}),
			/* @__PURE__ */ jsx(Skeleton, {
				variant: "text",
				className: "w-24"
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "flex flex-col gap-2",
				children: [
					/* @__PURE__ */ jsx(Skeleton, { variant: "text" }),
					/* @__PURE__ */ jsx(Skeleton, { variant: "text" }),
					/* @__PURE__ */ jsx(Skeleton, {
						variant: "text",
						className: "w-2/3"
					})
				]
			})
		]
	});
}
//#endregion
export { InspectorPane, InspectorRow, InspectorSection, InspectorSkeleton, InspectorToggle };

//# sourceMappingURL=inspector.js.map