"use client";

import { RiStarFill, RiStarLine } from "@remixicon/react";
import { cn } from "../utils/cn";
import { useControllableState } from "../hooks/use-controllable-state";

/**
 * LUC Rating — a score on a fixed scale.
 *
 * The important decision is that this is a **radio group**, not six buttons. A
 * rating is a choice from an ordered scale, which is exactly what a radio group
 * is: one Tab stop, arrow keys to change the value, `aria-checked` per option,
 * and the whole thing announced as "4 of 5 stars". A row of buttons would be six
 * tab stops and no statement of what the chosen number means.
 *
 * Read-only mode is a separate rendering path: it is `role="img"` with a label,
 * because a score that cannot be changed is data, and data is not a form
 * control. `allowHalf` is supported visually and announced as "3.5 of 5".
 */

export interface RatingProps
  extends Omit<React.ComponentPropsWithRef<"div">, "onChange" | "defaultValue"> {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled start value. Default 0. */
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. Default 5. */
  max?: number;
  /** Allow half steps (click the left half of a star). */
  allowHalf?: boolean;
  /** Display only — no interaction, announced as a value. */
  readOnly?: boolean;
  size?: "sm" | "md" | "lg";
  /** Accessible name. Required unless the rating sits in a labelled field. */
  label?: string;
  /** Clears the value when the current one is chosen again. Default `true`. */
  clearable?: boolean;
}

const sizeClass = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
} as const;

export function Rating({
  className,
  value,
  defaultValue = 0,
  onValueChange,
  max = 5,
  allowHalf = false,
  readOnly = false,
  size = "md",
  label,
  clearable = true,
  ...props
}: RatingProps) {
  const [score, setScore] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  });
  const step = allowHalf ? 0.5 : 1;
  const steps = Array.from({ length: Math.round(max / step) }, (_, index) => (index + 1) * step);

  if (readOnly) {
    return (
      <div
        data-slot="rating"
        data-readonly=""
        role="img"
        aria-label={label ?? `${score} out of ${max}`}
        className={cn("inline-flex items-center gap-0.5 text-fg-warning", className)}
        {...props}
      >
        {Array.from({ length: max }).map((_, index) => {
          const filled = index + 1 <= Math.floor(score);
          const half = !filled && index + 0.5 <= score;
          return (
            <span key={index} aria-hidden="true" className="relative inline-flex">
              <RiStarLine className={cn(sizeClass[size], "text-line-strong")} />
              {filled || half ? (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: half ? "50%" : "100%" }}
                >
                  <RiStarFill className={sizeClass[size]} />
                </span>
              ) : null}
            </span>
          );
        })}
      </div>
    );
  }

  const move = (delta: number) => {
    setScore(Math.min(max, Math.max(0, score + delta * step)));
  };

  return (
    <div
      data-slot="rating"
      role="radiogroup"
      aria-label={label ?? "Rating"}
      /* The group itself is not a tab stop — focus lands on the checked radio,
         which is the standard radiogroup pattern — but it must be able to
         receive focus programmatically so it can own the arrow-key handler. */
      tabIndex={-1}
      className={cn("inline-flex items-center gap-0.5", className)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowUp") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
          event.preventDefault();
          move(-1);
        } else if (event.key === "Home") {
          event.preventDefault();
          setScore(0);
        } else if (event.key === "End") {
          event.preventDefault();
          setScore(max);
        }
      }}
      {...props}
    >
      {steps.map((option) => {
        const checked = Math.abs(score - option) < 0.001;
        const filled = option <= score;
        const classes = cn(
          "grid place-items-center rounded-xs p-0.5 luc-transition luc-focus",
          "text-line-strong hover:text-fg-warning",
          filled && "text-fg-warning",
          "hover:scale-110 active:scale-95 motion-reduce:transform-none",
        );
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={`${option} of ${max}`}
            tabIndex={checked || (score === 0 && option === step) ? 0 : -1}
            onClick={() => {
              if (clearable && checked) setScore(0);
              else setScore(option);
            }}
            className={classes}
          >
            {filled ? (
              <RiStarFill aria-hidden="true" className={sizeClass[size]} />
            ) : (
              <RiStarLine aria-hidden="true" className={sizeClass[size]} />
            )}
          </button>
        );
      })}
    </div>
  );
}
