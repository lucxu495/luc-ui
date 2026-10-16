import { ControlSize } from "./components/input.js";
import { Slider as Slider$1 } from "radix-ui";
import { ReactNode } from "react";
//#region src/components/slider.d.ts
/**
 * LUC Slider / RangeSlider — a continuous numeric control.
 *
 * The use cases are thresholds, lookbacks, weights, opacities and any other
 * value that is easier to *feel* than to type. Radix supplies the hard parts
 * (pointer maths, `role="slider"` per thumb, arrow / Home / End / PageUp
 * keyboard stepping, RTL and the hidden form input); LUC supplies the groove,
 * the filled range, the thumb and the value bubble.
 *
 * It is deliberately not a mobile-style fat knob: the visible thumb is small,
 * the hit target is far larger, and the track stays quiet until the control is
 * actually being used.
 *
 *   Slider        → one value
 *   RangeSlider   → an inclusive `[min, max]` pair, two thumbs
 *
 * Values are never rescaled: a percentage slider is `min={0} max={1}` and the
 * consumer formats it, so the control cannot silently change a unit.
 */
export interface SliderMark {
  value: number;
  /** Optional caption under the tick. Omit for a bare tick. */
  label?: ReactNode;
}
type ValueDisplay = "auto" | "always" | "never";
export interface SliderProps extends Omit<React.ComponentPropsWithRef<typeof Slider$1.Root>, "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "children"> {
  /** Single value. */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Fired when a drag or key-step settles — the right place to commit. */
  onValueCommit?: (value: number) => void;
  size?: ControlSize;
  /** Accessible name for the thumb when no `Field` label is present. */
  label?: string;
  invalid?: boolean;
  /** When to print the value next to the thumb. Default `auto` (hover, focus, drag). */
  showValue?: ValueDisplay;
  formatValue?: (value: number) => ReactNode;
  /** Optional ticks. Never generated automatically. */
  marks?: readonly SliderMark[];
}
/**
 * One thumb. `value`/`defaultValue` are plain numbers; the tuple the primitive
 * needs never reaches the consumer.
 */
export declare function Slider({ value, defaultValue, onValueChange, onValueCommit, min, max, ...props }: SliderProps): import("react").JSX.Element;
export interface RangeSliderProps extends Omit<SliderProps, "value" | "defaultValue" | "onValueChange" | "onValueCommit" | "label" | "thumbLabels"> {
  /** Inclusive `[minimum, maximum]` pair. */
  value?: readonly [number, number];
  defaultValue?: readonly [number, number];
  onValueChange?: (value: [number, number]) => void;
  onValueCommit?: (value: [number, number]) => void;
  label?: string;
  /** One accessible name per thumb, when "minimum"/"maximum" is not enough. */
  thumbLabels?: readonly [string, string];
  /** Minimum gap between the two thumbs, in `step` increments. */
  minStepsBetweenThumbs?: number;
}
/**
 * Two thumbs, one inclusive range. The value is always a sorted tuple, so
 * `values[0] <= values[1]` holds for every consumer.
 */
export declare function RangeSlider({ value, defaultValue, onValueChange, onValueCommit, min, max, thumbLabels, ...props }: RangeSliderProps): import("react").JSX.Element;
//#endregion
export {};
//# sourceMappingURL=slider.d.ts.map