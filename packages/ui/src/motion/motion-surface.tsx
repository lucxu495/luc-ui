"use client";

import { cn } from "../utils/cn";
import { useSpotlight } from "../hooks/use-spotlight";
import { useMotionProfile } from "./intensity";
import { surfaceResponse } from "./tokens";

/**
 * LUC MotionSurface — the interactive shell for a card, panel or chart block.
 *
 * V1.1 kept this to a 1px lift. V1.2 makes it the composition point: an
 * `expressive` surface lifts, steps its border, and lights under the pointer;
 * a `functional` surface (a dense grid, a form) keeps just the border step; and
 * under reduced motion everything settles into the calm static surface.
 *
 * It is the shell, not the content: a chart, a research block or a metric can
 * be wrapped without the surface prescribing any layout of its own.
 */
export interface MotionSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Lift the surface on hover. Off for dense grids where it reads as jitter. */
  hover?: boolean;
  /** Persistent selected treatment (an accent ring + tinted surface). */
  selected?: boolean;
  /** Show a stronger accent on hover/focus (a focal chart panel). */
  highlight?: boolean;
  /** Let the pointer light the surface. The premium card default. */
  spotlight?: boolean;
  /** Corner radius. Must match the content's own radius. */
  radius?: "md" | "lg" | "xl";
  as?: "div" | "section" | "article" | "li";
  interactive?: boolean;
}

const radiusClass = { md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl" } as const;

export function MotionSurface({
  className,
  children,
  hover = true,
  selected = false,
  highlight = false,
  spotlight = false,
  radius = "lg",
  as = "div",
  interactive = false,
  style,
  ...props
}: MotionSurfaceProps) {
  const profile = useMotionProfile();
  const tracking = spotlight && profile.pointer;
  const { ref, handlers, enabled } = useSpotlight<HTMLDivElement>({ prefix: "surface", disabled: !tracking });
  const Component = as as "div";
  const lift = surfaceResponse.hoverLift * profile.travel;

  return (
    <Component
      ref={ref}
      data-slot="motion-surface"
      data-selected={selected ? "true" : undefined}
      data-interactive={interactive ? "true" : undefined}
      data-spotlight={tracking ? "true" : undefined}
      className={cn(
        "group/surface relative isolate min-w-0 overflow-hidden border border-line-subtle bg-surface-raised",
        radiusClass[radius],
        "motion-safe:transition-[transform,border-color,box-shadow,background-color]",
        "motion-safe:duration-[var(--motion-normal)] motion-safe:ease-[var(--ease-standard)]",
        hover && lift > 0 && "motion-safe:hover:-translate-y-[var(--surface-lift)] hover:border-line-default",
        hover && (highlight ? "hover:shadow-[var(--glow-accent)]" : "hover:shadow-md"),
        selected && "border-accent-default bg-surface-selected shadow-[var(--glow-subtle)]",
        className,
      )}
      {...handlers}
      {...props}
      style={{ ["--surface-lift" as string]: `${lift}px`, ...style }}
    >
      {tracking ? (
        <span
          aria-hidden="true"
          data-slot="motion-surface-glow"
          className={cn(
            "pointer-events-none absolute inset-0 z-0 opacity-0",
            "[transition:opacity_var(--motion-normal)_var(--ease-standard)]",
            "group-hover/surface:opacity-100 group-focus-within/surface:opacity-100",
          )}
          style={{
            opacity: enabled ? undefined : 0,
            background:
              "radial-gradient(320px circle at var(--surface-x, 50%) var(--surface-y, 50%), color-mix(in oklab, var(--accent-default) calc(var(--effect-spotlight-strength) * 100% * var(--surface-glow, 1)), transparent), transparent 70%)",
            ["--surface-glow" as string]: String(Math.max(profile.glow, 0.4)),
          }}
        />
      ) : null}
      <div className="relative z-10 min-w-0">{children}</div>
    </Component>
  );
}
