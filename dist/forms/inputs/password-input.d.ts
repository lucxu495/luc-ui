import { InputProps } from "../../components/input.js";
//#region src/forms/inputs/password-input.d.ts
export interface PasswordInputProps extends Omit<InputProps, "type" | "trailingAction"> {
  /**
   * Accessible name for the visibility toggle. Override when the surrounding
   * language is not English; the default is `Show password` / `Hide password`.
   */
  toggleLabels?: {
    show: string;
    hide: string;
  };
  /** Start in the revealed state (rarely what you want). */
  defaultVisible?: boolean;
}
/**
 * A password field with a reveal toggle.
 *
 * Three rules, deliberately: the field keeps `type="password"` semantics for
 * password managers, the toggle is a real button with an accessible name, and
 * no policy is enforced here — length rules, breach checks and strength meters
 * are the product's business, not the design system's. Paste is never blocked.
 */
export declare function PasswordInput({ toggleLabels, defaultVisible, className, autoComplete, ...props }: PasswordInputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=password-input.d.ts.map