"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
//#region src/hooks/use-sliding-indicator.ts
/**
* Measures the active item inside a container so a single absolutely
* positioned element can slide between them.
*
* Why measure instead of `layoutId`: the indicator also has to survive font
* loading, container resizes, and label changes — and it needs to animate
* *width* as well as position. One rAF-free measurement per change is cheaper
* and far more predictable.
*
* Returns `rect: null` until the first measurement so callers can keep the
* indicator invisible instead of flashing at position 0.
*/
function useSlidingIndicator(activeValue) {
	const containerRef = useRef(null);
	const itemsRef = useRef(/* @__PURE__ */ new Map());
	const [rect, setRect] = useState(null);
	const measure = useCallback(() => {
		const container = containerRef.current;
		const item = activeValue ? itemsRef.current.get(activeValue) : void 0;
		if (!container || !item) {
			setRect(null);
			return;
		}
		const containerRect = container.getBoundingClientRect();
		const itemRect = item.getBoundingClientRect();
		setRect({
			left: itemRect.left - containerRect.left,
			width: itemRect.width
		});
	}, [activeValue]);
	useLayoutEffect(() => {
		measure();
	}, [measure]);
	useEffect(() => {
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver(() => measure());
		observer.observe(container);
		itemsRef.current.forEach((item) => observer.observe(item));
		window.addEventListener("resize", measure);
		document.fonts?.ready.then(measure);
		return () => {
			observer.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [measure]);
	return {
		containerRef,
		registerItem: useCallback((value) => (node) => {
			if (node) itemsRef.current.set(value, node);
			else itemsRef.current.delete(value);
		}, []),
		rect,
		measure
	};
}
//#endregion
export { useSlidingIndicator };

//# sourceMappingURL=use-sliding-indicator.js.map