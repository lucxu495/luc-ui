"use client";

import { cn } from "@luc/ui";
import { useOptionalI18n } from "@/lib/i18n/provider";

export interface StateGridProps {
  states: { label: string; note?: string; render: React.ReactNode }[];
  className?: string;
  columns?: 2 | 3 | 4;
}

/**
 * Presents the states a reviewer must be able to see at a glance:
 * default, hover, active, focus-visible, disabled, loading.
 *
 * Hover/active/focus are shown as static *specimens* — the stage applies the
 * class that the real interaction would produce, so screenshots are reviewable.
 */
export function StateGrid({ states, className, columns = 3 }: StateGridProps) {
  const i18n = useOptionalI18n();
  const tcs = i18n?.tcs ?? ((source: string) => source);

  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 2 && "sm:grid-cols-2",
        columns === 3 && "sm:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {states.map((state) => (
        <div key={state.label} className="flex flex-col gap-2">
          <div
            className={cn(
              "flex min-h-20 flex-1 items-center justify-center rounded-lg border border-dashed border-line-default",
              "bg-surface-canvas px-4 py-5",
            )}
          >
            {state.render}
          </div>
          <div className="flex flex-col gap-0.5 px-0.5">
            <p className="text-caption font-medium text-fg-secondary">{tcs(state.label)}</p>
            {state.note ? <p className="text-micro text-fg-muted">{tcs(state.note)}</p> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
