"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { pointer } from "./tokens.js";
import { usePointerMotion } from "../hooks/use-pointer-motion.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { motion, useMotionTemplate } from "motion/react";
//#region src/motion/glare-surface.tsx
/**
* LUC GlareSurface — a sheen that follows the pointer *on* the surface.
*
* Distinct from `SpotlightSurface`: a spotlight lights the surface under the
* content, a glare reads as reflection across it. Both are single composited
* layers with no per-frame React state, so neither can make a chart janky.
*/
function GlareSurface({ className, children, size = pointer.glareRadius, opacity = pointer.glareOpacity, tone = "light", softness = 72, ...props }) {
	const profile = useMotionProfile();
	const { ref, enabled, x, y, handlers } = usePointerMotion({ disabled: !profile.pointer });
	const tint = tone === "light" ? `oklch(1 0 0 / ${Math.min(.4, opacity * profile.glow).toFixed(3)})` : `color-mix(in oklab, var(--accent-default) ${Math.round(Math.min(.5, opacity * profile.glow) * 100)}%, transparent)`;
	const background = useMotionTemplate`radial-gradient(${size}px circle at calc(50% + ${x}px) calc(50% + ${y}px), ${tint}, transparent ${softness}%)`;
	if (!enabled) return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "glare-surface",
		"data-enabled": "false",
		className: cn("relative isolate min-w-0", className),
		...props,
		children: /* @__PURE__ */ jsx("div", {
			className: "relative z-10",
			children
		})
	});
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-slot": "glare-surface",
		"data-enabled": "true",
		className: cn("group/glare relative isolate min-w-0 overflow-hidden", className),
		...handlers,
		...props,
		children: [/* @__PURE__ */ jsx(motion.span, {
			"aria-hidden": "true",
			"data-slot": "glare-layer",
			className: "pointer-events-none absolute inset-0 z-0 opacity-0 mix-blend-soft-light [transition:opacity_var(--motion-normal)_var(--ease-standard)] group-hover/glare:opacity-100",
			style: {
				opacity: enabled ? void 0 : 0,
				background
			}
		}), /* @__PURE__ */ jsx("div", {
			className: "relative z-10",
			children
		})]
	});
}
//#endregion
export { GlareSurface };

//# sourceMappingURL=glare-surface.js.map