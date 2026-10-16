"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { ambient } from "./tokens.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/border-trail.tsx
const radiusValue = {
	sm: 6,
	md: 8,
	lg: 10,
	xl: 12,
	full: 999
};
const defaultSpeed = {
	hover: ambient.trail,
	active: ambient.trail * 1.2,
	ambient: ambient.slowLoop,
	processing: 1.6
};
/**
* LUC BorderTrail — a bright segment travelling the perimeter of a surface.
*
* The mechanism is an SVG rounded rectangle with a normalised `pathLength`, so
* the dash geometry is correct for *any* size or radius the surface happens to
* have — no measuring, no re-layout, and no canvas. The loop is pure CSS, which
* means the global reduced-motion clamp freezes it into a static accent rather
* than leaving a beam stuck mid-sweep.
*
* Use it for one thing at a time: a primary CTA, an active signal, a featured
* research card, a processing state. An ambient trail on every card is noise.
*/
function BorderTrail({ className, children, variant = "hover", speed, length = 18, radius = "lg", color = "var(--accent-default)", track = false, thickness = 1.5, ...props }) {
	return /* @__PURE__ */ jsxs("div", {
		"data-slot": "border-trail",
		"data-variant": variant,
		className: cn("group/trail relative isolate min-w-0", className),
		...props,
		children: [/* @__PURE__ */ jsx(BorderTrailLayer, {
			variant,
			speed,
			length,
			radius,
			color,
			track,
			thickness,
			groupName: "trail"
		}), /* @__PURE__ */ jsx("div", {
			className: "contents",
			children
		})]
	});
}
/**
* The SVG half of BorderTrail, exported so a component that *is* the surface
* (Button, IconButton) can render the beam inside its own box instead of
* wrapping itself in an extra element.
*/
function BorderTrailLayer({ variant = "hover", speed, length = 18, radius = "lg", color = "var(--accent-default)", track = false, thickness = 1.5, groupName = "trail", active }) {
	const looping = useMotionProfile().ambient;
	const duration = speed ?? defaultSpeed[variant];
	const hoverDriven = variant === "hover" && active === void 0 && groupName !== null;
	return /* @__PURE__ */ jsxs("svg", {
		"aria-hidden": "true",
		"data-slot": "border-trail-svg",
		"data-active": active ?? !hoverDriven ? "true" : void 0,
		className: cn("pointer-events-none absolute z-10 size-full overflow-visible", hoverDriven && "opacity-0 [transition:opacity_var(--motion-normal)_var(--ease-standard)]", hoverDriven && groupName && `group-hover/${groupName}:opacity-100 group-focus-within/${groupName}:opacity-100`),
		style: { inset: thickness / 2 },
		children: [/* @__PURE__ */ jsx("rect", {
			width: "100%",
			height: "100%",
			rx: radiusValue[radius],
			fill: "none",
			stroke: track ? "color-mix(in oklab, var(--line-default) 70%, transparent)" : "transparent",
			strokeWidth: thickness
		}), /* @__PURE__ */ jsx("rect", {
			"data-slot": "border-trail-segment",
			width: "100%",
			height: "100%",
			rx: radiusValue[radius],
			fill: "none",
			stroke: color,
			strokeWidth: thickness,
			strokeLinecap: "round",
			pathLength: 100,
			strokeDasharray: `${length} ${100 - length}`,
			className: cn(hoverDriven && looping && groupName && `motion-safe:group-hover/${groupName}:[animation:luc-border-trail_var(--trail-duration)_linear_infinite] motion-safe:group-focus-within/${groupName}:[animation:luc-border-trail_var(--trail-duration)_linear_infinite]`),
			style: {
				["--trail-duration"]: `${duration}s`,
				animation: looping && !hoverDriven ? `luc-border-trail ${duration}s linear infinite` : void 0
			}
		})]
	});
}
//#endregion
export { BorderTrail, BorderTrailLayer };

//# sourceMappingURL=border-trail.js.map