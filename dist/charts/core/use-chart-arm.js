"use client";
import { useEffect, useState } from "react";
const queue = [];
let draining = false;
function scheduleIdle(callback) {
	const requestIdle = globalThis.requestIdleCallback;
	if (typeof requestIdle === "function") {
		requestIdle(callback, { timeout: 600 });
		return;
	}
	setTimeout(() => callback(void 0), 0);
}
function drain() {
	const next = queue.shift();
	if (next) next();
	if (queue.length > 0) scheduleIdle(drain);
	else draining = false;
}
function enqueueArm(arm) {
	queue.push(arm);
	if (draining) return;
	draining = true;
	scheduleIdle(drain);
}
/** Is this host close enough to be worth building before it is approached? */
function isWithinPrefetchBand(host) {
	const viewport = globalThis.innerHeight || 0;
	if (viewport <= 0) return true;
	const rect = host.getBoundingClientRect();
	const band = viewport * 3;
	return rect.top < viewport + band && rect.bottom > -band;
}
/**
* `true` once this element's chart engine may be created.
*
* `enabled = false` arms immediately — the escape hatch for a surface whose
* caller knows it must be ready without an idle period.
*/
function useChartArm(ref, enabled = true) {
	const [armed, setArmed] = useState(!enabled);
	useEffect(() => {
		if (!enabled || armed) return;
		const host = ref.current;
		if (!host || typeof IntersectionObserver === "undefined") {
			setArmed(true);
			return;
		}
		let cancelled = false;
		const arm = () => {
			if (!cancelled) setArmed(true);
		};
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				observer.disconnect();
				arm();
			}
		}, { rootMargin: `900px 0px 900px 0px` });
		observer.observe(host);
		if (isWithinPrefetchBand(host)) enqueueArm(() => {
			observer.disconnect();
			arm();
		});
		return () => {
			cancelled = true;
			observer.disconnect();
		};
	}, [
		armed,
		enabled,
		ref
	]);
	return armed;
}
//#endregion
export { isWithinPrefetchBand, useChartArm };

//# sourceMappingURL=use-chart-arm.js.map