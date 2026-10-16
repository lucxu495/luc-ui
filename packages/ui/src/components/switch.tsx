"use client";

import { Switch as RadixSwitch } from "radix-ui";
import { cn } from "../utils/cn";
import { useField } from "./field";

export interface SwitchProps extends React.ComponentPropsWithRef<typeof RadixSwitch.Root> {
  label?: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md";
}

const sizeStyles = {
  sm: { root: "h-4 w-7", thumb: "size-3" },
  md: { root: "h-[22px] w-[38px]", thumb: "size-[18px]" },
} as const;

// LUC Switch.
//
// One confident slide plus a gentle horizontal "squish" while pressed — the
// trick real hardware toggles use to feel tactile. No spring overshoot: this is
// a professional surface, not a toy.
export function Switch({ className, label, description, size = "md", id, disabled, ...props }: SwitchProps) {
  const field = useField();
  const styles = sizeStyles[size];

  const control = (
    <RadixSwitch.Root
      data-slot="switch"
      id={id ?? field.id}
      disabled={disabled ?? field.disabled}
      aria-describedby={props["aria-describedby"] ?? field.describedBy}
      className={cn(
        "group/switch relative inline-flex shrink-0 items-center rounded-full border",
        /*
         * The `md` track is 38×22 — the right proportion for a switch, and 2 px
         * under the 24 px minimum target. `luc-hit` raises the target without
         * touching the proportions.
         */
        "luc-transition luc-focus luc-hit",
        "border-line-strong bg-surface-sunken",
        "hover:border-line-accent",
        "data-[state=checked]:border-transparent data-[state=checked]:bg-accent-default",
        "data-[state=checked]:hover:bg-accent-hover",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line-strong",
        styles.root,
        className,
      )}
      {...props}
    >
      <RadixSwitch.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-fg-secondary shadow-xs",
          "will-change-transform",
          "[transition:transform_var(--motion-fast)_var(--ease-emphasized),background-color_var(--motion-fast)_var(--ease-standard)]",
          "translate-x-0.5 data-[state=checked]:translate-x-[calc(100%-2px)]",
          "data-[state=checked]:bg-accent-on-accent",
          "group-active/switch:scale-x-110",
          styles.thumb,
        )}
      />
    </RadixSwitch.Root>
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
