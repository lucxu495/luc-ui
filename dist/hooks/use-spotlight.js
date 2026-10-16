"use client";
import { useMediaQuery } from "./use-media-query.js";
import { useReducedMotion } from "./use-reduced-motion.js";
import { useCallback, useEffect, useRef, useState } from "react";
//#region src/hooks/use-spotlight.ts
/**
* Shared pointer-proximity tracker for gentle surface lighting.
*
* Design constraints (see DESIGN_SYSTEM.md):
*  - rAF-throttled: at most one style write per frame.
*  - Never active on coarse pointers or under prefers-reduced-motion.
*  - Writes CSS custom properties, so no React re-render per mouse move.
*/
function useSpotlight({ disabled, prefix = "spotlight", onFrame } = {}) {
	const ref = useRef(null);
	const frame = useRef(null);
	const pointer = useRef({
		x: 0,
		y: 0,
		active: 0
	});
	const onFrameRef = useRef(onFrame);
	const reducedMotion = useReducedMotion();
	const coarsePointer = useMediaQuery("(pointer: coarse)", true);
	const [isActive, setIsActive] = useState(false);
	useEffect(() => {
		onFrameRef.current = onFrame;
	}, [onFrame]);
	const enabled = !disabled && !reducedMotion && !coarsePointer;
	const commit = useCallback(() => {
		frame.current = null;
		const element = ref.current;
		if (!element) return;
		element.style.setProperty(`--${prefix}-x`, `${pointer.current.x}px`);
		element.style.setProperty(`--${prefix}-y`, `${pointer.current.y}px`);
		element.style.setProperty(`--${prefix}-active`, `${pointer.current.active}`);
		onFrameRef.current?.(pointer.current);
	}, [prefix]);
	const schedule = useCallback(() => {
		if (frame.current !== null) return;
		frame.current = window.requestAnimationFrame(commit);
	}, [commit]);
	const handlePointerMove = useCallback((event) => {
		if (!enabled) return;
		const rect = event.currentTarget.getBoundingClientRect();
		pointer.current = {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
			active: 1
		};
		schedule();
	}, [enabled, schedule]);
	const handlePointerEnter = useCallback(() => {
		if (!enabled) return;
		setIsActive(true);
	}, [enabled]);
	const handlePointerLeave = useCallback(() => {
		if (!enabled) return;
		pointer.current = {
			...pointer.current,
			active: 0
		};
		setIsActive(false);
		schedule();
	}, [enabled, schedule]);
	useEffect(() => () => {
		if (frame.current !== null) window.cancelAnimationFrame(frame.current);
	}, []);
	return {
		ref,
		isActive: isActive && enabled,
		enabled,
		handlers: {
			onPointerMove: handlePointerMove,
			onPointerEnter: handlePointerEnter,
			onPointerLeave: handlePointerLeave
		}
	};
}
//#endregion
export { useSpotlight };

//# sourceMappingURL=use-spotlight.js.map