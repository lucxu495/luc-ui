"use client";

import { RadioGroup as RadixRadioGroup } from "radix-ui";
import { cn } from "../utils/cn";
import { useField } from "./field";

export const RadioGroup = RadixRadioGroup.Root;

export interface RadioProps
  extends Omit<React.ComponentPropsWithRef<typeof RadixRadioGroup.Item>, "children"> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  invalid?: boolean;
}

// LUC Radio. The dot scales in with a whisper of overshoot: 2% of delight,
// then straight back to calm.
export function Radio({ className, label, description, id, disabled, invalid, ...props }: RadioProps) {
  const field = useField();

  const control = (
    <RadixRadioGroup.Item
      data-slot="radio"
      id={id ?? field.id}
      disabled={disabled ?? field.disabled}
      aria-invalid={(invalid ?? field.invalid) || undefined}
      aria-describedby={props["aria-describedby"] ?? field.describedBy}
      className={cn(
        "group/radio relative grid size-[18px] shrink-0 place-items-center rounded-full",
        "border border-line-strong bg-surface-sunken",
        /*
         * 18 px is the right size for a radio next to its label, and it is under
         * the 24 px minimum target. `luc-hit` grows the pointer area to 24×24
         * without moving a pixel, exactly as Checkbox and Switch already did —
         * this one was missed, and it only showed up when a product page put a
         * radio list in a form and the structural probe listed it.
         */
        "luc-transition luc-focus luc-hit",
        "hover:border-line-accent hover:bg-surface-interactive-hover",
        "data-[state=checked]:border-accent-default data-[state=checked]:bg-accent-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-negative",
        className,
      )}
      {...props}
    >
      <RadixRadioGroup.Indicator
        forceMount
        className={cn(
          "block size-2 rounded-full bg-accent-default",
          "[transition:transform_var(--motion-fast)_var(--ease-overshoot)]",
          "data-[state=checked]:scale-100 data-[state=unchecked]:scale-0",
        )}
      />
    </RadixRadioGroup.Item>
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
