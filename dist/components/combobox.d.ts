import { ControlSize } from "./input.js";
import { ReactNode } from "react";
//#region src/components/combobox.d.ts
/**
 * LUC Combobox — search, then choose.
 *
 * Downshift owns the WAI-ARIA combobox contract: `aria-activedescendant`
 * bookkeeping, roving highlight, Home/End/PageUp/PageDown, typeahead, Escape and
 * Enter semantics. LUC owns the field chrome, the menu surface, the grouped row
 * layout, the loading and no-results states, and the clear affordance.
 *
 * Async is a consumer concern, not this component's: pass `inputValue` +
 * `onInputValueChange` + `loading` and supply `options` when your request
 * resolves. Nothing here fetches anything.
 */
export interface ComboboxOption {
  value: string;
  label: string;
  /** Secondary line, e.g. a ticker or a country code. */
  description?: string;
  /** Section header. Consecutive options sharing a group are rendered together. */
  group?: string;
  disabled?: boolean;
  /** Optional leading visual (flag, icon). Decorative. */
  leading?: ReactNode;
}
export interface ComboboxProps {
  options: readonly ComboboxOption[];
  /** Selected option (controlled). */
  value?: ComboboxOption | null;
  onValueChange?: (option: ComboboxOption | null) => void;
  /** Query text (controlled) — the async path. */
  inputValue?: string;
  onInputValueChange?: (query: string) => void;
  /** Replacement matcher. Default: case-insensitive `label`/`description` contains. */
  filter?: (option: ComboboxOption, query: string) => boolean;
  placeholder?: string;
  /** Announcement + body when nothing matches. */
  emptyMessage?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  /**
   * Accessible names for the three built-in buttons. Defaults are English; a
   * product in another language passes its own strings rather than forking the
   * component. The open/close pair toggles with the list.
   */
  clearLabel?: string;
  openLabel?: string;
  closeLabel?: string;
  size?: ControlSize;
  /** Accessible name for the input. Required unless a `Field` label is present. */
  "aria-label"?: string;
  id?: string;
  name?: string;
  className?: string;
  /** Max height of the scrollable list, e.g. `18rem`. */
  maxHeight?: string;
  /** Render a distinct row (icon, avatar…). Falls back to the default row. */
  renderOption?: (option: ComboboxOption, state: {
    selected: boolean;
    highlighted: boolean;
  }) => ReactNode;
}
export declare function Combobox({ options, value, onValueChange, inputValue, onInputValueChange, filter, placeholder, emptyMessage, loading, disabled, clearable, clearLabel, openLabel, closeLabel, size, id, name, className, maxHeight, renderOption, ...rest }: ComboboxProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=combobox.d.ts.map