"use client";

import { Progress as RadixProgress } from "radix-ui";
import { cn } from "../utils/cn";

export interface ProgressProps extends React.ComponentPropsWithRef<typeof RadixProgress.Root> {
  /** 0–100. Omit for an indeterminate bar. */
  value?: number | null;
  tone?: "accent" | "positive" | "negative" | "warning";
  size?: "sm" | "md";
}

const toneClass = {
  accent: "bg-accent-default",
  positive: "bg-positive",
  negative: "bg-negative",
  warning: "bg-warning",
} as const;

/**
 * LUC Progress — determinate by default; an indeterminate sweep is available
 * for operations whose length is genuinely unknown.
 */
export function Progress({ className, value, tone = "accent", size = "md", ...props }: ProgressProps) {
  const indeterminate = value === null || value === undefined;
  return (
    <RadixProgress.Root
      data-slot="progress"
      value={indeterminate ? null : value}
      className={cn(
        "relative w-full overflow-hidden rounded-full bg-surface-interactive",
        "luc-well",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
      {...props}
    >
      {indeterminate ? (
        <span
          data-motion-essential
          /*
           * `luc-indeterminate`, not the `animate-indeterminate` token.
           *
           * The token is the sweep; the utility is the sweep *and* its reduced
           * form, in the same shape `luc-spinner` uses. The token alone kept a
           * full-width travelling animation running under `reduce`, which is the
           * one thing the clamp's `data-motion-essential` exception promises not
           * to do ("a slow pulse — never travel/rotation"). See the utility's
           * note in `styles/utilities.css`.
           */
          className={cn("absolute inset-y-0 w-1/3 rounded-full luc-indeterminate", toneClass[tone])}
        />
      ) : (
        <RadixProgress.Indicator
          className={cn(
            "h-full rounded-full luc-transition-slow",
            "[transition-property:width,background-color]",
            toneClass[tone],
          )}
          style={{ width: `${Math.min(Math.max(value ?? 0, 0), 100)}%` }}
        />
      )}
    </RadixProgress.Root>
  );
}
