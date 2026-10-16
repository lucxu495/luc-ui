"use client";

import { cn } from "../utils/cn";
import { useSpotlight } from "../hooks/use-spotlight";
import { useMotionProfile } from "./intensity";

export interface InteractiveGridProps extends React.ComponentPropsWithRef<"div"> {
  /** Cell size in px. */
  cell?: number;
  variant?: "lines" | "dots";
  /** Radius, in px, of the pointer-reactive highlight. */
  radius?: number;
  /** Let the grid drift slowly on its own. Off under `functional`/`none`. */
  drift?: boolean;
  /** Soft-edge the whole field so it never ends on a hard line. */
  fade?: boolean;
  /** Track the pointer. Turn off for print or a purely decorative field. */
  interactive?: boolean;
}

/**
 * LUC InteractiveGrid — the research-grid atmosphere.
 *
 * A technical grid at low contrast that lights up *near the pointer*. The base
 * grid and the reactive grid are the same CSS gradient twice; the top copy is
 * masked to a radius around the cursor, so activation costs one composited layer
 * and one rAF-throttled custom-property write — no React render, no canvas.
 *
 * Mount it as a background *behind* content (`absolute inset-0`, first child).
 * It is inert on coarse pointers and under reduced motion, where the calm base
 * grid simply stays put.
 */
export function InteractiveGrid({
  className,
  cell = 28,
  variant = "lines",
  radius = 220,
  drift = true,
  fade = true,
  interactive = true,
  ...props
}: InteractiveGridProps) {
  const profile = useMotionProfile();
  const { ref, handlers, enabled } = useSpotlight<HTMLDivElement>({ prefix: "grid", disabled: !interactive });
  const animate = drift && profile.ambient;

  const base =
    variant === "lines"
      ? "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)"
      : "radial-gradient(circle at 1px 1px, var(--grid-line) 1px, transparent 0)";
  const active = base.replaceAll("var(--grid-line)", "var(--grid-line-active)");
  const softMask = "radial-gradient(120% 90% at 50% 20%, #000 30%, transparent 78%)";
  const spotMask =
    "radial-gradient(var(--grid-radius) circle at var(--grid-x, 50%) var(--grid-y, 50%), #000 0%, transparent 70%)";

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-slot="interactive-grid"
      data-variant={variant}
      data-enabled={enabled ? "true" : "false"}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={
        {
          "--grid-cell": `${cell}px`,
          "--grid-radius": `${radius}px`,
          "--grid-line": "color-mix(in oklab, var(--line-default) 45%, transparent)",
          "--grid-line-active": "color-mix(in oklab, var(--accent-default) 60%, transparent)",
        } as React.CSSProperties
      }
      {...handlers}
      {...props}
    >
      <span
        data-slot="interactive-grid-base"
        className={cn(
          "pointer-events-none absolute inset-0",
          animate && "motion-safe:animate-[luc-grid-drift_linear_infinite]",
        )}
        style={{
          backgroundImage: base,
          backgroundSize: `${cell}px ${cell}px`,
          opacity: 0.45,
          maskImage: fade ? softMask : undefined,
          WebkitMaskImage: fade ? softMask : undefined,
          animationDuration: `${(cell / 28) * 22}s`,
        }}
      />
      <span
        data-slot="interactive-grid-active"
        className="pointer-events-none absolute inset-0 [transition:opacity_var(--motion-slow)_var(--ease-standard)]"
        style={{
          backgroundImage: active,
          backgroundSize: `${cell}px ${cell}px`,
          opacity: enabled ? "var(--grid-active, 0)" : 0,
          maskImage: spotMask,
          WebkitMaskImage: spotMask,
        }}
      />
    </div>
  );
}
