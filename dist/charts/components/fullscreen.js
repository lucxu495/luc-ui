"use client";
import { cn } from "../../utils/cn.js";
import { IconButton } from "../../components/icon-button.js";
import { MorphingDialog, MorphingDialogClose, MorphingDialogContent, MorphingDialogDescription, MorphingDialogTitle, MorphingDialogTrigger } from "../../motion/morphing-dialog.js";
import { FullscreenButton, RangeSelector, ScaleSelector } from "../chart-card.js";
import { ChartExportButton } from "./chart-toolbar.js";
import { maxInspectorSize, openingInspectorSize, resizeInspector, storeInspectorSize } from "../core/inspector-size.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { RiCloseLine } from "@remixicon/react";
//#region src/charts/components/fullscreen.tsx
/** How far one arrow key moves a handle, and how far Shift moves it. */
const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;
const RESIZE_HANDLES = [
	{
		id: "left",
		flipX: true,
		flipY: false,
		horizontal: true,
		vertical: false,
		decorative: false,
		orientation: "vertical",
		className: "left-0 inset-y-3 w-2.5 cursor-ew-resize"
	},
	{
		id: "right",
		flipX: false,
		flipY: false,
		horizontal: true,
		vertical: false,
		decorative: false,
		orientation: "vertical",
		className: "right-0 inset-y-3 w-2.5 cursor-ew-resize"
	},
	{
		id: "top",
		flipX: false,
		flipY: true,
		horizontal: false,
		vertical: true,
		decorative: false,
		orientation: "horizontal",
		className: "top-0 inset-x-3 h-2.5 cursor-ns-resize"
	},
	{
		id: "bottom",
		flipX: false,
		flipY: false,
		horizontal: false,
		vertical: true,
		decorative: false,
		orientation: "horizontal",
		className: "bottom-0 inset-x-3 h-2.5 cursor-ns-resize"
	},
	{
		id: "top-left",
		flipX: true,
		flipY: true,
		horizontal: true,
		vertical: true,
		decorative: true,
		orientation: "vertical",
		className: "top-0 left-0 size-4 cursor-nwse-resize"
	},
	{
		id: "top-right",
		flipX: false,
		flipY: true,
		horizontal: true,
		vertical: true,
		decorative: true,
		orientation: "vertical",
		className: "top-0 right-0 size-4 cursor-nesw-resize"
	},
	{
		id: "bottom-left",
		flipX: true,
		flipY: false,
		horizontal: true,
		vertical: true,
		decorative: true,
		orientation: "vertical",
		className: "bottom-0 left-0 size-4 cursor-nesw-resize"
	},
	{
		id: "bottom-right",
		flipX: false,
		flipY: false,
		horizontal: true,
		vertical: true,
		decorative: true,
		orientation: "vertical",
		className: "bottom-0 right-0 size-4 cursor-nwse-resize"
	}
];
function viewport() {
	if (typeof window === "undefined") return {
		width: 1440,
		height: 900
	};
	return {
		width: window.innerWidth,
		height: window.innerHeight
	};
}
function FullscreenResearchView({ open, onOpenChange, title, description, closeLabel = "Exit fullscreen", resizeLabels = {
	width: "Resize chart inspector width",
	height: "Resize chart inspector height"
}, returnFocusTo, metrics, renderChart, legend, ranges, range, onRangeChange, scale, actions, exportTarget, exportFilename }) {
	const previousFocus = useRef(null);
	useEffect(() => {
		if (open) {
			previousFocus.current = returnFocusTo?.current ?? (typeof document !== "undefined" ? document.activeElement : null);
			return;
		}
		const target = previousFocus.current;
		if (!target) return;
		previousFocus.current = null;
		const timer = window.setTimeout(() => {
			if (target.isConnected) target.focus();
		}, 0);
		return () => window.clearTimeout(timer);
	}, [open, returnFocusTo]);
	const [size, setSize] = useState(null);
	const sizeRef = useRef(null);
	const [resizing, setResizing] = useState(null);
	const applySize = useCallback((next) => {
		setSize(next);
	}, []);
	useEffect(() => {
		sizeRef.current = size;
	}, [size]);
	const [openedAt, setOpenedAt] = useState(false);
	if (open !== openedAt) {
		setOpenedAt(open);
		if (open) setSize(openingInspectorSize(viewport()));
	}
	useEffect(() => {
		if (!open) return;
		let frame = null;
		const reclamp = () => {
			if (frame !== null) return;
			frame = window.requestAnimationFrame(() => {
				frame = null;
				const current = sizeRef.current;
				if (!current) return;
				const bounded = maxInspectorSize(viewport());
				if (current.width <= bounded.width && current.height <= bounded.height) return;
				applySize({
					width: Math.min(current.width, bounded.width),
					height: Math.min(current.height, bounded.height)
				});
			});
		};
		window.addEventListener("resize", reclamp);
		return () => {
			window.removeEventListener("resize", reclamp);
			if (frame !== null) window.cancelAnimationFrame(frame);
		};
	}, [open, applySize]);
	/**
	* Start a pointer resize.
	*
	* Pointer events are captured on `window` (a drag ends wherever the pointer
	* is), the movement is coalesced to one frame, and the final size is persisted
	* once on release — a preference write per frame would be absurd.
	*/
	const startResize = useCallback((handle) => (event) => {
		if (event.button !== 0) return;
		event.preventDefault();
		const start = {
			x: event.clientX,
			y: event.clientY,
			size: sizeRef.current ?? openingInspectorSize(viewport())
		};
		setResizing(handle.id);
		let frame = null;
		let pending = {
			x: start.x,
			y: start.y
		};
		const flush = () => {
			frame = null;
			const dx = (pending.x - start.x) * (handle.flipX ? -1 : 1);
			const dy = (pending.y - start.y) * (handle.flipY ? -1 : 1);
			applySize(resizeInspector(start.size, {
				dx,
				dy,
				horizontal: handle.horizontal,
				vertical: handle.vertical
			}, viewport()));
		};
		const onMove = (move) => {
			pending = {
				x: move.clientX,
				y: move.clientY
			};
			if (frame !== null) return;
			frame = window.requestAnimationFrame(flush);
		};
		const onUp = () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("pointercancel", onUp);
			if (frame !== null) {
				window.cancelAnimationFrame(frame);
				frame = null;
				flush();
			}
			setResizing(null);
			if (sizeRef.current) storeInspectorSize(sizeRef.current);
		};
		window.addEventListener("pointermove", onMove);
		window.addEventListener("pointerup", onUp);
		window.addEventListener("pointercancel", onUp);
	}, [applySize]);
	/** The keyboard equivalent of an edge drag (corners are pointer-only). */
	const onHandleKeyDown = useCallback((handle) => (event) => {
		const step = event.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
		const dx = event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
		const dy = event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
		if (dx === 0 && dy === 0) return;
		if (!handle.horizontal && dx !== 0) return;
		if (!handle.vertical && dy !== 0) return;
		event.preventDefault();
		const current = sizeRef.current ?? openingInspectorSize(viewport());
		const next = resizeInspector(current, {
			dx: dx * (handle.flipX ? -1 : 1),
			dy: dy * (handle.flipY ? -1 : 1),
			horizontal: handle.horizontal,
			vertical: handle.vertical
		}, viewport());
		applySize(next);
		storeInspectorSize(next);
	}, [applySize]);
	const bounds = size ? maxInspectorSize(viewport()) : null;
	return /* @__PURE__ */ jsx(MorphingDialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ jsxs(MorphingDialogContent, {
			width: "none",
			panelSlot: "fullscreen-research-panel",
			panelStyle: size ? {
				width: size.width,
				height: size.height,
				maxWidth: bounds?.width,
				maxHeight: bounds?.height
			} : void 0,
			panelClassName: cn("relative flex flex-col gap-0 overflow-hidden p-0", !size && "h-[84dvh] w-[88vw] max-w-[1800px]"),
			"aria-label": typeof title === "string" ? `${title} fullscreen` : "Chart fullscreen",
			children: [
				RESIZE_HANDLES.map((handle) => /* @__PURE__ */ jsx("div", {
					"data-slot": "inspector-resize-handle",
					"data-handle": handle.id,
					"data-resizing": resizing === handle.id ? "true" : void 0,
					...handle.decorative ? { "aria-hidden": true } : {
						role: "separator",
						tabIndex: 0,
						"aria-label": handle.horizontal ? resizeLabels.width : resizeLabels.height,
						"aria-orientation": handle.orientation,
						"aria-valuenow": Math.round(handle.horizontal ? size?.width ?? 0 : size?.height ?? 0),
						"aria-valuemin": handle.horizontal ? 480 : 320,
						"aria-valuemax": Math.round(handle.horizontal ? bounds?.width ?? 0 : bounds?.height ?? 0),
						onKeyDown: onHandleKeyDown(handle)
					},
					onPointerDown: startResize(handle),
					className: cn("absolute z-10 touch-none select-none", handle.className, handle.decorative ? "opacity-0 active:opacity-100" : cn("rounded-full transition-colors", handle.horizontal ? "my-auto" : "mx-auto", "hover:bg-accent-default/25 focus-visible:bg-accent-default/40 focus-visible:outline-none", handle.orientation === "vertical" ? "bg-line-subtle/40" : "bg-line-subtle/40"))
				}, handle.id)),
				/* @__PURE__ */ jsxs("header", {
					className: "flex flex-wrap items-end justify-between gap-4 border-b border-line-subtle px-5 py-4",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex min-w-0 flex-col gap-1",
						children: [/* @__PURE__ */ jsx(MorphingDialogTitle, {
							className: "font-display text-heading-sm font-semibold tracking-[-0.018em] text-fg-primary",
							children: title
						}), description ? /* @__PURE__ */ jsx(MorphingDialogDescription, {
							className: "max-w-[70ch] text-caption text-fg-muted",
							children: description
						}) : null]
					}), /* @__PURE__ */ jsxs("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [metrics, /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5",
							children: [
								ranges && range !== void 0 && onRangeChange ? /* @__PURE__ */ jsx(RangeSelector, {
									ranges,
									value: range,
									onValueChange: onRangeChange
								}) : null,
								scale ? /* @__PURE__ */ jsx(ScaleSelector, {
									allowed: scale.allowed,
									value: scale.value,
									onValueChange: scale.onValueChange,
									labels: scale.labels
								}) : null,
								actions,
								exportTarget ? /* @__PURE__ */ jsx(ChartExportButton, {
									getTarget: exportTarget,
									filename: exportFilename ?? "luc-chart"
								}) : null,
								/* @__PURE__ */ jsx(MorphingDialogClose, {
									asChild: true,
									children: /* @__PURE__ */ jsx(IconButton, {
										label: closeLabel,
										variant: "ghost",
										size: "sm",
										icon: /* @__PURE__ */ jsx(RiCloseLine, {})
									})
								})
							]
						})]
					})]
				}),
				/* @__PURE__ */ jsx("div", {
					className: "min-h-0 flex-1 px-3 pt-3 pb-1",
					children: renderChart({
						height: "100%",
						fullscreen: true
					})
				}),
				legend ? /* @__PURE__ */ jsx("div", {
					className: "flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line-subtle px-5 py-3",
					children: legend
				}) : null
			]
		})
	});
}
/**
* Self-contained variant: renders the chart inline plus its fullscreen dialog.
* Use FullscreenResearchView when the page already owns the chart chrome and
* wants the trigger inside its own toolbar.
*/
function FullscreenChart({ renderTrigger, inline = true, inlineHeight = 380, className, ...view }) {
	const [open, setOpen] = useState(false);
	return /* @__PURE__ */ jsxs(Fragment, { children: [inline ? /* @__PURE__ */ jsx("div", {
		className: cn("flex min-h-0 w-full flex-col", className),
		style: { height: inlineHeight },
		children: view.renderChart({
			height: "100%",
			fullscreen: false
		})
	}) : null, /* @__PURE__ */ jsxs(MorphingDialog, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ jsx(MorphingDialogTrigger, {
			className: "inline-flex w-fit",
			children: renderTrigger ? renderTrigger() : /* @__PURE__ */ jsx(FullscreenButton, { onClick: () => setOpen(true) })
		}), /* @__PURE__ */ jsx(FullscreenResearchView, {
			open,
			onOpenChange: setOpen,
			...view
		})]
	})] });
}
//#endregion
export { FullscreenChart, FullscreenResearchView };

//# sourceMappingURL=fullscreen.js.map