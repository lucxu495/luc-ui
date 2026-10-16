"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { duration } from "./tokens.js";
import { jsx } from "react/jsx-runtime";
import { AnimatePresence, motion } from "motion/react";
//#region src/motion/icon-morph.tsx
/**
* LUC IconMorph — one glyph dissolving into the next, in place.
*
* The state change is the *only* trigger, so this is exactly right for
* copy→check, star outline→filled, expand→collapse, sun↔moon. The box is sized
* by the caller's `size` (or inherits it), so swapping a 16px glyph for an 18px
* one never nudges the row.
*
* Reduced motion swaps instantly — no scale, no fade.
*/
function IconMorph({ className, state, icons, size, style, ...props }) {
	const reduced = useReducedMotion();
	const glyph = icons[state] ?? null;
	return /* @__PURE__ */ jsx("span", {
		"data-slot": "icon-morph",
		"data-state": state,
		className: cn("relative inline-grid place-items-center [&_svg]:size-full", className),
		style: {
			width: size,
			height: size,
			...style
		},
		...props,
		children: /* @__PURE__ */ jsx(AnimatePresence, {
			initial: false,
			mode: "popLayout",
			children: /* @__PURE__ */ jsx(motion.span, {
				className: "inline-grid place-items-center [&_svg]:size-full",
				initial: reduced ? false : {
					opacity: 0,
					scale: .6,
					rotate: -22
				},
				animate: {
					opacity: 1,
					scale: 1,
					rotate: 0
				},
				exit: reduced ? { opacity: 0 } : {
					opacity: 0,
					scale: .6,
					rotate: 22
				},
				transition: reduced ? { duration: 0 } : {
					duration: duration.fast,
					ease: [
						.16,
						1,
						.3,
						1
					]
				},
				children: glyph
			}, state)
		})
	});
}
//#endregion
export { IconMorph };

//# sourceMappingURL=icon-morph.js.map