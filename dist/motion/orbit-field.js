"use client";
import { cn } from "../utils/cn.js";
import { useMotionProfile } from "./intensity.js";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext, useId, useMemo } from "react";
//#region src/motion/orbit-field.tsx
/**
* Polar → percentage inside the ring box.
*
* Angles are degrees, measured counter-clockwise from the 3 o'clock position,
* which is what everyone means by "angle" and what a diagram author expects.
* Screen y grows downwards, hence the minus.
*/
function polar(angle, radius = 50) {
	const radians = angle * Math.PI / 180;
	return {
		left: `${50 + Math.cos(radians) * radius}%`,
		top: `${50 - Math.sin(radians) * radius}%`
	};
}
const OrbitFieldContext = createContext(null);
function useOrbitFieldContext(component) {
	const context = useContext(OrbitFieldContext);
	if (!context) throw new Error(`<${component}> must be rendered inside <OrbitField>.`);
	return context;
}
const OrbitRingContext = createContext(null);
/**
* LUC `OrbitField` — a geometric composition that actually orbits.
*
* It exists because "geometric motion" usually arrives as a decorative
* background animation that a product cannot reuse. An orbit is a *layout*:
* things are arranged on rings, the rings turn, the things stay upright and
* readable, and any node can be a real control. So the field is a container,
* `OrbitFieldRing` is a track, `OrbitFieldNode` is a seat, and the caller
* decides what sits in the seats.
*
* Engineering notes:
*
*  - Rotation is CSS on the compositor. React renders once and then never again,
*    however many rings turn.
*  - Every label counter-rotates at exactly the ring's period, so a chip stays
*    level while it travels — the difference between a designed orbit and a
*    spinning wheel of unreadable text.
*  - The reduced-motion clamp collapses `0°→360°` to its end frame, which equals
*    its start frame: the field freezes into a correct, deliberate arrangement.
*  - The field is a square by default (`aspect-square`); rings are sized in
*    percentages of it, so nothing needs measuring and nothing shifts on resize.
*/
function OrbitField({ className, children, label, tilt = 14, perspective = 1e3, speed = 1, paused = false, style, ...props }) {
	const profile = useMotionProfile();
	const instance = useId();
	const spinning = !paused && profile.ambient;
	const value = useMemo(() => ({
		spinning,
		speed: speed > 0 ? speed : 1,
		instance
	}), [
		instance,
		speed,
		spinning
	]);
	return /* @__PURE__ */ jsx(OrbitFieldContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "orbit-field",
			"data-spinning": spinning ? "true" : "false",
			...label ? {
				role: "group",
				"aria-label": label
			} : {},
			className: cn("relative aspect-square", className),
			style: {
				...style,
				perspective: `${perspective}px`
			},
			...props,
			children: /* @__PURE__ */ jsx("div", {
				"data-slot": "orbit-plane",
				className: "relative size-full [transform-style:preserve-3d]",
				style: { transform: `rotateX(${tilt}deg)` },
				children
			})
		})
	});
}
/**
* A track inside an `OrbitField`. Sizing is percentage-based and the ring is
* centred with negative percentage margins rather than a `translate`, because
* the rotation animation owns `transform` outright — a translate utility here
* would be silently overwritten the moment the ring starts turning.
*/
function OrbitFieldRing({ className, children, radius = 44, duration = 32, direction = "forward", dashed = false, trackless = false, restOnHover = true, style, ...props }) {
	const { spinning, speed } = useOrbitFieldContext("OrbitFieldRing");
	const size = `${Math.max(2, Math.min(radius, 100)) * 2}%`;
	const offset = `${-Math.max(2, Math.min(radius, 100))}%`;
	const period = duration / speed;
	const value = useMemo(() => ({
		radius: Math.max(2, Math.min(radius, 100)),
		duration: period,
		direction,
		spinning
	}), [
		direction,
		period,
		radius,
		spinning
	]);
	return /* @__PURE__ */ jsx(OrbitRingContext.Provider, {
		value,
		children: /* @__PURE__ */ jsx("div", {
			"data-slot": "orbit-ring",
			"data-direction": direction,
			className: cn("absolute top-1/2 left-1/2 rounded-full [transform-style:preserve-3d]", !trackless && "border border-line-subtle", !trackless && dashed && "luc-orbit-dashed", spinning && "luc-orbit-spin", spinning && restOnHover && "luc-orbit-rest", className),
			style: {
				width: size,
				height: size,
				marginLeft: offset,
				marginTop: offset,
				...spinning ? {
					animationDuration: `${period}s`,
					animationDirection: direction === "reverse" ? "reverse" : "normal"
				} : null,
				...style
			},
			...trackless ? { "aria-hidden": "true" } : {},
			...props,
			children
		})
	});
}
/**
* A seat on an `OrbitFieldRing`.
*
* Two nested elements on purpose. The outer one *positions* the seat with a
* `translate(-50%, -50%)`; the inner one *rotates* against the ring, and its
* transform belongs entirely to that animation. Fighting over one `transform`
* is the classic way an orbiting label ends up tilted 40° and half off its seat.
*
* With `onSelect` the seat renders a `<button type="button">`, which brings
* focus, Enter/Space activation and `aria-pressed` for free — an orbit you can
* only use with a pointer is a decoration, not a component.
*/
function OrbitFieldNode({ className, children, angle = 0, onSelect, active = false, label, ...props }) {
	const ring = useContext(OrbitRingContext);
	const seat = polar(angle, 50);
	const spinning = ring?.spinning ?? false;
	const counterClass = ring?.direction === "reverse" ? "luc-orbit-spin" : "luc-orbit-counter";
	const counterStyle = spinning && ring ? { animationDuration: `${ring.duration}s` } : void 0;
	const position = /* @__PURE__ */ jsx("span", {
		"data-slot": "orbit-seat",
		className: "absolute block",
		style: {
			left: seat.left,
			top: seat.top,
			transform: "translate(-50%, -50%)"
		},
		children: /* @__PURE__ */ jsx("span", {
			"data-slot": "orbit-counter",
			className: cn("block", spinning && counterClass),
			style: counterStyle,
			children
		})
	});
	if (!onSelect) return /* @__PURE__ */ jsx("div", {
		"data-slot": "orbit-node",
		"data-active": active ? "true" : "false",
		className,
		...props,
		children: position
	});
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "orbit-node",
		"data-active": active ? "true" : "false",
		className,
		...props,
		children: /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: onSelect,
			"aria-pressed": active,
			...label ? { "aria-label": label } : null,
			className: "luc-focus relative block cursor-pointer rounded-full",
			style: {
				position: "absolute",
				left: seat.left,
				top: seat.top,
				transform: "translate(-50%, -50%)"
			},
			children: /* @__PURE__ */ jsx("span", {
				"data-slot": "orbit-counter",
				className: cn("block", spinning && counterClass),
				style: counterStyle,
				children
			})
		})
	});
}
/**
* The hub at the centre of an `OrbitField`. Pointer events pass straight
* through the empty area, so a ring's seats stay clickable underneath.
*/
function OrbitFieldCore({ className, children, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		"data-slot": "orbit-core",
		className: cn("pointer-events-none absolute inset-0 grid place-items-center [&>*]:pointer-events-auto", className),
		...props,
		children
	});
}
//#endregion
export { OrbitField, OrbitFieldCore, OrbitFieldNode, OrbitFieldRing };

//# sourceMappingURL=orbit-field.js.map