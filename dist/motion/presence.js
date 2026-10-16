"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { distance, duration, easing } from "./tokens.js";
import { jsx } from "react/jsx-runtime";
import { AnimatePresence, motion } from "motion/react";
//#region src/motion/presence.tsx
function FadeSwap({ className, slot, children, mode = "wait", distance: travel = distance.xs, ...props }) {
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "fade-swap",
		"data-slot-key": String(slot),
		className: cn("relative min-w-0", className),
		...props,
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			mode,
			initial: false,
			children: /* @__PURE__ */ jsx(motion.div, {
				initial: reduced ? false : {
					opacity: 0,
					y: travel
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: reduced ? { opacity: 0 } : {
					opacity: 0,
					y: -travel * .5
				},
				transition: reduced ? { duration: 0 } : {
					duration: duration.normal,
					ease: easing.enter
				},
				className: "min-w-0",
				children
			}, slot)
		})
	});
}
/**
* LUC Presence — mount/unmount with a fade instead of a hard cut.
*
* The primitive behind contextual panels (a filter bar that appears, a
* footnote that only exists when a value is stale). It animates *presence*,
* never layout of surrounding content beyond the flow change itself.
*/
function Presence({ className, present, children, ...props }) {
	const reduced = useReducedMotion();
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "presence",
		className,
		...props,
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			initial: false,
			children: present ? /* @__PURE__ */ jsx(motion.div, {
				initial: reduced ? false : {
					opacity: 0,
					y: distance.xs
				},
				animate: {
					opacity: 1,
					y: 0
				},
				exit: reduced ? { opacity: 0 } : {
					opacity: 0,
					y: -distance.xs
				},
				transition: reduced ? { duration: 0 } : {
					duration: duration.fast,
					ease: easing.enter
				},
				children
			}, "present") : null
		})
	});
}
//#endregion
export { FadeSwap, Presence };

//# sourceMappingURL=presence.js.map