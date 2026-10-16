"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/aurora-surface.tsx
const densityFields = {
	quiet: 2,
	normal: 3,
	rich: 5
};
const surfaceClass = {
	canvas: "bg-surface-canvas",
	default: "bg-surface-default",
	raised: "bg-surface-raised",
	transparent: "bg-transparent"
};
/**
* LUC AuroraSurface — a living background for the one moment that should be
* remembered.
*
* A hero, an auth page, an empty state, a marketing header: places where the
* product is allowed to make an entrance. It is a *surface*, not a component
* library of its own — you put real content on top of it, and it gets out of
* the way.
*
* Design rules, learnt the hard way:
*
*  1. **The light is derived, never literal.** Every field is mixed from
*     `--accent-default` (plus one fixed hue rotation), so switching palette
*     re-tints the whole atmosphere instead of leaving a stranded cyan blob.
*  2. **Nothing above it is dimmed.** The fields are blurred *and* masked, and
*     each one peaks at low double-digit alpha, so a heading on top keeps
*     ≥ 4.5:1 in both themes.
*  3. **It is at most one gesture per page.** The drift is slow (≥ 14s), never
*     pulses, and never uses `filter` animation — only `transform`, which the
*     compositor can run off the main thread.
*  4. **Reduced motion keeps the composition and drops the drift**, so the page
*     looks designed rather than broken.
*/
function AuroraSurface({ className, children, tone = "duotone", density = "normal", speed = 22, grid = false, vignette = true, surface = "default", static: isStatic = false, ...props }) {
	const profile = useMotionProfile();
	const fields = Math.max(1, densityFields[density]);
	const drifting = !isStatic && profile.ambient;
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "aurora-surface",
		"data-density": density,
		className: cn("relative isolate overflow-hidden", surfaceClass[surface], className),
		...props,
		children: [/* @__PURE__ */ jsxs("div", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute inset-0 -z-10",
			children: [
				Array.from({ length: fields }, (_, index) => {
					const rotate = index % 2 === 1 && tone === "duotone" ? 48 : 0;
					const pigment = tone === "neutral" ? "var(--fg-muted)" : "var(--accent-default)";
					return /* @__PURE__ */ jsx("span", {
						"data-slot": "aurora-field",
						className: cn("absolute block rounded-full", drifting && "luc-aurora-drift"),
						style: {
							top: `${[
								-18,
								42,
								-30,
								66,
								8
							][index % 5]}%`,
							left: `${[
								-12,
								58,
								30,
								-20,
								74
							][index % 5]}%`,
							width: `${[
								46,
								38,
								54,
								34,
								42
							][index % 5]}%`,
							height: `${[
								58,
								46,
								40,
								62,
								50
							][index % 5]}%`,
							background: `radial-gradient(closest-side, color-mix(in oklab, ${pigment} ${tone === "neutral" ? 12 : 26}%, transparent), transparent)`,
							filter: `blur(${54 + index * 12}px) hue-rotate(${rotate}deg)`,
							opacity: drifting ? .9 : .75,
							animationDuration: `${speed + index * 3.5}s`,
							animationDelay: `${index * -4.5}s`,
							...index % 2 === 1 ? { animationDirection: "reverse" } : null
						}
					}, index);
				}),
				grid ? /* @__PURE__ */ jsx("span", {
					"data-slot": "aurora-grid",
					className: "absolute inset-0 opacity-[0.055] [mask-image:radial-gradient(120%_90%_at_50%_0%,black,transparent)]",
					style: {
						backgroundImage: "linear-gradient(to right, var(--line-strong) 1px, transparent 1px), linear-gradient(to bottom, var(--line-strong) 1px, transparent 1px)",
						backgroundSize: "var(--grid-cell, 32px) var(--grid-cell, 32px)"
					}
				}) : null,
				vignette ? /* @__PURE__ */ jsx("span", {
					"data-slot": "aurora-vignette",
					className: "absolute inset-0",
					style: { background: "radial-gradient(130% 100% at 50% 0%, transparent 30%, color-mix(in oklab, var(--surface-canvas) 88%, transparent) 100%)" }
				}) : null
			]
		}), /* @__PURE__ */ jsx("div", {
			className: "relative",
			children
		})]
	});
}
//#endregion
export { AuroraSurface };

//# sourceMappingURL=aurora-surface.js.map