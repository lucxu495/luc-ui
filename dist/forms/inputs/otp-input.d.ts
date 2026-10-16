import { ControlSize } from "../../components/input.js";
//#region src/forms/inputs/otp-input.d.ts
/**
 * LUC OtpInput — one code, one control.
 *
 * `input-otp` owns the hard parts: a single real `<input autocapitalize=off
 * autocomplete="one-time-code">` behind the slots, paste of a whole code,
 * backspace across the boundary, arrow-key navigation, and password-manager
 * behaviour. LUC owns the slots, the sizes and the direction.
 *
 * No authentication logic exists here — the component reports a string.
 */
export type OtpMode = "numeric" | "alphanumeric" | "alpha";
export interface OtpInputProps {
  /** Number of characters. */
  length?: number;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Fired when every slot is filled. */
  onComplete?: (value: string) => void;
  mode?: OtpMode;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  /** Groups the slots visually, e.g. `3` renders 3+3 for a six-digit code. */
  groups?: number[];
  /** Accessible name. A code field is usually labelled by its `<Field>`. */
  "aria-label"?: string;
  id?: string;
  name?: string;
  className?: string;
}
/**
 * The OTP control. It renders real, individually visible slots on top of one
 * hidden input, so screen readers hear a single "one-time code" field rather
 * than six unlabelled boxes.
 */
export declare function OtpInput({ length, value, defaultValue, onValueChange, onComplete, mode, size, invalid, disabled, groups, className, id, name, ...props }: OtpInputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=otp-input.d.ts.map