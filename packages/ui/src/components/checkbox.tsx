"use client";

import { Checkbox as RadixCheckbox } from "radix-ui";
import { cn } from "../utils/cn";
import { useField } from "./field";

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithRef<typeof RadixCheckbox.Root>, "children"> {
  /** Optional inline label rendered to the right of the box. */
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
}

// LUC Checkbox.
//
// A hairlined well that fills with the accent, then draws its tick. The tick is
// a stroke-dashoffset draw on a real SVG path, so the state change reads as one
// continuous gesture instead of an icon swap.
//
// Keyboard semantics, ARIA and the indeterminate model come from Radix. The
// visual language is ours. See docs/ACCESSIBILITY.md.
export function Checkbox({
  className,
  label,
  description,
  invalid,
  id,
  disabled,
  ...props
}: CheckboxProps) {
  const field = useField();

  const control = (
    <RadixCheckbox.Root
      data-slot="checkbox"
      id={id ?? field.id}
      disabled={disabled ?? field.disabled}
      aria-invalid={(invalid ?? field.invalid) || undefined}
      aria-describedby={props["aria-describedby"] ?? field.describedBy}
      className={cn(
        "group/cb relative grid size-[18px] shrink-0 place-items-center rounded-[5px]",
        "border border-line-strong bg-surface-sunken",
        /*
         * 18 px is the right box for a table cell or a dense list, but it is
         * under the 24 px minimum target; `luc-hit` grows the target and leaves
         * the box alone.
         */
        "luc-transition luc-focus luc-hit",
        "hover:border-line-accent hover:bg-surface-interactive-hover",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-default",
        "data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-accent-default",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong",
        "aria-[invalid=true]:border-negative aria-[invalid=true]:shadow-[0_0_0_3px_var(--negative-soft)]",
        className,
      )}
      {...props}
    >
      <RadixCheckbox.Indicator forceMount className="grid size-full place-items-center text-accent-on-accent">
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="size-full">
          <path
            d="M5.4 10.5l3 3L14.7 7.2"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            className={cn(
              "[stroke-dasharray:1] [stroke-dashoffset:1] opacity-0",
              "[transition:stroke-dashoffset_var(--motion-normal)_var(--ease-standard),opacity_var(--motion-fast)_var(--ease-standard)]",
              "group-data-[state=checked]/cb:[stroke-dashoffset:0] group-data-[state=checked]/cb:opacity-100",
            )}
          />
          <path
            d="M6 10h8"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            pathLength={1}
            className={cn(
              "[stroke-dasharray:1] [stroke-dashoffset:1] opacity-0",
              "[transition:stroke-dashoffset_var(--motion-fast)_var(--ease-standard),opacity_var(--motion-fast)_var(--ease-standard)]",
              "group-data-[state=indeterminate]/cb:[stroke-dashoffset:0] group-data-[state=indeterminate]/cb:opacity-100",
            )}
          />
        </svg>
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );

  if (!label && !description) return control;

  return (
    <div className="flex items-start gap-2.5">
      {control}
      <div className="flex min-w-0 flex-col gap-0.5">
        {label ? (
          <label
            htmlFor={id ?? field.id}
            className="cursor-pointer select-none text-label leading-[18px] text-fg-primary"
          >
            {label}
          </label>
        ) : null}
        {description ? <p className="text-caption text-fg-muted">{description}</p> : null}
      </div>
    </div>
  );
}
