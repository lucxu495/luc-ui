import { InputProps } from "./input.js";
//#region src/components/search-input.d.ts
export interface SearchInputProps extends Omit<InputProps, "leadingIcon" | "trailingAction" | "type"> {
  /** Fires on every keystroke (controlled-ish convenience). */
  onValueChange?: (value: string) => void;
  /** Show a clear button when the field has content. Default `true`. */
  clearable?: boolean;
  /**
   * Accessible name for the clear button. The default is English; a product in
   * another language passes its own string instead of forking the component.
   */
  clearLabel?: string;
}
/**
 * Search field with a clear affordance. The clear button is a real button so
 * keyboard users can reach it, and it restores focus to the field.
 */
export declare function SearchInput({ className, onValueChange, clearable, clearLabel, value, defaultValue, onChange, ref, ...props }: SearchInputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=search-input.d.ts.map