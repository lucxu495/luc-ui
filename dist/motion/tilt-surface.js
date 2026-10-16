"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { pointer } from "./tokens.js";
import { usePointerMotion } from "../hooks/use-pointer-motion.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion, useMotionTemplate, useSpring, useTransform } from "motion/react";
//#region src/motion/tilt-surface.tsx
/**
* LUC TiltSurface — a surface that leans toward the pointer in 3D.
*
* Tilt is the loudest of the pointer effects, so it is never the default on a
* serious full-width chart; it belongs on research/asset/feature cards where a
* small lean adds depth without moving any data.
*
* Only `transform` is animated, the release is a spring back to rest, and the
* whole thing is silent on touch and under reduced motion — where the surface
* renders flat with no listeners at all.
*/
function TiltSurface({ className, children, max = pointer.tiltMaxAngle, perspective = pointer.tiltPerspective, glare = true, glareTone = "accent", preset = "soft", disabled = false, material = "solid", ...props }) {
	const profile = useMotionProfile();
	const { ref, enabled, px, py, x, y, handlers } = usePointerMotion({
		disabled: disabled || !profile.pointer,
		preset
	});
	const angle = max * Math.max(profile.depth, .4);
	const rotateX = useSpring(useTransform(() => -py.get() * angle * 2), {
		stiffness: 200,
		damping: 22
	});
	const rotateY = useSpring(useTransform(() => px.get() * angle * 2), {
		stiffness: 200,
		damping: 22
	});
	const glareRadius = pointer.glareRadius;
	const glareAlpha = .14 * profile.glow;
	const glareBackground = useMotionTemplate`radial-gradient(${glareRadius}px circle at calc(50% + ${x}px) calc(50% + ${y}px), ${glareTone === "light" ? `oklch(1 0 0 / ${glareAlpha.toFixed(3)})` : `color-mix(in oklab, var(--accent-default) ${Math.round(glareAlpha * 100)}%, transparent)`}, transparent 68%)`;
	if (!enabled) return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "tilt-surface",
		"data-enabled": "false",
		"data-material": material,
		className: cn("relative min-w-0", material === "glass" && "luc-glass", className),
		...props,
		children
	});
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "tilt-surface",
		"data-enabled": "true",
		"data-material": material,
		className: cn("group/tilt relative min-w-0 [transform-style:preserve-3d]", className),
		style: { perspective },
		...handlers,
		...props,
		children: /* @__PURE__ */ jsxs(motion.div, {
			"data-slot": "tilt-body",
			className: cn("relative [transform-style:preserve-3d]", material === "glass" && "luc-glass"),
			style: {
				rotateX,
				rotateY,
				transformPerspective: perspective
			},
			children: [children, glare ? /* @__PURE__ */ jsx(motion.span, {
				"aria-hidden": "true",
				"data-slot": "tilt-glare",
				className: "pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 [transition:opacity_var(--motion-normal)_var(--ease-standard)] group-hover/tilt:opacity-100",
				style: { background: glareBackground }
			}) : null]
		})
	});
}
//#endregion
export { TiltSurface };

//# sourceMappingURL=tilt-surface.js.map