"use client";
import { cn } from "../utils/cn.js";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { RiCheckLine } from "@remixicon/react";
//#region src/components/stepper.tsx
function Stepper({ className, steps, current, onStepSelect, orientation = "horizontal", showNumbers = false, ...props }) {
	return /* @__PURE__ */ jsx("ol", {
		"data-slot": "stepper",
		"data-orientation": orientation,
		className: cn("flex", orientation === "horizontal" ? "flex-row items-start" : "flex-col", className),
		...props,
		children: steps.map((step, index) => {
			const done = step.complete ?? index < current;
			const active = index === current;
			const reachable = index <= current;
			const marker = /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				className: cn("grid size-7 shrink-0 place-items-center rounded-full border text-micro font-medium", "luc-transition luc-numeric", done && "border-line-accent bg-accent-soft text-fg-accent shadow-well", active && "border-line-accent bg-accent-default text-accent-on-accent shadow-rest", !done && !active && "border-line-default bg-surface-interactive text-fg-muted"),
				children: done && !showNumbers ? /* @__PURE__ */ jsx(RiCheckLine, { className: "size-3.5" }) : index + 1
			});
			const body = /* @__PURE__ */ jsxs(Fragment, { children: [marker, /* @__PURE__ */ jsxs("span", {
				className: "flex min-w-0 flex-col",
				children: [/* @__PURE__ */ jsx("span", {
					className: cn("text-label", active ? "font-medium text-fg-primary" : done ? "text-fg-secondary" : "text-fg-muted"),
					children: step.label
				}), step.description ? /* @__PURE__ */ jsx("span", {
					className: "text-micro text-fg-muted",
					children: step.description
				}) : null]
			})] });
			return /* @__PURE__ */ jsxs("li", {
				"data-slot": "stepper-step",
				"data-state": done ? "complete" : active ? "current" : "upcoming",
				"aria-current": active && !(reachable && onStepSelect) ? "step" : void 0,
				className: cn("flex gap-3", orientation === "horizontal" ? "flex-1 items-start" : "pb-5 last:pb-0"),
				children: [reachable && onStepSelect ? /* @__PURE__ */ jsx("button", {
					type: "button",
					"aria-current": active ? "step" : void 0,
					onClick: () => onStepSelect(index),
					className: cn("flex items-start gap-3 rounded-md p-1 text-left", "cursor-pointer luc-transition luc-focus luc-press", "hover:bg-surface-interactive-hover"),
					children: body
				}) : /* @__PURE__ */ jsx("span", {
					className: "flex items-start gap-3 p-1",
					children: body
				}), orientation === "horizontal" && index < steps.length - 1 ? /* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					className: cn("mt-4 h-px grow rounded-full luc-transition", done ? "bg-line-accent" : "bg-line-subtle")
				}) : null]
			}, step.id);
		})
	});
}
//#endregion
export { Stepper };

//# sourceMappingURL=stepper.js.map