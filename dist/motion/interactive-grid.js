"use client";
import { useSpotlight } from "../hooks/use-spotlight.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/interactive-grid.tsx
/**
* LUC InteractiveGrid — the research-grid atmosphere.
*
* A technical grid at low contrast that lights up *near the pointer*. The base
* grid and the reactive grid are the same CSS gradient twice; the top copy is
* masked to a radius around the cursor, so activation costs one composited layer
* and one rAF-throttled custom-property write — no React render, no canvas.
*
* Mount it as a background *behind* content (`absolute inset-0`, first child).
* It is inert on coarse pointers and under reduced motion, where the calm base
* grid simply stays put.
*/
function InteractiveGrid({ className, cell = 28, variant = "lines", radius = 220, drift = true, fade = true, interactive = true, ...props }) {
	const profile = useMotionProfile();
	const { ref, handlers, enabled } = useSpotlight({
		prefix: "grid",
		disabled: !interactive
	});
	const animate = drift && profile.ambient;
	const base = variant === "lines" ? "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)" : "radial-gradient(circle at 1px 1px, var(--grid-line) 1px, transparent 0)";
	const active = base.replaceAll("var(--grid-line)", "var(--grid-line-active)");
	const softMask = "radial-gradient(120% 90% at 50% 20%, #000 30%, transparent 78%)";
	const spotMask = "radial-gradient(var(--grid-radius) circle at var(--grid-x, 50%) var(--grid-y, 50%), #000 0%, transparent 70%)";
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"aria-hidden": "true",
		"data-slot": "interactive-grid",
		"data-variant": variant,
		"data-enabled": enabled ? "true" : "false",
		className: cn("absolute inset-0 overflow-hidden", className),
		style: {
			"--grid-cell": `${cell}px`,
			"--grid-radius": `${radius}px`,
			"--grid-line": "color-mix(in oklab, var(--line-default) 45%, transparent)",
			"--grid-line-active": "color-mix(in oklab, var(--accent-default) 60%, transparent)"
		},
		...handlers,
		...props,
		children: [/* @__PURE__ */ jsx("span", {
			"data-slot": "interactive-grid-base",
			className: cn("pointer-events-none absolute inset-0", animate && "motion-safe:animate-[luc-grid-drift_linear_infinite]"),
			style: {
				backgroundImage: base,
				backgroundSize: `${cell}px ${cell}px`,
				opacity: .45,
				maskImage: fade ? softMask : void 0,
				WebkitMaskImage: fade ? softMask : void 0,
				animationDuration: `${cell / 28 * 22}s`
			}
		}), /* @__PURE__ */ jsx("span", {
			"data-slot": "interactive-grid-active",
			className: "pointer-events-none absolute inset-0 [transition:opacity_var(--motion-slow)_var(--ease-standard)]",
			style: {
				backgroundImage: active,
				backgroundSize: `${cell}px ${cell}px`,
				opacity: enabled ? "var(--grid-active, 0)" : 0,
				maskImage: spotMask,
				WebkitMaskImage: spotMask
			}
		})]
	});
}
//#endregion
export { InteractiveGrid };

//# sourceMappingURL=interactive-grid.js.map