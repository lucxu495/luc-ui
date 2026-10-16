"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
//#region src/motion/magnify-dock.tsx
const DockContext = createContext(null);
/**
* LUC MagnifyDock — a row of actions that swells toward the pointer.
*
* The interaction physics of the macOS dock, applied to product toolbars: a
* chart's range controls, a canvas' tool rail, an editor's formatting strip, a
* media viewer's transport. It answers the most basic question a dense toolbar
* raises ("which of these am I about to hit?") without a tooltip.
*
* Why it is implemented the way it is:
*
*  - **Pointer move never re-renders React.** The container holds a list of
*    element references and writes two custom properties straight onto them
*    inside one rAF. Twenty items cost the same as two.
*  - **The geometry is a cosine falloff**, so an item's neighbours swell
*    smoothly rather than popping at an invisible boundary.
*  - **Rest state is real state.** Items are laid out at their normal size, so
*    the dock is fully usable (and keyboard-navigable) with no pointer at all,
*    on a touch device, and under reduced motion — where the listeners are never
*    attached in the first place.
*/
function MagnifyDock({ className, children, range = 130, scale = .55, lift = 7, orientation = "horizontal", onPointerMove, onPointerLeave, ...props }) {
	const profile = useMotionProfile();
	const enabled = profile.pointer && profile.travel > 0;
	const items = useRef(/* @__PURE__ */ new Set());
	const frame = useRef(null);
	const pointer = useRef(null);
	const register = useCallback((node) => {
		if (!node) return;
		items.current.add(node);
		return () => {
			items.current.delete(node);
		};
	}, []);
	const context = useMemo(() => ({ register }), [register]);
	useEffect(() => () => {
		if (frame.current !== null) cancelAnimationFrame(frame.current);
		frame.current = null;
	}, []);
	const paint = useCallback(() => {
		frame.current = null;
		const point = pointer.current;
		items.current.forEach((node) => {
			if (!point) {
				node.style.removeProperty("--dock-scale");
				node.style.removeProperty("--dock-lift");
				return;
			}
			const rect = node.getBoundingClientRect();
			const centre = orientation === "horizontal" ? {
				x: rect.left + rect.width / 2,
				y: point.y
			} : {
				x: point.x,
				y: rect.top + rect.height / 2
			};
			const distance = orientation === "horizontal" ? Math.abs(point.x - centre.x) : Math.abs(point.y - centre.y);
			const influence = distance >= range ? 0 : .5 + .5 * Math.cos(distance / range * Math.PI);
			const eased = influence * influence;
			node.style.setProperty("--dock-scale", (1 + scale * eased).toFixed(3));
			node.style.setProperty("--dock-lift", (lift * eased).toFixed(2));
		});
	}, [
		lift,
		orientation,
		range,
		scale
	]);
	const schedule = useCallback((event) => {
		if (!enabled) return;
		pointer.current = {
			x: event.clientX,
			y: event.clientY
		};
		if (frame.current === null) frame.current = requestAnimationFrame(paint);
	}, [enabled, paint]);
	return /* @__PURE__ */ jsx(DockContext.Provider, {
		value: context,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "magnify-dock",
			"data-orientation": orientation,
			className: cn("flex items-end", orientation === "horizontal" ? "flex-row" : "flex-col items-center", className),
			onPointerMove: (event) => {
				schedule(event);
				onPointerMove?.(event);
			},
			onPointerLeave: (event) => {
				pointer.current = null;
				if (frame.current === null) frame.current = requestAnimationFrame(paint);
				onPointerLeave?.(event);
			},
			...props,
			children
		})
	});
}
/**
* One lane of a `MagnifyDock`.
*
* The element owns the transform and nothing else, so whatever you put inside
* keeps its own focus ring, its own disabled state and its own semantics. The
* transition is on `transform` only, which the compositor can animate without
* touching layout.
*
* A labelled item is a `group`, not a bare `div`: `aria-label` on an element
* whose role is `generic` is prohibited — axe reports it as
* `aria-prohibited-attr`, and the name it carries reaches no one, because a
* generic container is not exposed as a named node. `group` is the role that
* says exactly what the label says ("these children belong together and are
* called this") without inventing an interactive role the item does not have.
* An item with no `label` stays a plain `div`.
*/
function MagnifyDockItem({ className, children, label, style, ...props }) {
	const context = useContext(DockContext);
	const ref = useCallback((node) => {
		return context?.register(node);
	}, [context]);
	return /* @__PURE__ */ jsx("div", {
		ref,
		"data-slot": "magnify-dock-item",
		...label ? {
			role: "group",
			"aria-label": label
		} : null,
		className: cn("origin-bottom luc-transition-slow will-change-transform", "motion-safe:transition-transform", className),
		style: {
			transform: "translateY(calc(var(--dock-lift, 0) * -1px)) scale(var(--dock-scale, 1))",
			...style
		},
		...props,
		children
	});
}
//#endregion
export { MagnifyDock, MagnifyDockItem };

//# sourceMappingURL=magnify-dock.js.map