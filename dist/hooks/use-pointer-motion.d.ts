import { SpringPresetName } from "../motion/tokens.js";
import { MotionValue } from "motion/react";
//#region src/hooks/use-pointer-motion.d.ts
export interface PointerMotionState {
  /** Signed offset from the element centre, in px. */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** The same offset normalised to roughly -0.5..0.5. */
  px: MotionValue<number>;
  py: MotionValue<number>;
  /** 0 when idle, 1 while the pointer is over the element. */
  active: MotionValue<number>;
}
export interface UsePointerMotionOptions {
  /** Turn the effect off (a static context, or an ancestor that knows better). */
  disabled?: boolean;
  /** Which spring governs the follow. `responsive` is the house default. */
  preset?: SpringPresetName;
}
export interface UsePointerMotionResult<T extends HTMLElement = HTMLDivElement> extends PointerMotionState {
  ref: React.RefObject<T | null>;
  enabled: boolean;
  /** True while the pointer is over the element — for CSS/QA, not for layout. */
  isActive: boolean;
  handlers: {
    onPointerMove: (event: React.PointerEvent<T>) => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  };
}
/**
 * One pointer tracker for every cursor-reactive primitive.
 *
 * `Magnetic`, `TiltSurface`, `GlareSurface` and `CursorSpotlight` all need the
 * same three things: the pointer position relative to the element, a spring so
 * the response has weight, and a hard "off" switch on touch and under reduced
 * motion. Duplicating that four times is how a system drifts, so it lives here.
 *
 * The loop never touches React state: positions are MotionValues, updated on
 * `pointermove` and smoothed by the motion engine. The only React state is the
 * boolean "is the pointer over me", which changes twice per interaction.
 */
export declare function usePointerMotion<T extends HTMLElement = HTMLDivElement>({ disabled, preset }?: UsePointerMotionOptions): UsePointerMotionResult<T>;
//#endregion
//# sourceMappingURL=use-pointer-motion.d.ts.map