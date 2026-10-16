"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { surfaceResponse } from "./tokens.js";
import { jsx } from "react/jsx-runtime";
import { motion } from "motion/react";
//#region src/motion/pressable.tsx
const PRESSABLE_COMPONENTS = {
	div: motion.div,
	span: motion.span,
	li: motion.li,
	button: motion.button,
	a: motion.a,
	article: motion.article
};
/**
* LUC Pressable — the physical half of an interactive surface.
*
* Hover lifts and a press compresses, both spring-driven, both expressed in
* *fractions of the resolved intensity* rather than seconds. It is deliberately
* separate from `MotionSurface`: a surface decides how something looks, a
* Pressable decides how it responds to being touched. Compose them, or use the
* `interactive` variants of Card/Button/StatCard which do it for you.
*
* Reduced motion renders an inert element with the same DOM and semantics.
*/
function Pressable({ className, children, as = "div", href, lift = true, press = true, growOnHover = false, disabled = false, ...props }) {
	const reduced = useReducedMotion();
	const profile = useMotionProfile();
	const Component = PRESSABLE_COMPONENTS[as];
	if (reduced || profile.intensity === "none") return /* @__PURE__ */ jsx(as, {
		"data-slot": "pressable",
		"data-enabled": "false",
		className: cn("min-w-0", className),
		"aria-disabled": disabled || void 0,
		...as === "a" && href ? { href } : {},
		...props,
		children
	});
	const travel = profile.travel;
	return /* @__PURE__ */ jsx(Component, {
		"data-slot": "pressable",
		"data-enabled": "true",
		className: cn("min-w-0", className),
		"aria-disabled": disabled || void 0,
		...as === "a" && href ? { href } : {},
		whileHover: disabled ? void 0 : {
			y: lift ? -surfaceResponse.hoverLift * travel : 0,
			scale: growOnHover ? 1 + (surfaceResponse.hoverScale - 1) * travel : 1
		},
		whileTap: disabled || !press ? void 0 : { scale: 1 - (1 - surfaceResponse.pressScale) * travel },
		transition: {
			type: "spring",
			stiffness: 420,
			damping: 32,
			mass: .7
		},
		...props,
		children
	});
}
//#endregion
export { Pressable };

//# sourceMappingURL=pressable.js.map