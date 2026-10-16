"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { depth, duration, easing } from "./tokens.js";
import { jsx } from "react/jsx-runtime";
import { AnimatePresence, motion } from "motion/react";
//#region src/motion/transition-panel.tsx
/**
* LUC TransitionPanel — a directional swap inside one fixed slot.
*
* `FadeSwap` is for a value that changed; `TransitionPanel` is for *navigating*
* between sibling views (a metric switching breakdown, a chart switching mode,
* a tab panel inside a card). The direction is explicit because only the caller
* knows whether the reader moved forward or back — guessing from index order
* breaks the moment panels are added or reordered.
*/
function TransitionPanel({ className, activeIndex, direction = 1, mode = "overlay", blur = true, children, ...props }) {
	const reduced = useReducedMotion();
	const travel = 14 * direction;
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "transition-panel",
		className: cn("relative min-w-0", className),
		...props,
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			mode: mode === "swap" ? "wait" : "popLayout",
			initial: false,
			custom: direction,
			children: /* @__PURE__ */ jsx(motion.div, {
				className: "min-w-0",
				custom: direction,
				initial: reduced ? false : {
					opacity: 0,
					x: travel,
					filter: blur ? `blur(${depth.enterBlur}px)` : "none"
				},
				animate: {
					opacity: 1,
					x: 0,
					filter: "blur(0px)"
				},
				exit: reduced ? { opacity: 0 } : {
					opacity: 0,
					x: -travel * .6,
					filter: blur ? `blur(${depth.exitBlur}px)` : "none"
				},
				transition: reduced ? { duration: 0 } : {
					duration: duration.slow,
					ease: easing.emphasized
				},
				children
			}, activeIndex)
		})
	});
}
//#endregion
export { TransitionPanel };

//# sourceMappingURL=transition-panel.js.map