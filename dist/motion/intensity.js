"use client";
import { useReducedMotion } from "../hooks/use-reduced-motion.js";
import { intensityProfiles } from "./intensity-profiles.js";
import { jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo } from "react";
//#region src/motion/intensity.tsx
const IntensityContext = createContext({ intensity: "expressive" });
function MotionIntensityProvider({ intensity = "expressive", pointer, ambient, children }) {
	const value = useMemo(() => ({
		intensity,
		pointer,
		ambient
	}), [
		ambient,
		intensity,
		pointer
	]);
	return /* @__PURE__ */ jsx(IntensityContext.Provider, {
		value,
		children
	});
}
/** The raw level in scope, before reduced-motion resolution. */
function useMotionIntensity() {
	return useContext(IntensityContext).intensity;
}
/**
* The resolved profile for the current scope. Components should read this
* rather than the raw level so reduced motion is handled once, in one place.
*/
function useMotionProfile() {
	const scope = useContext(IntensityContext);
	const reduced = useReducedMotion();
	return useMemo(() => {
		const resolved = reduced ? "none" : scope.intensity;
		const base = intensityProfiles[resolved];
		return {
			intensity: resolved,
			...base,
			pointer: scope.pointer === void 0 ? base.pointer : scope.pointer && base.pointer,
			ambient: scope.ambient === void 0 ? base.ambient : scope.ambient && base.ambient
		};
	}, [reduced, scope]);
}
/** Escape hatch for components that only need one bit of the profile. */
function usePointerMotionEnabled() {
	return useMotionProfile().pointer;
}
//#endregion
export { MotionIntensityProvider, useMotionIntensity, useMotionProfile, usePointerMotionEnabled };

//# sourceMappingURL=intensity.js.map