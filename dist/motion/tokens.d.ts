import { IntensityProfile, MotionIntensity, intensityProfiles, motionIntensities } from "./intensity-profiles.js";
//#region src/motion/tokens.d.ts
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
export declare const duration: {
  readonly instant: 0.07;
  readonly fast: 0.14;
  readonly normal: 0.2;
  readonly slow: 0.3;
  readonly deliberate: 0.46;
};
/** Cubic-bezier easings, mirrored from `--ease-*`. */
export declare const easing: {
  readonly standard: readonly [0.2, 0, 0, 1];
  readonly enter: readonly [0.16, 1, 0.3, 1];
  readonly exit: readonly [0.4, 0, 1, 1];
  readonly emphasized: readonly [0.3, 0.85, 0.15, 1];
  /** State-change delight only — never for data. */
  readonly overshoot: readonly [0.34, 1.32, 0.64, 1];
};
/** Travel distances, in px, mirrored from `--motion-distance-*`. */
export declare const distance: {
  readonly xs: 4;
  readonly sm: 8;
  readonly md: 14;
};
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
export declare const spring: Record<SpringPresetName, SpringPreset>;
/** A CSS `transition` shorthand for a named token pair. */
export declare function transitionCss(property: string, ms?: keyof typeof duration, ease?: keyof typeof easing): string;
/**
 * Cursor-reactive geometry. One place decides how far a card may lean or a
 * button may follow, so no component invents "rotate 12deg" locally.
 */
export declare const pointer: {
  /** Fraction of the pointer offset a magnetic target follows (0..1). */
  readonly magneticStrength: 0.3;
  /** Distance in px at which the magnetic pull fades to zero. */
  readonly magneticRadius: 110;
  /** Maximum lean, in degrees. More than ~10 reads as a toy. */
  readonly tiltMaxAngle: 7;
  /** `perspective()` for tilt surfaces, in px. */
  readonly tiltPerspective: 900;
  /** Radius of the glare highlight, in px. */
  readonly glareRadius: 260;
  /** Peak glare opacity (single-digit-to-low-double-digit alpha). */
  readonly glareOpacity: 0.16;
  /** Default spotlight/glow radius, in px. */
  readonly spotlightRadius: 340;
  /** Travel in px for a parallax layer at depth 1. */
  readonly parallaxDepth: 12;
};
/** Hover/press/selected geometry shared by every interactive surface. */
export declare const surfaceResponse: {
  readonly hoverLift: 2;
  readonly hoverScale: 1.012;
  readonly pressScale: 0.972;
  readonly selectedLift: 1;
  readonly glowStrength: 0.34;
};
/** Blur/depth amounts for enter/exit and background composition, in px. */
export declare const depth: {
  readonly enterBlur: 6;
  readonly exitBlur: 4;
  readonly backgroundBlur: 14;
};
/** Looping decorative motion budgets, in seconds. */
export declare const ambient: {
  readonly slowLoop: 9;
  readonly pulse: 3.2;
  readonly shimmer: 1.9;
  readonly trail: 4.6;
  readonly gridDrift: 22;
};
/**
 * The resolved chart animation budget, in milliseconds.
 *
 * Kept here (not in the chart module) so the token layer is the single source
 * for "how long does a chart transition take".
 */
export declare const chartMotion: {
  /** First paint. Long enough to read as "this drew", short enough to not wait. */
  readonly intro: 520;
  /** A data or range update. Must feel immediate. */
  readonly update: 260;
  /** Hover/emphasis feedback. */
  readonly emphasis: 180;
};
/** The CSS custom property names, for components that style with `var(...)`. */
export declare const motionVars: {
  readonly instant: "--motion-instant";
  readonly fast: "--motion-fast";
  readonly normal: "--motion-normal";
  readonly slow: "--motion-slow";
  readonly deliberate: "--motion-slower";
  readonly distanceXs: "--motion-distance-xs";
  readonly distanceSm: "--motion-distance-sm";
  readonly distanceMd: "--motion-distance-md";
  readonly intensity: "--motion-intensity";
  readonly ambientLoop: "--ambient-loop";
  readonly ambientPulse: "--ambient-pulse";
  readonly trailSpeed: "--ambient-trail";
};
//#endregion
export { type IntensityProfile, type MotionIntensity, intensityProfiles, motionIntensities };
//# sourceMappingURL=tokens.d.ts.map