"use client";

import { RiCheckLine } from "@remixicon/react";
import { cn } from "../utils/cn";

/**
 * LUC Stepper — progress through a known sequence.
 *
 * Used for onboarding, checkout and multi-part forms. Two decisions matter:
 *
 *  1. **A completed step is reversible, an unreachable one is not.** Steps at or
 *     before `current` are buttons; a later step is static text, so a user
 *     cannot jump into a step whose prerequisites are not met.
 *  2. **`aria-current="step"` marks exactly one step**, which is what makes the
 *     strip announce correctly. The connector between steps is decorative and
 *     hidden from assistive technology.
 */

export interface StepperStep {
  id: string;
  label: string;
  /** Optional supporting line under the label. */
  description?: string;
  /** Mark done explicitly; otherwise derived from `current`. */
  complete?: boolean;
}

export interface StepperProps extends Omit<React.ComponentPropsWithRef<"ol">, "children"> {
  steps: readonly StepperStep[];
  /** Zero-based index of the active step. */
  current: number;
  /** Jump to a step. Only steps before `current` call this. */
  onStepSelect?: (index: number) => void;
  /** `horizontal` is a form header; `vertical` is a sidebar checklist. */
  orientation?: "horizontal" | "vertical";
  /** Show the step number instead of a check when done. Default `false`. */
  showNumbers?: boolean;
}

export function Stepper({
  className,
  steps,
  current,
  onStepSelect,
  orientation = "horizontal",
  showNumbers = false,
  ...props
}: StepperProps) {
  return (
    <ol
      data-slot="stepper"
      data-orientation={orientation}
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-start" : "flex-col",
        className,
      )}
      {...props}
    >
      {steps.map((step, index) => {
        const done = step.complete ?? index < current;
        const active = index === current;
        const reachable = index <= current;
        const marker = (
          <span
            aria-hidden="true"
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full border text-micro font-medium",
              "luc-transition luc-numeric",
              done && "border-line-accent bg-accent-soft text-fg-accent shadow-well",
              active && "border-line-accent bg-accent-default text-accent-on-accent shadow-rest",
              !done && !active && "border-line-default bg-surface-interactive text-fg-muted",
            )}
          >
            {done && !showNumbers ? <RiCheckLine className="size-3.5" /> : index + 1}
          </span>
        );
        const body = (
          <>
            {marker}
            <span className="flex min-w-0 flex-col">
              <span
                className={cn(
                  "text-label",
                  active ? "font-medium text-fg-primary" : done ? "text-fg-secondary" : "text-fg-muted",
                )}
              >
                {step.label}
              </span>
              {step.description ? (
                <span className="text-micro text-fg-muted">{step.description}</span>
              ) : null}
            </span>
          </>
        );

        return (
          <li
            key={step.id}
            data-slot="stepper-step"
            data-state={done ? "complete" : active ? "current" : "upcoming"}
            /*
             * `aria-current` belongs on the control the reader actually reaches.
             *
             * It used to sit only on the `<li>`, which is not focusable: a
             * screen-reader user tabbing through the stepper heard "Account,
             * button", "Plan, button", "Payment, button" and never learned which
             * one they were on. It is on the *button* now, and stays on the
             * `<li>` in the one case where no button exists (a step with no
             * `onStepSelect`), so exactly one element in the stepper carries it
             * — which is the invariant the existing test asserts.
             */
            aria-current={active && !(reachable && onStepSelect) ? "step" : undefined}
            className={cn(
              "flex gap-3",
              orientation === "horizontal" ? "flex-1 items-start" : "pb-5 last:pb-0",
            )}
          >
            {reachable && onStepSelect ? (
              <button
                type="button"
                aria-current={active ? "step" : undefined}
                onClick={() => onStepSelect(index)}
                className={cn(
                  "flex items-start gap-3 rounded-md p-1 text-left",
                  "cursor-pointer luc-transition luc-focus luc-press",
                  "hover:bg-surface-interactive-hover",
                )}
              >
                {body}
              </button>
            ) : (
              <span className="flex items-start gap-3 p-1">{body}</span>
            )}
            {orientation === "horizontal" && index < steps.length - 1 ? (
              <span
                aria-hidden="true"
                /*
                 * The connector carries the same `luc-transition` pitch as the
                 * marker beside it, so moving back a step lets the progress line
                 * settle instead of snapping — the one motion in the strip, and it
                 * is duration-only (the base layer zeroes it under
                 * `prefers-reduced-motion`).
                 */
                className={cn(
                  "mt-4 h-px grow rounded-full luc-transition",
                  done ? "bg-line-accent" : "bg-line-subtle",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
