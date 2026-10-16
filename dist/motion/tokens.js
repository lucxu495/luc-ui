import { intensityProfiles, motionIntensities } from "./intensity-profiles.js";
//#region src/motion/tokens.ts
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
const duration = {
	instant: .07,
	fast: .14,
	normal: .2,
	slow: .3,
	deliberate: .46
};
/** Cubic-bezier easings, mirrored from `--ease-*`. */
const easing = {
	standard: [
		.2,
		0,
		0,
		1
	],
	enter: [
		.16,
		1,
		.3,
		1
	],
	exit: [
		.4,
		0,
		1,
		1
	],
	emphasized: [
		.3,
		.85,
		.15,
		1
	],
	/** State-change delight only — never for data. */
	overshoot: [
		.34,
		1.32,
		.64,
		1
	]
};
/** Travel distances, in px, mirrored from `--motion-distance-*`. */
const distance = {
	xs: 4,
	sm: 8,
	md: 14
};
/**
* Spring presets for interaction-scale motion.
*
* - `soft` — a large surface settling (sheet, sidebar, fullscreen panel).
* - `responsive` — the default: a highlight, a thumb, a card that answers.
* - `snappy` — a small, immediate acknowledgement (a dot, a toggle knob).
*/
const spring = {
	soft: {
		type: "spring",
		stiffness: 140,
		damping: 20
	},
	responsive: {
		type: "spring",
		stiffness: 320,
		damping: 30
	},
	snappy: {
		type: "spring",
		stiffness: 520,
		damping: 34
	}
};
/** A CSS `transition` shorthand for a named token pair. */
function transitionCss(property, ms = "normal", ease = "standard") {
	const curve = easing[ease].join(", ");
	return `${property} ${Math.round(duration[ms] * 1e3)}ms cubic-bezier(${curve})`;
}
/**
* Cursor-reactive geometry. One place decides how far a card may lean or a
* button may follow, so no component invents "rotate 12deg" locally.
*/
const pointer = {
	/** Fraction of the pointer offset a magnetic target follows (0..1). */
	magneticStrength: .3,
	/** Distance in px at which the magnetic pull fades to zero. */
	magneticRadius: 110,
	/** Maximum lean, in degrees. More than ~10 reads as a toy. */
	tiltMaxAngle: 7,
	/** `perspective()` for tilt surfaces, in px. */
	tiltPerspective: 900,
	/** Radius of the glare highlight, in px. */
	glareRadius: 260,
	/** Peak glare opacity (single-digit-to-low-double-digit alpha). */
	glareOpacity: .16,
	/** Default spotlight/glow radius, in px. */
	spotlightRadius: 340,
	/** Travel in px for a parallax layer at depth 1. */
	parallaxDepth: 12
};
/** Hover/press/selected geometry shared by every interactive surface. */
const surfaceResponse = {
	hoverLift: 2,
	hoverScale: 1.012,
	pressScale: .972,
	selectedLift: 1,
	glowStrength: .34
};
/** Blur/depth amounts for enter/exit and background composition, in px. */
const depth = {
	enterBlur: 6,
	exitBlur: 4,
	backgroundBlur: 14
};
/** Looping decorative motion budgets, in seconds. */
const ambient = {
	slowLoop: 9,
	pulse: 3.2,
	shimmer: 1.9,
	trail: 4.6,
	gridDrift: 22
};
/**
* The resolved chart animation budget, in milliseconds.
*
* Kept here (not in the chart module) so the token layer is the single source
* for "how long does a chart transition take".
*/
const chartMotion = {
	/** First paint. Long enough to read as "this drew", short enough to not wait. */
	intro: 520,
	/** A data or range update. Must feel immediate. */
	update: 260,
	/** Hover/emphasis feedback. */
	emphasis: 180
};
/** The CSS custom property names, for components that style with `var(...)`. */
const motionVars = {
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
	trailSpeed: "--ambient-trail"
};
//#endregion
export { ambient, chartMotion, depth, distance, duration, easing, intensityProfiles, motionIntensities, motionVars, pointer, spring, surfaceResponse, transitionCss };

//# sourceMappingURL=tokens.js.map