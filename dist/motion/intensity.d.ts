import { IntensityProfile, MotionIntensity } from "./intensity-profiles.js";
//#region src/motion/intensity.d.ts
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
export declare function MotionIntensityProvider({ intensity, pointer, ambient, children }: MotionIntensityProviderProps): import("react").JSX.Element;
/** The raw level in scope, before reduced-motion resolution. */
export declare function useMotionIntensity(): MotionIntensity;
/**
 * The resolved profile for the current scope. Components should read this
 * rather than the raw level so reduced motion is handled once, in one place.
 */
export declare function useMotionProfile(): IntensityProfile & {
  intensity: MotionIntensity;
};
/** Escape hatch for components that only need one bit of the profile. */
export declare function usePointerMotionEnabled(): boolean;
//#endregion
//# sourceMappingURL=intensity.d.ts.map