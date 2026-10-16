//#region src/components/color-picker.d.ts
/**
 * LUC ColorPicker — pick a colour, get a hex string back.
 *
 * The accessibility decision drives the whole design: a two-axis
 * "saturation × brightness" square is a *paint* surface, not a control, and
 * pretending it is a slider would be a lie a screen-reader user pays for. So
 * the square is pointer-only and `aria-hidden`, and the keyboard path is three
 * real sliders (hue, saturation, brightness) plus a text field that accepts any
 * hex notation. Every value a pointer can reach is reachable from the keyboard;
 * the square is the shortcut, not the mechanism.
 *
 * `value`/`defaultValue` are hex strings — what a form, a CSS variable or a
 * design token actually stores — never an opaque colour object.
 */
export type ColorPickerFormat = "hex" | "rgb";
export interface ColorPickerSwatch {
  value: string;
  /** Shown as the tooltip and the accessible name. */
  label: string;
}
export interface ColorPickerProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Preset swatches. Supply the product's own palette; there is no default set. */
  swatches?: readonly ColorPickerSwatch[];
  label?: string;
  disabled?: boolean;
  className?: string;
}
export declare function ColorPicker({ value, defaultValue, onValueChange, swatches, label, disabled, className }: ColorPickerProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=color-picker.d.ts.map