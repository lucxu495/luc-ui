import { ControlSize } from "../../components/input.js";
import { ReactNode } from "react";
//#region src/forms/inputs/number-input.d.ts
/**
 * LUC NumberInput.
 *
 * Behaviour comes from React Aria's `NumberField`: locale-aware parsing and
 * formatting, caret-safe editing, arrow-key steps, `Home`/`End` and a real
 * spinbutton role. LUC owns the shell, the stepper chrome and the unit contract.
 *
 * The value is always a plain JS number in the *canonical* unit — never a
 * formatted string. `formatOptions` changes presentation only.
 */
export interface NumberInputProps {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  /** Called on blur; convenient for engines that validate on touch. */
  onBlur?: () => void;
  min?: number;
  max?: number;
  /**
   * Step grid. Omit it and the field keeps the value you gave it — the steppers
   * still move by React Aria's default (1, or 0.01 for a percentage). Set a
   * step only when the domain really is a grid, because a step also *snaps* a
   * typed value onto that grid on blur.
   */
  step?: number;
  /** `Intl.NumberFormatOptions`. Use `CurrencyInput`/`PercentageInput` presets. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Convenience for `minimumFractionDigits` + `maximumFractionDigits`. */
  decimals?: number;
  /** BCP-47 locale. Inherits the surrounding locale when omitted. */
  locale?: string;
  size?: ControlSize;
  /** Text or glyph shown after the value. Presentation only, never in the value. */
  unit?: ReactNode;
  leadingIcon?: ReactNode;
  /** Chevron steppers. Keyboard and screen readers work either way. */
  steppers?: boolean;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  placeholder?: string;
  name?: string;
  id?: string;
  /** Scroll-wheel editing is off by default; a page should not edit itself. */
  isWheelDisabled?: boolean;
  /** `snap` clamps to min/max/step on blur, which is React Aria's default. */
  commitBehavior?: "snap" | "validate";
  className?: string;
  inputClassName?: string;
  incrementAriaLabel?: string;
  decrementAriaLabel?: string;
  "aria-label"?: string;
}
/**
 * The base number control. `CurrencyInput` and `PercentageInput` are the two
 * unit contracts products ask for most; both are built on this one.
 */
export declare function NumberInput({ value, defaultValue, onValueChange, onBlur, min, max, step, formatOptions, decimals, locale, size, unit, leadingIcon, steppers, invalid, disabled, readOnly, required, placeholder, name, id, isWheelDisabled, commitBehavior, className, inputClassName, incrementAriaLabel, decrementAriaLabel, ...props }: NumberInputProps): import("react").JSX.Element;
export interface CurrencyInputProps extends Omit<NumberInputProps, "formatOptions" | "unit"> {
  /** ISO-4217 code. The component makes no assumption about which one. */
  currency: string;
  /** Fraction digits. Defaults to 2 — a currency field that hides cents is a bug. */
  decimals?: number;
}
/**
 * A number field bound to a currency *format*, not to a currency *policy*.
 * The value is the major unit as a plain number (`1234.5` renders `$1,234.50`).
 */
export declare function CurrencyInput({ currency, decimals, ...props }: CurrencyInputProps): import("react").JSX.Element;
export interface PercentageInputProps extends Omit<NumberInputProps, "formatOptions" | "unit" | "step"> {
  /**
   * The unit contract, stated on purpose and never defaulted:
   * - `fraction`: `0.12` is 12% (what `Intl` and most APIs use).
   * - `percent`: `12` is 12% (what most people type and most forms store).
   */
  scale: "fraction" | "percent";
  step?: number;
}
/**
 * A percentage field with an explicit unit contract.
 *
 * `scale` is required because "0.12" is ambiguous, and a silent unit
 * conversion is how a 12% allocation becomes a 0.12% one. The component
 * converts only between the canonical value and the display value — the
 * consumer's stored value never changes meaning.
 */
export declare function PercentageInput({ scale, step, decimals, value, defaultValue, onValueChange, ...props }: PercentageInputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=number-input.d.ts.map