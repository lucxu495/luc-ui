"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { pointer } from "./tokens.js";
import { usePointerMotion } from "../hooks/use-pointer-motion.js";
import { jsx } from "react/jsx-runtime";
import { motion, useTransform } from "motion/react";
//#region src/motion/magnetic.tsx
/** Soft radius falloff: full pull at the centre, none far away. */
function falloff(distance, radius) {
	return Math.max(0, 1 - distance / (radius + distance));
}
/**
* LUC Magnetic — a control that leans toward the pointer and springs home.
*
* The travel is hard-clamped so a magnetised button can never move far enough
* for the pointer to miss it, and the whole effect is inert on coarse pointers
* (there is no hover) and under reduced motion. When it is inert the component
* renders a plain wrapper with no listeners attached.
*/
function Magnetic({ className, children, strength = pointer.magneticStrength, radius = pointer.magneticRadius, childDepth = .55, preset = "responsive", disabled = false, ...props }) {
	const profile = useMotionProfile();
	const { ref, enabled, x, y, handlers } = usePointerMotion({
		disabled: disabled || !profile.pointer,
		preset
	});
	const maxTravel = 16 * Math.max(profile.depth, .35);
	const follow = strength * profile.depth;
	const clamp = (value) => Math.max(-maxTravel, Math.min(maxTravel, value));
	const apply = (value) => clamp(value * follow * falloff(Math.abs(value), radius));
	const bodyX = useTransform(() => apply(x.get()));
	const bodyY = useTransform(() => apply(y.get()));
	const childX = useTransform(() => apply(x.get()) * childDepth);
	const childY = useTransform(() => apply(y.get()) * childDepth);
	if (!enabled) return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "magnetic",
		"data-enabled": "false",
		className: cn("min-w-0", className),
		...props,
		children
	});
	return /* @__PURE__ */ jsx(motion.div, {
		ref,
		"data-slot": "magnetic",
		"data-enabled": "true",
		className: cn("min-w-0", className),
		style: {
			x: bodyX,
			y: bodyY
		},
		...handlers,
		...props,
		children: /* @__PURE__ */ jsx(motion.div, {
			"data-slot": "magnetic-child",
			style: {
				x: childX,
				y: childY
			},
			children
		})
	});
}
//#endregion
export { Magnetic };

//# sourceMappingURL=magnetic.js.map