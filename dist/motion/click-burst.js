"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
//#region src/motion/click-burst.tsx
/**
* LUC ClickBurst — a small, one-shot spark on a meaningful action.
*
* Not a confetti system and not a click effect for navigation: it is the
* punctuation for *completion* (copy, save, publish, favourite, export). The
* burst is spawned from the actual pointer position, lives for less than half a
* second, and is never rendered under reduced motion.
*/
function ClickBurst({ className, children, count = 7, color = "var(--accent-default)", spread = 26, length = 8, duration = 420, disabled = false, ...props }) {
	const reduced = useReducedMotion();
	const [bursts, setBursts] = useState([]);
	const nextId = useRef(0);
	const timers = useRef([]);
	const active = !reduced && !disabled;
	useEffect(() => () => {
		timers.current.forEach((timer) => window.clearTimeout(timer));
		timers.current = [];
	}, []);
	const fire = useCallback((event) => {
		if (!active) return;
		const rect = event.currentTarget.getBoundingClientRect();
		const id = nextId.current += 1;
		const rays = Array.from({ length: count }, (_, index) => {
			return {
				angle: index / count * Math.PI * 2 + Math.random() * .35,
				distance: spread * (.7 + Math.random() * .6)
			};
		});
		setBursts((current) => [...current.slice(-2), {
			id,
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
			rays
		}]);
		const timer = window.setTimeout(() => setBursts((current) => current.filter((burst) => burst.id !== id)), duration);
		timers.current.push(timer);
	}, [
		active,
		count,
		duration,
		spread
	]);
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "click-burst",
		className: cn("relative inline-flex min-w-0", className),
		onPointerDown: fire,
		...props,
		children: [children, /* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			className: "pointer-events-none absolute inset-0 overflow-visible",
			children: /* @__PURE__ */ jsx(AnimatePresence, { children: bursts.map((burst) => /* @__PURE__ */ jsx("span", {
				className: "absolute",
				style: {
					left: burst.x,
					top: burst.y
				},
				children: burst.rays.map((ray, index) => /* @__PURE__ */ jsx(motion.span, {
					className: "absolute block rounded-full",
					style: {
						width: length,
						height: 2,
						background: color,
						transformOrigin: "0% 50%"
					},
					initial: {
						opacity: .9,
						scaleX: 1,
						x: 0,
						y: 0,
						rotate: ray.angle * 180 / Math.PI
					},
					animate: {
						opacity: 0,
						scaleX: .3,
						x: Math.cos(ray.angle) * ray.distance,
						y: Math.sin(ray.angle) * ray.distance,
						rotate: ray.angle * 180 / Math.PI
					},
					exit: { opacity: 0 },
					transition: {
						duration: duration / 1e3,
						ease: [
							.16,
							1,
							.3,
							1
						]
					}
				}, index))
			}, burst.id)) })
		})]
	});
}
//#endregion
export { ClickBurst };

//# sourceMappingURL=click-burst.js.map