/**
 * LUC motion tokens — the TypeScript half of the motion contract.
 *
 * `tokens.css` owns the CSS custom properties (durations, easings, distances,
 * spring stiffness/damping). This module mirrors them for the JS motion layer
 * (Motion for React), so a component never invents
 * `transition: 273ms cubic-bezier(...)` locally.
 *
 * Two rules keep the system coherent:
 *
 *  1. **Durations are named by intent**, not by number — `fast` is a hover
 *     acknowledgement, `deliberate` is a large surface moving.
 *  2. **Springs are interaction-scale.** A spring is for something the user is
 *     touching (a thumb, a highlight, a sheet). A data transition uses a
 *     duration + an ease, because a spring's overshoot would imply precision the
 *     data does not have.
 */

/** Duration scale, in seconds (the unit Motion uses). */
export const duration = {
  instant: 0.07,
  fast: 0.14,
  normal: 0.2,
  slow: 0.3,
  deliberate: 0.46,
} as const;

/** Cubic-bezier easings, mirrored from `--ease-*`. */
export const easing = {
  standard: [0.2, 0, 0, 1],
  enter: [0.16, 1, 0.3, 1],
  exit: [0.4, 0, 1, 1],
  emphasized: [0.3, 0.85, 0.15, 1],
  /** State-change delight only — never for data. */
  overshoot: [0.34, 1.32, 0.64, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Travel distances, in px, mirrored from `--motion-distance-*`. */
export const distance = {
  xs: 4,
  sm: 8,
  md: 14,
} as const;

export type SpringPresetName = "soft" | "responsive" | "snappy";

export interface SpringPreset {
  type: "spring";
  stiffness: number;
  damping: number;
}

/**
 * Spring presets for interaction-scale motion.
 *
 * - `soft` — a large surface settling (sheet, sidebar, fullscreen panel).
 * - `responsive` — the default: a highlight, a thumb, a card that answers.
 * - `snappy` — a small, immediate acknowledgement (a dot, a toggle knob).
 */
export const spring: Record<SpringPresetName, SpringPreset> = {
  soft: { type: "spring", stiffness: 140, damping: 20 },
  responsive: { type: "spring", stiffness: 320, damping: 30 },
  snappy: { type: "spring", stiffness: 520, damping: 34 },
};

/** A CSS `transition` shorthand for a named token pair. */
export function transitionCss(
  property: string,
  ms: keyof typeof duration = "normal",
  ease: keyof typeof easing = "standard",
): string {
  const curve = easing[ease].join(", ");
  return `${property} ${Math.round(duration[ms] * 1000)}ms cubic-bezier(${curve})`;
}

/* -------------------------------------------------------------------------- */
/* V1.2 — interaction intensity                                                */
/* -------------------------------------------------------------------------- */

/*
 * The profile table lives in `./intensity-profiles` so a component that only
 * needs "is ink allowed?" does not pull in the rest of this file. Re-exported
 * here so `@luc/ui/motion` keeps exactly the surface it always had.
 */
export {
  intensityProfiles,
  motionIntensities,
  type IntensityProfile,
  type MotionIntensity,
} from "./intensity-profiles";

/* -------------------------------------------------------------------------- */
/* V1.2 — pointer, surface, depth and ambient tokens                           */
/* -------------------------------------------------------------------------- */

/**
 * Cursor-reactive geometry. One place decides how far a card may lean or a
 * button may follow, so no component invents "rotate 12deg" locally.
 */
export const pointer = {
  /** Fraction of the pointer offset a magnetic target follows (0..1). */
  magneticStrength: 0.3,
  /** Distance in px at which the magnetic pull fades to zero. */
  magneticRadius: 110,
  /** Maximum lean, in degrees. More than ~10 reads as a toy. */
  tiltMaxAngle: 7,
  /** `perspective()` for tilt surfaces, in px. */
  tiltPerspective: 900,
  /** Radius of the glare highlight, in px. */
  glareRadius: 260,
  /** Peak glare opacity (single-digit-to-low-double-digit alpha). */
  glareOpacity: 0.16,
  /** Default spotlight/glow radius, in px. */
  spotlightRadius: 340,
  /** Travel in px for a parallax layer at depth 1. */
  parallaxDepth: 12,
} as const;

/** Hover/press/selected geometry shared by every interactive surface. */
export const surfaceResponse = {
  hoverLift: 2,
  hoverScale: 1.012,
  pressScale: 0.972,
  selectedLift: 1,
  glowStrength: 0.34,
} as const;

/** Blur/depth amounts for enter/exit and background composition, in px. */
export const depth = {
  enterBlur: 6,
  exitBlur: 4,
  backgroundBlur: 14,
} as const;

/** Looping decorative motion budgets, in seconds. */
export const ambient = {
  slowLoop: 9,
  pulse: 3.2,
  shimmer: 1.9,
  trail: 4.6,
  gridDrift: 22,
} as const;

/**
 * The resolved chart animation budget, in milliseconds.
 *
 * Kept here (not in the chart module) so the token layer is the single source
 * for "how long does a chart transition take".
 */
export const chartMotion = {
  /** First paint. Long enough to read as "this drew", short enough to not wait. */
  intro: 520,
  /** A data or range update. Must feel immediate. */
  update: 260,
  /** Hover/emphasis feedback. */
  emphasis: 180,
} as const;

/** The CSS custom property names, for components that style with `var(...)`. */
export const motionVars = {
  instant: "--motion-instant",
  fast: "--motion-fast",
  normal: "--motion-normal",
  slow: "--motion-slow",
  deliberate: "--motion-slower",
  distanceXs: "--motion-distance-xs",
  distanceSm: "--motion-distance-sm",
  distanceMd: "--motion-distance-md",
  intensity: "--motion-intensity",
  ambientLoop: "--ambient-loop",
  ambientPulse: "--ambient-pulse",
  trailSpeed: "--ambient-trail",
} as const;
