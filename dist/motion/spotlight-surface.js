"use client";
import { useSpotlight } from "../hooks/use-spotlight.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/spotlight-surface.tsx
const radiusClass = {
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl"
};
const surfaceClass = {
	default: "bg-surface-default",
	raised: "bg-surface-raised",
	sunken: "bg-surface-sunken"
};
/**
* LUC SpotlightSurface.
*
* A surface that quietly acknowledges the pointer. The light layer sits above
* the surface colour but *below* the content, at single-digit alpha, so text and
* charts keep full contrast. `border` and `texture` add the two other readouts
* of the same pointer position — a lit edge and a faint technical grid — and all
* three are driven by the *same* two custom properties from one rAF-throttled
* tracker, so the cost is flat regardless of how many layers react.
*
* Disabled on touch devices and under `prefers-reduced-motion`, where the same
* calm surface renders with no listeners at all.
*/
function SpotlightSurface({ className, children, size = 320, tone = "accent", radius = "lg", surface = "default", border = false, texture = false, static: isStatic = false, ...props }) {
	const profile = useMotionProfile();
	const { ref, handlers, enabled } = useSpotlight({ disabled: isStatic || !profile.pointer });
	const strength = `calc(var(--spotlight-strength) * ${Math.max(profile.glow, .4).toFixed(2)})`;
	const brush = tone === "accent" ? `color-mix(in oklab, var(--accent-default) calc(${strength} * 100%), transparent)` : `color-mix(in oklab, var(--fg-primary) calc(${strength} * 60%), transparent)`;
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-slot": "spotlight-surface",
		className: cn("group/spotlight relative isolate overflow-hidden border border-line-subtle", radiusClass[radius], surfaceClass[surface], "[--spotlight-strength:var(--effect-spotlight-strength)]", className),
		...handlers,
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "spotlight-layer",
				className: cn("pointer-events-none absolute inset-0 z-0 opacity-0", "[transition:opacity_var(--motion-normal)_var(--ease-standard)]", "group-hover/spotlight:opacity-100"),
				style: {
					opacity: enabled ? void 0 : 0,
					background: `radial-gradient(circle var(--spotlight-size) at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${brush}, transparent 72%)`,
					["--spotlight-size"]: `${size}px`
				}
			}),
			texture ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "spotlight-texture",
				className: cn("pointer-events-none absolute inset-0 z-0 opacity-0", "[transition:opacity_var(--motion-slow)_var(--ease-standard)]", "group-hover/spotlight:opacity-100", enabled && "motion-safe:animate-[luc-grid-drift_linear_infinite]"),
				style: {
					opacity: enabled ? void 0 : 0,
					backgroundImage: "radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--accent-default) 40%, transparent) 1px, transparent 0)",
					backgroundSize: "18px 18px",
					animationDuration: "22s",
					maskImage: "radial-gradient(160px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), #000, transparent 72%)",
					WebkitMaskImage: "radial-gradient(160px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), #000, transparent 72%)"
				}
			}) : null,
			border ? /* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "spotlight-border",
				className: cn("pointer-events-none absolute inset-0 z-0 rounded-[inherit] p-px opacity-0", "[transition:opacity_var(--motion-normal)_var(--ease-standard)]", "group-hover/spotlight:opacity-100", "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]", "[mask-composite:exclude]"),
				style: {
					opacity: enabled ? void 0 : 0,
					background: `radial-gradient(200px circle at var(--spotlight-x, 50%) var(--spotlight-y, 0%), color-mix(in oklab, var(--accent-strong) 80%, transparent), transparent 65%)`
				}
			}) : null,
			/* @__PURE__ */ jsx("div", {
				className: "relative z-10",
				children
			})
		]
	});
}
//#endregion
export { SpotlightSurface };

//# sourceMappingURL=spotlight-surface.js.map