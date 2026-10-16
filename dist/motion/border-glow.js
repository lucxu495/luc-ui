"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { useSpotlight } from "../hooks/use-spotlight.js";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/motion/border-glow.tsx
const intensityValue = {
	subtle: .55,
	normal: .85,
	strong: 1.15
};
const radiusClass = {
	md: "rounded-md",
	lg: "rounded-lg",
	xl: "rounded-xl",
	full: "rounded-full"
};
function BorderGlow({ className, children, intensity = "subtle", mode = "follow", selected = false, radius = "lg", speed = 5.5, ...props }) {
	const reducedMotion = useReducedMotion();
	const profile = useMotionProfile();
	const { ref, isActive, enabled, handlers } = useSpotlight({ prefix: "glow" });
	const travelling = mode === "travel" && !reducedMotion && profile.ambient;
	return /* @__PURE__ */ jsxs("div", {
		ref,
		"data-slot": "border-glow",
		"data-selected": selected || void 0,
		"data-active": isActive || void 0,
		className: cn("group/border-glow relative isolate", radiusClass[radius], "[--glow-strength:var(--effect-border-glow-strength)]", className),
		style: {
			"--glow-opacity": Math.min(1.25, (selected ? .9 : intensityValue[intensity]) * Math.max(profile.glow, .4)),
			"--glow-speed": `${speed}s`
		},
		...handlers,
		...props,
		children: [
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "border-glow-ring",
				className: cn("pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0", "[transition:opacity_var(--motion-normal)_var(--ease-standard)]", "group-hover/border-glow:opacity-100 group-focus-within/border-glow:opacity-100", "group-data-[selected]/border-glow:opacity-100", travelling && [
					"group-hover/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]",
					"group-focus-within/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]",
					"group-data-[selected]/border-glow:[animation:luc-glow-rotate_var(--glow-speed)_linear_infinite]"
				], "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]", "[mask-composite:exclude]"),
				style: {
					opacity: selected ? "var(--glow-opacity)" : void 0,
					background: travelling ? "conic-gradient(from var(--glow-angle,0deg), transparent 0%, color-mix(in oklab, var(--accent-default) 70%, transparent) 8%, transparent 22%, transparent 78%, color-mix(in oklab, var(--accent-default) 45%, transparent) 90%, transparent 100%)" : "conic-gradient(from 180deg, color-mix(in oklab, var(--accent-default) 62%, transparent) 0%, transparent 30%, transparent 70%, color-mix(in oklab, var(--accent-default) 40%, transparent) 100%)"
				}
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "border-glow-spot",
				className: cn("pointer-events-none absolute inset-0 rounded-[inherit] p-px opacity-0", "[transition:opacity_var(--motion-normal)_var(--ease-standard)]", "group-hover/border-glow:opacity-100", "[mask:linear-gradient(#000_0_0)_content-box,linear-gradient(#000_0_0)]", "[mask-composite:exclude]"),
				style: {
					background: "radial-gradient(180px circle at var(--glow-x, 50%) var(--glow-y, 0%), color-mix(in oklab, var(--accent-strong) 85%, transparent), transparent 65%)",
					opacity: enabled ? void 0 : 0
				}
			}),
			/* @__PURE__ */ jsx("span", {
				"aria-hidden": "true",
				"data-slot": "border-glow-bloom",
				className: cn("pointer-events-none absolute -inset-px -z-10 rounded-[inherit] opacity-0 blur-[6px]", "[transition:opacity_var(--motion-slow)_var(--ease-standard)]", "group-hover/border-glow:opacity-[0.32] group-focus-within/border-glow:opacity-[0.32]"),
				style: { background: "radial-gradient(240px circle at var(--glow-x, 50%) var(--glow-y, 50%), color-mix(in oklab, var(--accent-default) 40%, transparent), transparent 70%)" }
			}),
			/* @__PURE__ */ jsx("div", {
				className: "relative [border-radius:inherit]",
				children
			})
		]
	});
}
//#endregion
export { BorderGlow };

//# sourceMappingURL=border-glow.js.map