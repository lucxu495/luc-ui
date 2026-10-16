"use client";
import { useCallback, useSyncExternalStore } from "react";
//#region src/hooks/use-media-query.ts
/**
* SSR-safe media query subscription. Returns `false` on the server so markup
* stays deterministic during hydration.
*/
function useMediaQuery(query, defaultValue = false) {
	const subscribe = useCallback((onChange) => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
		const list = window.matchMedia(query);
		list.addEventListener("change", onChange);
		return () => list.removeEventListener("change", onChange);
	}, [query]);
	const getSnapshot = useCallback(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") return defaultValue;
		return window.matchMedia(query).matches;
	}, [defaultValue, query]);
	const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
/** True for coarse pointers — used to calm down pointer-driven effects. */
function useCoarsePointer() {
	return useMediaQuery("(pointer: coarse)");
}
//#endregion
export { useCoarsePointer, useMediaQuery };

//# sourceMappingURL=use-media-query.js.map