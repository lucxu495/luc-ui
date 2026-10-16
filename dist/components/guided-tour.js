"use client";
import { cn } from "../utils/cn.js";
import { IconButton } from "./icon-button.js";
import { Button } from "./button-base.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { RiArrowLeftSLine, RiArrowRightSLine, RiCloseLine } from "@remixicon/react";
//#region src/components/guided-tour.tsx
const CARD_WIDTH = 320;
const GAP = 14;
function measure(step) {
	if (!step?.target || typeof document === "undefined") return null;
	const element = document.querySelector(step.target);
	if (!element) return null;
	const rect = element.getBoundingClientRect();
	const pad = step.padding ?? 8;
	return {
		top: rect.top - pad,
		left: rect.left - pad,
		width: rect.width + pad * 2,
		height: rect.height + pad * 2
	};
}
/** Place the card, flipping to the opposite side when there is no room. */
function place(rect, placement) {
	if (!rect || typeof window === "undefined") return {
		top: "50%",
		left: "50%",
		transform: "translate(-50%, -50%)"
	};
	const viewport = {
		w: window.innerWidth,
		h: window.innerHeight
	};
	const wants = placement;
	const fits = {
		bottom: rect.top + rect.height + GAP + 180 < viewport.h,
		top: rect.top - GAP - 180 > 0,
		right: rect.left + rect.width + GAP + CARD_WIDTH < viewport.w,
		left: rect.left - GAP - CARD_WIDTH > 0
	};
	switch ([
		wants,
		wants === "bottom" ? "top" : "bottom",
		"right",
		"left"
	].find((candidate) => fits[candidate]) ?? wants) {
		case "top": return {
			top: rect.top - GAP,
			left: rect.left + rect.width / 2,
			transform: "translate(-50%, -100%)"
		};
		case "right": return {
			top: rect.top + rect.height / 2,
			left: rect.left + rect.width + GAP,
			transform: "translate(0, -50%)"
		};
		case "left": return {
			top: rect.top + rect.height / 2,
			left: rect.left - GAP,
			transform: "translate(-100%, -50%)"
		};
		default: return {
			top: rect.top + rect.height + GAP,
			left: rect.left + rect.width / 2,
			transform: "translate(-50%, 0)"
		};
	}
}
function GuidedTour({ steps, open, onOpenChange, stepIndex, defaultStepIndex = 0, onStepChange, labels, className }) {
	const controlled = stepIndex !== void 0;
	const [internal, setInternal] = useState(defaultStepIndex);
	const index = Math.min(Math.max(controlled ? stepIndex : internal, 0), Math.max(steps.length - 1, 0));
	const step = steps[index];
	const [rect, setRect] = useState(null);
	const cardRef = useRef(null);
	const restoreRef = useRef(null);
	const titleId = useId();
	const descId = useId();
	const goTo = useCallback((next) => {
		const bounded = Math.min(Math.max(next, 0), steps.length - 1);
		if (!controlled) setInternal(bounded);
		onStepChange?.(bounded);
	}, [
		controlled,
		onStepChange,
		steps.length
	]);
	useEffect(() => {
		if (!open) return;
		const update = () => setRect(measure(steps[index]));
		update();
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		const timer = window.setTimeout(update, 120);
		return () => {
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
			window.clearTimeout(timer);
		};
	}, [
		index,
		open,
		steps
	]);
	useEffect(() => {
		if (!open) return;
		restoreRef.current = document.activeElement;
		cardRef.current?.focus();
		return () => {
			const previous = restoreRef.current;
			if (previous instanceof HTMLElement) previous.focus();
		};
	}, [open]);
	if (!open || !step) return null;
	const isLast = index === steps.length - 1;
	const position = place(rect, step.placement ?? "bottom");
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "guided-tour",
		className: cn("fixed inset-0 z-[var(--z-overlay)]", className),
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				tabIndex: -1,
				"aria-label": labels?.close ?? "Close tour",
				onClick: () => onOpenChange(false),
				className: "absolute inset-0 cursor-default",
				style: { boxShadow: "0 0 0 9999px var(--surface-scrim)" }
			}),
			/* @__PURE__ */ jsx("div", {
				"aria-hidden": "true",
				className: cn("pointer-events-none absolute rounded-lg ring-2 ring-line-accent", "[transition:top_var(--motion-normal)_var(--ease-emphasized),left_var(--motion-normal)_var(--ease-emphasized),width_var(--motion-normal)_var(--ease-emphasized),height_var(--motion-normal)_var(--ease-emphasized),opacity_var(--motion-fast)_var(--ease-standard)]"),
				style: rect ? {
					top: rect.top,
					left: rect.left,
					width: rect.width,
					height: rect.height
				} : {
					top: "50%",
					left: "50%",
					width: 0,
					height: 0
				}
			}),
			/* @__PURE__ */ jsxs("div", {
				ref: cardRef,
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": titleId,
				"aria-describedby": step.description ? descId : void 0,
				tabIndex: -1,
				onKeyDown: (event) => {
					if (event.key === "Escape") {
						event.preventDefault();
						onOpenChange(false);
					}
					if (event.key === "ArrowRight" && !isLast) goTo(index + 1);
					if (event.key === "ArrowLeft" && index > 0) goTo(index - 1);
					if (event.key === "Tab") {
						const focusables = cardRef.current?.querySelectorAll("button, [href], input, select, textarea");
						const first = focusables?.[0];
						const last = focusables?.[focusables.length - 1];
						if (!first || !last) return;
						if (event.shiftKey && document.activeElement === first) {
							event.preventDefault();
							last.focus();
						} else if (!event.shiftKey && document.activeElement === last) {
							event.preventDefault();
							first.focus();
						}
					}
				},
				style: {
					position: "fixed",
					width: CARD_WIDTH,
					...position
				},
				className: cn("luc-float-high flex flex-col gap-3 rounded-lg border border-line-subtle bg-surface-overlay p-4", "luc-settle focus:outline-none"),
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-start justify-between gap-3",
						children: [/* @__PURE__ */ jsxs("span", {
							className: "flex flex-col gap-1",
							children: [labels?.counter ? /* @__PURE__ */ jsx("span", {
								className: "text-micro text-fg-accent uppercase luc-numeric",
								children: labels.counter(index, steps.length)
							}) : null, /* @__PURE__ */ jsx("span", {
								id: titleId,
								className: "text-label font-medium text-fg-primary",
								children: step.title
							})]
						}), /* @__PURE__ */ jsx(IconButton, {
							variant: "ghost",
							size: "sm",
							label: labels?.close ?? "Close tour",
							icon: /* @__PURE__ */ jsx(RiCloseLine, {}),
							onClick: () => onOpenChange(false)
						})]
					}),
					step.description ? /* @__PURE__ */ jsx("p", {
						id: descId,
						className: "text-caption text-fg-secondary",
						children: step.description
					}) : null,
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center justify-between gap-2",
						children: [/* @__PURE__ */ jsx(Button, {
							type: "button",
							variant: "ghost",
							size: "sm",
							onClick: () => onOpenChange(false),
							children: labels?.skip ?? "Skip"
						}), /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "secondary",
								size: "sm",
								disabled: index === 0,
								onClick: () => goTo(index - 1),
								children: [/* @__PURE__ */ jsx(RiArrowLeftSLine, {
									"aria-hidden": "true",
									className: "size-4"
								}), labels?.previous ?? "Back"]
							}), /* @__PURE__ */ jsxs(Button, {
								type: "button",
								variant: "primary",
								size: "sm",
								onClick: () => isLast ? onOpenChange(false) : goTo(index + 1),
								children: [isLast ? labels?.done ?? "Done" : labels?.next ?? "Next", isLast ? null : /* @__PURE__ */ jsx(RiArrowRightSLine, {
									"aria-hidden": "true",
									className: "size-4"
								})]
							})]
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { GuidedTour };

//# sourceMappingURL=guided-tour.js.map