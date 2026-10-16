"use client";
import { useMediaQuery } from "./use-media-query.js";
import { useCallback, useSyncExternalStore } from "react";
//#region src/hooks/use-reduced-motion.ts
/**
* LUC reduced-motion policy.
*
* Precedence:
*   1. `data-motion="reduced"` on `<html>` — an explicit product/QA override.
*   2. `data-motion="full"` on `<html>` — a deliberate opt-in for demos.
*   3. `prefers-reduced-motion` from the OS.
*
* Components use this for *behaviour* (skip travel, jump the ticker) while CSS
* handles the blanket transition clamp in `base.css`.
*/
function useReducedMotion() {
	const override = useMotionOverride();
	const systemReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
	if (override === "reduced") return true;
	if (override === "full") return false;
	return systemReduced;
}
function useMotionOverride() {
	const subscribe = useCallback((onChange) => {
		if (typeof document === "undefined") return () => {};
		const observer = new MutationObserver(onChange);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["data-motion"]
		});
		return () => observer.disconnect();
	}, []);
	const getSnapshot = useCallback(() => {
		if (typeof document === "undefined") return null;
		const raw = document.documentElement.dataset.motion;
		return raw === "reduced" || raw === "full" ? raw : null;
	}, []);
	return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
//#endregion
export { useMotionOverride, useReducedMotion };

//# sourceMappingURL=use-reduced-motion.js.map