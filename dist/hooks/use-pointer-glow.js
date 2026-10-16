"use client";
import { useMotionProfile } from "../motion/intensity.js";
import { useCallback, useEffect, useRef } from "react";
//#region src/hooks/use-pointer-glow.ts
/**
* LUC `usePointerGlow` — the shared cursor tracker behind `luc-cursor-light`.
*
* A filled control should light where the finger is, not uniformly. This hook
* converts the pointer position into two percentages plus an opacity, and
* writes them onto the element as custom properties.
*
* It exists as a hook rather than a component so any surface can adopt the
* behaviour without buying another wrapper `<div>`: the Button family, a Card,
* a toolbar, a chart frame. It is rAF-throttled, it never re-renders, it
* detaches its rAF on unmount, and it is inert on coarse pointers and under
* reduced motion — where it still returns the same API, so a call site never
* branches on the environment.
*/
function usePointerGlow({ disabled = false, opacity = .5 } = {}) {
	const profile = useMotionProfile();
	const ref = useRef(null);
	const frame = useRef(null);
	const point = useRef(null);
	const enabled = !disabled && profile.pointer;
	useEffect(() => () => {
		if (frame.current !== null) cancelAnimationFrame(frame.current);
		frame.current = null;
	}, []);
	const paint = useCallback(() => {
		frame.current = null;
		const node = ref.current;
		const next = point.current;
		if (!node || !next) return;
		const rect = node.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;
		const x = (next.x - rect.left) / rect.width * 100;
		const y = (next.y - rect.top) / rect.height * 100;
		node.style.setProperty("--luc-px", `${x.toFixed(2)}%`);
		node.style.setProperty("--luc-py", `${y.toFixed(2)}%`);
	}, []);
	const schedule = useCallback(() => {
		if (frame.current === null) frame.current = requestAnimationFrame(paint);
	}, [paint]);
	return {
		ref,
		handlers: {
			onPointerMove: (event) => {
				if (!enabled) return;
				point.current = {
					x: event.clientX,
					y: event.clientY
				};
				schedule();
			},
			onPointerEnter: (event) => {
				if (!enabled) return;
				const node = event.currentTarget;
				const rect = node.getBoundingClientRect();
				node.style.setProperty("--luc-px", `${(event.clientX - rect.left) / rect.width * 100}%`);
				node.style.setProperty("--luc-py", `${(event.clientY - rect.top) / rect.height * 100}%`);
				node.style.setProperty("--luc-glow-opacity", String(opacity));
				point.current = {
					x: event.clientX,
					y: event.clientY
				};
			},
			onPointerLeave: () => {
				if (!enabled) return;
				ref.current?.style.setProperty("--luc-glow-opacity", "0");
				point.current = null;
			}
		},
		enabled
	};
}
//#endregion
export { usePointerGlow };

//# sourceMappingURL=use-pointer-glow.js.map