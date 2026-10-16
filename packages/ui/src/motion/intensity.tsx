"use client";

import { createContext, useContext, useMemo } from "react";
import { useReducedMotion } from "../hooks/use-reduced-motion";
import {
  intensityProfiles,
  type IntensityProfile,
  type MotionIntensity,
} from "./intensity-profiles";

/**
 * LUC motion intensity.
 *
 * The default is `expressive`: V1.2 wants the product to feel alive, and a
 * component that says nothing should still answer the pointer. A dense table
 * toolbar (or a print/export surface) can scope itself down to `functional` or
 * `none`, and a hero can push up to `showcase`.
 *
 * Reduced motion always wins: whatever the scope says, the resolved profile is
 * `none`, so every consumer that reads `profile.pointer`/`profile.ambient`
 * automatically takes the static path. CSS mirrors the same decision through
 * the global clamp in `base.css`, so nothing double-animates.
 */
interface MotionIntensityScopeValue {
  intensity: MotionIntensity;
  pointer?: boolean;
  ambient?: boolean;
}

const IntensityContext = createContext<MotionIntensityScopeValue>({ intensity: "expressive" });

export interface MotionIntensityProviderProps {
  intensity?: MotionIntensity;
  /**
   * Hard overrides for the two behavioural halves of the profile. Useful when a
   * screen wants expressive motion but no cursor effects (a touch-first page), or
   * the opposite (a static report with one ambient accent). Reduced motion still
   * wins over both.
   */
  pointer?: boolean;
  ambient?: boolean;
  children: React.ReactNode;
}

export function MotionIntensityProvider({
  intensity = "expressive",
  pointer,
  ambient,
  children,
}: MotionIntensityProviderProps) {
  const value = useMemo<MotionIntensityScopeValue>(
    () => ({ intensity, pointer, ambient }),
    [ambient, intensity, pointer],
  );
  return <IntensityContext.Provider value={value}>{children}</IntensityContext.Provider>;
}

/** The raw level in scope, before reduced-motion resolution. */
export function useMotionIntensity(): MotionIntensity {
  return useContext(IntensityContext).intensity;
}

/**
 * The resolved profile for the current scope. Components should read this
 * rather than the raw level so reduced motion is handled once, in one place.
 */
export function useMotionProfile(): IntensityProfile & { intensity: MotionIntensity } {
  const scope = useContext(IntensityContext);
  const reduced = useReducedMotion();
  return useMemo(() => {
    const resolved: MotionIntensity = reduced ? "none" : scope.intensity;
    const base = intensityProfiles[resolved];
    return {
      intensity: resolved,
      ...base,
      pointer: scope.pointer === undefined ? base.pointer : scope.pointer && base.pointer,
      ambient: scope.ambient === undefined ? base.ambient : scope.ambient && base.ambient,
    };
  }, [reduced, scope]);
}

/** Escape hatch for components that only need one bit of the profile. */
export function usePointerMotionEnabled(): boolean {
  return useMotionProfile().pointer;
}
