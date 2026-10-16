import { ReactNode } from "react";
//#region src/components/input.d.ts
export type ControlSize = "sm" | "md" | "lg";
/**
 * The icon size for each control density.
 *
 * The value belongs to the *slot*, never to the glyph: a provider icon ships
 * its own `width`/`height` attributes (Remix Icon defaults to 24), and an
 * `svg` is an inline box that sits on the text baseline inside its parent. A
 * slot that only sets its own `size-4` therefore renders a 24px glyph 4px below
 * centre — which is exactly how the V0.6 combobox search bug shipped. Combined
 * with `inputAdornmentClass` the slot owns the geometry and the glyph fills it.
 */
export declare const controlIconSizeClass: Record<ControlSize, string>;
/**
 * Shared leading/adornment icon slot. Every control that puts a glyph inside
 * its chrome composes this so the icon is sized by the slot, centred by grid
 * (not by a baseline guess), and never overflows the field.
 */
export declare const inputAdornmentClass: string;
/**
 * Shared input chrome. Every text-entry control in LUC UI is one of these
 * shells so focus, hover, invalid and disabled states stay identical.
 */
export declare const inputShellClass: string;
export declare const inputElementClass: string;
export interface InputProps extends Omit<React.ComponentPropsWithRef<"input">, "size"> {
  size?: ControlSize;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  invalid?: boolean;
  /** Applied to the `<input>` element itself; `className` styles the shell. */
  inputClassName?: string;
}
export declare function Input({ className, inputClassName, size, leadingIcon, trailingAction, invalid, disabled, readOnly, id, required, ...props }: InputProps): import("react").JSX.Element;
//#endregion
//# sourceMappingURL=input.d.ts.map