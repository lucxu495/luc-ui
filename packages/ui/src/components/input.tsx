"use client";

import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { useField } from "./field";

export type ControlSize = "sm" | "md" | "lg";

const shellSizeClass: Record<ControlSize, string> = {
  sm: "h-control-sm rounded-sm text-label",
  md: "h-control-md rounded-md text-label",
  lg: "h-control-lg rounded-md text-body",
};

const iconPadClass: Record<ControlSize, string> = {
  sm: "pl-7 pr-2",
  md: "pl-8 pr-2.5",
  lg: "pl-9 pr-3",
};

const iconPosClass: Record<ControlSize, string> = {
  sm: "left-2",
  md: "left-2.5",
  lg: "left-3",
};

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
export const controlIconSizeClass: Record<ControlSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-[18px]",
};

/**
 * Shared leading/adornment icon slot. Every control that puts a glyph inside
 * its chrome composes this so the icon is sized by the slot, centred by grid
 * (not by a baseline guess), and never overflows the field.
 */
export const inputAdornmentClass = cn(
  "pointer-events-none grid shrink-0 place-items-center text-fg-muted luc-transition [&_svg]:size-full",
);

/**
 * Shared input chrome. Every text-entry control in LUC UI is one of these
 * shells so focus, hover, invalid and disabled states stay identical.
 */
export const inputShellClass = cn(
  "group/input relative flex w-full items-center gap-2",
  "border border-line-default bg-surface-sunken text-fg-primary",
  /*
   * A field is a *well*, not a raised surface: the inset shadow says the value
   * sits inside the layer, which is what separates an input from a button at a
   * glance in a dense form. It is the same `luc-well` rung every other sunken
   * surface in the library uses (progress track, segmented control, slider).
   */
  "shadow-well luc-transition",
  /*
   * Hover lifts the field one step up the surface stack rather than only
   * darkening its border: it is the same "this is alive" cue the Card family
   * uses, so the whole system answers the pointer in one language.
   */
  "hover:border-line-strong hover:bg-surface-interactive hover:shadow-rest",
  /*
   * The focus state is deliberately two things at once — an accent border and a
   * soft inner wash under the caret. The outer ring alone is easy to miss on a
   * dense form at 100% zoom; the inner wash makes the *active* field obvious
   * from across the page without turning it into a glowing box.
   */
  "focus-within:border-line-accent",
  "focus-within:shadow-[var(--glow-focus),inset_0_1px_0_0_color-mix(in_oklab,var(--accent-default)_12%,transparent)]",
  /*
   * Disabled is expressed by the surface and the value's own colour, never by
   * dimming the whole shell with `opacity`. Opacity composites every child —
   * including a tag chip or a date segment — below 4.5:1, and it also dims the
   * shell when a *stepper button* happens to be disabled at max value.
   */
  "has-[:disabled]:cursor-not-allowed has-[:disabled]:bg-surface-sunken has-[:disabled]:border-line-subtle has-[:disabled]:shadow-none",
  /*
   * Read-only is a dashed hairline and the canvas surface — but it has to be
   * *the field* that is read-only, not anything inside it.
   *
   * `has-[:read-only])` looks equivalent and is not: `:read-only` matches every
   * element that is not `:read-write`, which includes the `<span>` of a tag
   * chip, a clear `<button>`, an increment `<button>` and an `<svg>`. Any shell
   * that contains one of those — a filled `TagInput`, a `NumberInput` with its
   * steppers, a `SearchInput` with a value, an `InputGroup` with a trailing
   * action — therefore rendered as if the caller had passed `readOnly`, in the
   * wrong surface colour, while remaining fully editable.
   *
   * The selectors below name the three ways an editable control actually asks
   * for read-only: the `readonly` attribute (React maps the `readOnly` prop to
   * it), `aria-readonly` (React Aria's date and time fields), and the
   * `contenteditable="false"` segment React Aria renders when they are locked.
   */
  "has-[[readonly]]:border-dashed has-[[readonly]]:bg-surface-canvas",
  "has-[[aria-readonly=true]]:border-dashed has-[[aria-readonly=true]]:bg-surface-canvas",
  "has-[[contenteditable=false]]:border-dashed has-[[contenteditable=false]]:bg-surface-canvas",
  "has-[[aria-invalid=true]]:border-negative has-[[aria-invalid=true]]:shadow-[0_0_0_3px_var(--negative-soft)]",
);

export const inputElementClass = cn(
  "peer h-full w-full min-w-0 bg-transparent text-inherit outline-none",
  "placeholder:text-fg-disabled",
  "disabled:cursor-not-allowed disabled:text-fg-disabled",
);

export interface InputProps extends Omit<React.ComponentPropsWithRef<"input">, "size"> {
  size?: ControlSize;
  leadingIcon?: ReactNode;
  trailingAction?: ReactNode;
  invalid?: boolean;
  /** Applied to the `<input>` element itself; `className` styles the shell. */
  inputClassName?: string;
}

export function Input({
  className,
  inputClassName,
  size = "md",
  leadingIcon,
  trailingAction,
  invalid,
  disabled,
  readOnly,
  id,
  required,
  ...props
}: InputProps) {
  const field = useField();
  const isInvalid = invalid ?? field.invalid;
  return (
    <div data-slot="input-shell" className={cn(inputShellClass, shellSizeClass[size], className)} data-size={size}>
      {leadingIcon ? (
        <span
          aria-hidden="true"
          className={cn(
            inputAdornmentClass,
            "absolute top-1/2 -translate-y-1/2",
            "group-focus-within/input:text-fg-accent",
            iconPosClass[size],
            controlIconSizeClass[size],
          )}
        >
          {leadingIcon}
        </span>
      ) : null}
      <input
        data-slot="input"
        id={id ?? field.id}
        required={required ?? field.required}
        disabled={disabled ?? field.disabled}
        readOnly={readOnly ?? field.readOnly}
        aria-busy={field.busy || undefined}
        aria-invalid={isInvalid || undefined}
        aria-describedby={props["aria-describedby"] ?? field.describedBy}
        className={cn(inputElementClass, leadingIcon && iconPadClass[size], !leadingIcon && "px-2.5", inputClassName)}
        {...props}
      />
      {trailingAction ? <span className="flex shrink-0 items-center pr-1.5">{trailingAction}</span> : null}
    </div>
  );
}
