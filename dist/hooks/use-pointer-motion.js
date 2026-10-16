"use client";
import { useMediaQuery } from "./use-media-query.js";
import { useReducedMotion } from "./use-reduced-motion.js";
import { spring } from "../motion/tokens.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, useTransform } from "motion/react";
//#region src/hooks/use-pointer-motion.ts
/**
* One pointer tracker for every cursor-reactive primitive.
*
* `Magnetic`, `TiltSurface`, `GlareSurface` and `CursorSpotlight` all need the
* same three things: the pointer position relative to the element, a spring so
* the response has weight, and a hard "off" switch on touch and under reduced
* motion. Duplicating that four times is how a system drifts, so it lives here.
*
* The loop never touches React state: positions are MotionValues, updated on
* `pointermove` and smoothed by the motion engine. The only React state is the
* boolean "is the pointer over me", which changes twice per interaction.
*/
function usePointerMotion({ disabled = false, preset = "responsive" } = {}) {
	const reducedMotion = useReducedMotion();
	const coarsePointer = useMediaQuery("(pointer: coarse)", true);
	const enabled = !disabled && !reducedMotion && !coarsePointer;
	const ref = useRef(null);
	const [isActive, setIsActive] = useState(false);
	const config = spring[preset];
	const springOptions = {
		stiffness: config.stiffness,
		damping: config.damping
	};
	const rawX = useMotionValue(0);
	const rawY = useMotionValue(0);
	const height = useMotionValue(0);
	const width = useMotionValue(0);
	const active = useMotionValue(0);
	const x = useSpring(rawX, springOptions);
	const y = useSpring(rawY, springOptions);
	const px = useTransform(() => width.get() > 0 ? x.get() / width.get() : 0);
	const py = useTransform(() => height.get() > 0 ? y.get() / height.get() : 0);
	const measure = useCallback(() => {
		const element = ref.current;
		if (!element) return;
		const rect = element.getBoundingClientRect();
		width.set(rect.width || 1);
		height.set(rect.height || 1);
	}, [height, width]);
	useEffect(() => {
		if (!enabled) return;
		if (typeof ResizeObserver === "undefined") return;
		const element = ref.current;
		if (!element) return;
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		return () => observer.disconnect();
	}, [enabled, measure]);
	useEffect(() => {
		if (enabled) return;
		rawX.set(0);
		rawY.set(0);
		active.set(0);
	}, [
		active,
		enabled,
		rawX,
		rawY
	]);
	const handlePointerMove = useCallback((event) => {
		if (!enabled) return;
		const rect = event.currentTarget.getBoundingClientRect();
		width.set(rect.width || 1);
		height.set(rect.height || 1);
		rawX.set(event.clientX - rect.left - rect.width / 2);
		rawY.set(event.clientY - rect.top - rect.height / 2);
	}, [
		enabled,
		height,
		rawX,
		rawY,
		width
	]);
	const handlePointerEnter = useCallback(() => {
		if (!enabled) return;
		measure();
		active.set(1);
		setIsActive(true);
	}, [
		active,
		enabled,
		measure
	]);
	const handlePointerLeave = useCallback(() => {
		rawX.set(0);
		rawY.set(0);
		active.set(0);
		setIsActive(false);
	}, [
		active,
		rawX,
		rawY
	]);
	return {
		ref,
		enabled,
		isActive: isActive && enabled,
		x,
		y,
		px,
		py,
		active,
		handlers: {
			onPointerMove: handlePointerMove,
			onPointerEnter: handlePointerEnter,
			onPointerLeave: handlePointerLeave
		}
	};
}
//#endregion
export { usePointerMotion };

//# sourceMappingURL=use-pointer-motion.js.map