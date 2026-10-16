"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { cn } from "../utils/cn.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/motion/press-ripple.tsx
/**
* LUC PressRipple — tactile ink under the pointer.
*
* The Button family's second signature gesture (the first is the hover sheen).
* It exists because a press is the single most repeated interaction in any
* product, and a filled control that answers the finger reads as *material*
* rather than as a rectangle whose colour changed.
*
* Three rules keep it from becoming noise:
*
*  1. **Only press spawns it.** Never hover, never focus, never mount.
*  2. **It is derived from the pointer position**, so the ink originates where
*     the user actually touched, which is what makes it feel physical.
*  3. **Reduced motion removes it**, and `MotionIntensityProvider` can scope it
*     down to `functional` (forms, dense tables) without touching the call site.
*
* The hook never re-renders on pointer *move*; only on press and on each ring's
* expiry, so a button that is hovered 200 times per second costs nothing.
*/
function usePressRipple({ rings = 1, maxScale = 2.4, duration = 620, disabled = false } = {}) {
	const reduced = useReducedMotion();
	const [ripples, setRipples] = useState([]);
	const nextId = useRef(0);
	const timers = useRef([]);
	useEffect(() => () => {
		timers.current.forEach((timer) => window.clearTimeout(timer));
		timers.current = [];
	}, []);
	return {
		ripples,
		onPointerDown: useCallback((event) => {
			if (disabled || reduced) return;
			const rect = event.currentTarget.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height) * maxScale;
			const ringCount = Math.max(1, Math.round(rings));
			const spawned = [];
			for (let index = 0; index < ringCount; index += 1) {
				nextId.current += 1;
				spawned.push({
					id: nextId.current,
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
					size: size * (1 - index * .22)
				});
			}
			setRipples((current) => [...current, ...spawned]);
			const ids = new Set(spawned.map((ring) => ring.id));
			const timer = window.setTimeout(() => {
				setRipples((current) => current.filter((ring) => !ids.has(ring.id)));
			}, duration + 60);
			timers.current.push(timer);
		}, [
			disabled,
			duration,
			maxScale,
			reduced,
			rings
		])
	};
}
/**
* The visual half of `usePressRipple`.
*
* Render it as a child of a `relative isolate` surface. It sits at `-z-10`,
* which inside the surface's own stacking context paints *above* the surface
* background and *below* every piece of content — so no label needs to know the
* ripple exists, and no ripple can swallow a click.
*/
function RippleLayer({ ripples, duration = 620, color = "currentColor", className, style, ...props }) {
	return /* @__PURE__ */ jsx("span", {
		"aria-hidden": "true",
		"data-slot": "ripple-layer",
		className: cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[inherit]", className),
		style,
		...props,
		children: ripples.map((ring) => /* @__PURE__ */ jsx("span", {
			"data-slot": "ripple-ring",
			className: "luc-ripple absolute block rounded-full",
			style: {
				left: `${ring.x}px`,
				top: `${ring.y}px`,
				width: `${ring.size}px`,
				height: `${ring.size}px`,
				animationDuration: `${duration}ms`,
				background: `radial-gradient(circle, color-mix(in oklab, ${color} 34%, transparent) 0%, color-mix(in oklab, ${color} 16%, transparent) 46%, transparent 72%)`
			}
		}, ring.id))
	});
}
/**
* Convenience wrapper for surfaces that are not already a Button.
*
*   <PressRipple className="rounded-lg border p-4">…</PressRipple>
*
* Anything with a `border-radius` works: the layer inherits the radius, so a
* pill and a square panel both clip correctly without extra props.
*/
function PressRipple({ children, className, rings, maxScale, duration, color, disabled, onPointerDown, ...props }) {
	const ripple = usePressRipple({
		rings,
		maxScale,
		duration,
		disabled
	});
	return /* @__PURE__ */ jsxs("span", {
		"data-slot": "press-ripple",
		className: cn("relative isolate inline-flex", className),
		onPointerDown: (event) => {
			ripple.onPointerDown(event);
			onPointerDown?.(event);
		},
		...props,
		children: [children, /* @__PURE__ */ jsx(RippleLayer, {
			ripples: ripple.ripples,
			duration,
			color
		})]
	});
}
//#endregion
export { PressRipple, RippleLayer, usePressRipple };

//# sourceMappingURL=press-ripple.js.map