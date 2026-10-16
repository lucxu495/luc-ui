import { ControlSize } from "../../components/input.js";
//#region src/forms/inputs/tag-input.d.ts
/**
 * LUC TagInput — a list of short values typed into one row.
 *
 * Built from `Input` + `Tag` semantics rather than a dependency: the behaviour
 * is a text input with commit keys, which is small enough to own honestly, and
 * LUC already has the chip and the shell. (React Aria's `TokenField` is the
 * upgrade path if a prompt-style field with inline mentions is ever needed.)
 *
 * The component stores strings only. Whether a string is an email, a symbol or
 * a keyword is the caller's meaning; validation is exposed as a callback that
 * returns a message.
 */
export interface TagInputProps {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (tags: string[]) => void;
  placeholder?: string;
  /** Maximum tags. Further input is refused with an inline message. */
  maxTags?: number;
  /** Keys that commit the current text. Enter always commits. */
  separators?: string[];
  /** Return a message to reject the candidate value. */
  validate?: (tag: string, tags: string[]) => string | undefined;
  /** Trims and lowercases before comparing for duplicates. Default `false`. */
  caseSensitive?: boolean;
  allowDuplicates?: boolean;
  size?: ControlSize;
  invalid?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}
export declare function TagInput({ value, defaultValue, onValueChange, placeholder, maxTags, separators, validate, caseSensitive, allowDuplicates, size, invalid, disabled, readOnly, id, className, ...props }: TagInputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=tag-input.d.ts.map