/*
 * The intensity profile table, deliberately split out of `tokens.ts`.
 *
 * The Button family reads the resolved profile on every press (see
 * `usePressRipple`), and an entry point that imports `Button` should not have to
 * pay for the whole motion vocabulary — durations, easings, springs, pointer
 * geometry, ambient budgets and the chart budget all live in `tokens.ts` and are
 * of no interest to a control that only wants to know whether ink is allowed.
 *
 * Keeping the table here means the dependency is one small module instead of
 * one large one. `tokens.ts` re-exports everything below, so the public surface
 * (`@luc/ui/motion`) is unchanged.
 */

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

export const motionIntensities: readonly MotionIntensity[] = [
  "none",
  "functional",
  "expressive",
  "showcase",
] as const;

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
export const intensityProfiles: Record<MotionIntensity, IntensityProfile> = {
  none: { pointer: false, ambient: false, stagger: 0, travel: 0, glow: 0, depth: 0 },
  functional: { pointer: false, ambient: false, stagger: 0.03, travel: 0.5, glow: 0.5, depth: 0.35 },
  expressive: { pointer: true, ambient: true, stagger: 0.045, travel: 1, glow: 1, depth: 1 },
  showcase: { pointer: true, ambient: true, stagger: 0.06, travel: 1.35, glow: 1.4, depth: 1.5 },
};
