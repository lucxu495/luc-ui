"use client";
import { useReducedMotion } from "../../hooks/use-reduced-motion.js";
import { chartMotion } from "../../motion/tokens.js";
import { defaultChartTheme, modeOf, resolveChartTheme } from "./theme.js";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
//#region src/charts/core/use-chart-theme.ts
let cacheKey = null;
let cacheTheme = defaultChartTheme;
function subscribe(onChange) {
	if (typeof document === "undefined") return () => {};
	const observer = new MutationObserver(onChange);
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "data-theme"]
	});
	return () => observer.disconnect();
}
function getSnapshot() {
	const mode = modeOf();
	if (cacheKey !== mode) {
		cacheTheme = resolveChartTheme();
		cacheKey = mode;
	}
	return cacheTheme;
}
function getServerSnapshot() {
	return defaultChartTheme;
}
/**
* The resolved chart theme for the current LUC theme, kept in sync without a
* re-render loop: the snapshot only changes when `<html>` flips theme.
*/
function useChartTheme() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
/** Past this many plotted points a per-point entrance animation is waste. */
const CHART_ANIMATION_POINT_LIMIT = 4e3;
const PRESET_SCALE = {
	none: 0,
	subtle: .5,
	standard: 1,
	emphasized: 1.45
};
/**
* Chart motion budget.
*
* Precedence: reduced motion wins over everything (a chart under
* `prefers-reduced-motion` renders its final frame immediately — motion is
* never merely slowed down). Then the caller's preset, then a **large-data
* clamp**: a 20 000-point scatter does not animate twenty thousand marks into
* place, it appears.
*/
function useChartMotion(theme, preset = "standard", pointCount) {
	const reduced = useReducedMotion();
	if (reduced) return {
		reduced: true,
		intro: 0,
		update: 0,
		emphasis: 0,
		universal: false
	};
	const scale = PRESET_SCALE[preset];
	if (scale === 0) return {
		reduced: false,
		intro: 0,
		update: 0,
		emphasis: 0,
		universal: false
	};
	const dense = typeof pointCount === "number" && pointCount > 4e3;
	return {
		reduced: false,
		intro: Math.round((theme.motionSlow + (chartMotion.intro - theme.motionSlow) * scale) * (dense ? .35 : 1)),
		update: Math.round((theme.motionNormal + (chartMotion.update - theme.motionNormal) * scale) * (dense ? .5 : 1)),
		emphasis: reduced ? 0 : theme.motionFast,
		universal: !dense
	};
}
/**
* Observe an element's box. Returns `null` until the first measurement so a
* caller can decide whether rendering an engine is worth it yet.
*/
function useElementSize() {
	const ref = useRef(null);
	const [size, setSize] = useState(null);
	useEffect(() => {
		const element = ref.current;
		if (!element || typeof ResizeObserver === "undefined") return;
		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			const box = entry.contentRect;
			setSize((current) => current && Math.abs(current.width - box.width) < .5 && Math.abs(current.height - box.height) < .5 ? current : {
				width: box.width,
				height: box.height
			});
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, []);
	return [ref, size];
}
/** Stable per-instance id for sync-group origins and ARIA wiring. */
function useChartId(prefix = "luc-chart") {
	return `${prefix}-${useId()}`;
}
/**
* A ref that always holds the latest value, updated after each commit rather
* than during render (which React's hooks linting rejects, and which breaks
* concurrent rendering). Engines read these from event handlers and effects
* where the freshest value is what matters.
*/
function useLatest(value) {
	const ref = useRef(value);
	useEffect(() => {
		ref.current = value;
	});
	return ref;
}
//#endregion
export { CHART_ANIMATION_POINT_LIMIT, useChartId, useChartMotion, useChartTheme, useElementSize, useLatest };

//# sourceMappingURL=use-chart-theme.js.map