"use client";
import { useSpotlight } from "../hooks/use-spotlight.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { surfaceResponse } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/motion-surface.tsx
const radiusClass = {
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl"
};
function MotionSurface({ className, children, hover = true, selected = false, highlight = false, spotlight = false, radius = "lg", as = "div", interactive = false, style, ...props }) {
	const profile = useMotionProfile();
	const tracking = spotlight && profile.pointer;
	const { ref, handlers, enabled } = useSpotlight({
		prefix: "surface",
		disabled: !tracking
	});
	const Component = as;
	const lift = surfaceResponse.hoverLift * profile.travel;
	return /* @__PURE__ */ jsxs(Component, {
		ref,
		"data-slot": "motion-surface",
		"data-selected": selected ? "true" : void 0,
		"data-interactive": interactive ? "true" : void 0,
		"data-spotlight": tracking ? "true" : void 0,
		className: cn("group/surface relative isolate min-w-0 overflow-hidden border border-line-subtle bg-surface-raised", radiusClass[radius], "motion-safe:transition-[transform,border-color,box-shadow,background-color]", "motion-safe:duration-[var(--motion-normal)] motion-safe:ease-[var(--ease-standard)]", hover && lift > 0 && "motion-safe:hover:-translate-y-[var(--surface-lift)] hover:border-line-default", hover && (highlight ? "hover:shadow-[var(--glow-accent)]" : "hover:shadow-md"), selected && "border-accent-default bg-surface-selected shadow-[var(--glow-subtle)]", className),
		...handlers,
		...props,
		style: {
			["--surface-lift"]: `${lift}px`,
			...style
		},
		children: [tracking ? /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			"data-slot": "motion-surface-glow",
			className: cn("pointer-events-none absolute inset-0 z-0 opacity-0", "[transition:opacity_var(--motion-normal)_var(--ease-standard)]", "group-hover/surface:opacity-100 group-focus-within/surface:opacity-100"),
			style: {
				opacity: enabled ? void 0 : 0,
				background: "radial-gradient(320px circle at var(--surface-x, 50%) var(--surface-y, 50%), color-mix(in oklab, var(--accent-default) calc(var(--effect-spotlight-strength) * 100% * var(--surface-glow, 1)), transparent), transparent 70%)",
				["--surface-glow"]: String(Math.max(profile.glow, .4))
			}
		}) : null, /* @__PURE__ */ jsx("div", {
			className: "relative z-10 min-w-0",
			children
		})]
	});
}
//#endregion
export { MotionSurface };

//# sourceMappingURL=motion-surface.js.map