//#region src/motion/intensity-profiles.d.ts
/**
 * How loud an interaction is allowed to be.
 *
 * V1.1 was uniformly restrained; V1.2 lets a surface *opt into* more. The
 * level is a product decision, not a component clamp: the same Button reads
 * `functional` inside a dense table toolbar and `expressive` on a hero, and
 * nothing in between has to re-implement the physics.
 *
 *   none        static output (print, reduced motion)
 *   functional  fast feedback only — forms, dense tables, navigation
 *   expressive  premium interaction — cards, chart controls, signals
 *   showcase    the strongest treatment, used sparingly (hero, flagship chart)
 */
export type MotionIntensity = "none" | "functional" | "expressive" | "showcase";
export declare const motionIntensities: readonly MotionIntensity[];
export interface IntensityProfile {
  /** Whether cursor-reactive effects (magnetic, tilt, glare, spotlight) run. */
  pointer: boolean;
  /** Whether decorative ambient loops (trail, pulse, grid drift) may run. */
  ambient: boolean;
  /** Seconds added per item by `StaggerGroup`. */
  stagger: number;
  /** Multiplier applied to hover/press travel distances. */
  travel: number;
  /** Multiplier applied to glow/spotlight opacity. */
  glow: number;
  /** Multiplier applied to parallax/tilt/magnetic depth. */
  depth: number;
}
/**
 * The four resolved profiles. Values are deliberately monotonic so a caller
 * can reason "more intensity = more of everything" without reading each field.
 */
export declare const intensityProfiles: Record<MotionIntensity, IntensityProfile>;
//#endregion
//# sourceMappingURL=intensity-profiles.d.ts.map