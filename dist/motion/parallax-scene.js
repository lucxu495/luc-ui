"use client";
import { cn } from "../utils/cn.js";
import { pointer } from "./tokens.js";
import { useParallax } from "../hooks/use-parallax.js";
import { jsx } from "react/jsx-runtime";
//#region src/motion/parallax-scene.tsx
/**
* LUC `ParallaxScene` — a container that gives its children real depth.
*
* Depth here is a *coordinate system*, not an effect: the scene publishes one
* pointer offset as custom properties, and each `ParallaxLayer` inside decides
* how much of it to take. A background washes slowly, a mid-ground panel moves
* a little, a foreground badge moves against the pointer — all from one rAF
* loop and zero React renders (see `useParallax`).
*
* Rules that keep it honest:
*
*  1. **Content does not move.** Text sits in a layer at depth `0` (or outside
*     the scene) so nothing readable ever shifts under a pointer.
*  2. **The scene still composes at rest.** Layers are separated by `translateZ`
*     as well as by travel, so the flat frame is deliberate, not degenerate —
*     which is exactly what touch devices, reduced motion and print receive.
*  3. **Nothing listens on touch.** The tracker is off on coarse pointers, so a
*     phone pays for one gradient and no event handlers.
*/
function ParallaxScene({ className, children, depth = pointer.parallaxDepth, perspective = pointer.tiltPerspective, tilt = 4, disabled = false, style, ...props }) {
	const { ref, enabled, handlers } = useParallax({
		depth,
		tilt,
		disabled
	});
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "parallax-scene",
		"data-parallax": enabled ? "on" : "off",
		className: cn("relative", className),
		style: {
			...style,
			perspective: `${perspective}px`,
			perspectiveOrigin: "50% 50%"
		},
		...enabled ? handlers : null,
		...props,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "parallax-stage",
			className: "relative size-full [transform-style:preserve-3d]",
			style: { transform: "rotateX(var(--luc-parallax-rx, 0deg)) rotateY(var(--luc-parallax-ry, 0deg))" },
			children
		})
	});
}
/**
* One plane inside a `ParallaxScene`.
*
* The transform is `translate3d` only — a compositor property — and the two
* custom properties come from the scene above, so a layer never re-renders when
* the pointer moves. Without a scene the variables are undefined, the `calc`
* resolves to `0px` and the layer simply sits at its `z`, which makes the
* component safe to render outside one.
*/
function ParallaxLayer({ className, children, depth = 1, z = 0, axis = "both", style, ...props }) {
	const amount = Number.isFinite(depth) ? depth : 1;
	const x = axis === "y" ? "0px" : `calc(var(--luc-parallax-x, 0px) * ${amount})`;
	const y = axis === "x" ? "0px" : `calc(var(--luc-parallax-y, 0px) * ${amount})`;
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "parallax-layer",
		"data-depth": amount,
		className: cn("luc-layer", className),
		style: {
			transform: `translate3d(${x}, ${y}, ${z}px)`,
			...style
		},
		...props,
		children
	});
}
//#endregion
export { ParallaxLayer, ParallaxScene };

//# sourceMappingURL=parallax-scene.js.map