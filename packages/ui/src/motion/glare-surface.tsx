"use client";

import { motion, useMotionTemplate } from "motion/react";
import { cn } from "../utils/cn";
import { usePointerMotion } from "../hooks/use-pointer-motion";
import { useMotionProfile } from "./intensity";
import { pointer as pointerTokens } from "./tokens";

export interface GlareSurfaceProps extends React.ComponentPropsWithRef<"div"> {
  /** Radius of the highlight, in px. */
  size?: number;
  /** Peak opacity of the highlight. Stay in single digits to low teens. */
  opacity?: number;
  /** `light` adds a white sheen; `accent` uses the theme accent. */
  tone?: "light" | "accent";
  /** Soft edge as a percentage of `size`. */
  softness?: number;
}

/**
 * LUC GlareSurface — a sheen that follows the pointer *on* the surface.
 *
 * Distinct from `SpotlightSurface`: a spotlight lights the surface under the
 * content, a glare reads as reflection across it. Both are single composited
 * layers with no per-frame React state, so neither can make a chart janky.
 */
export function GlareSurface({
  className,
  children,
  size = pointerTokens.glareRadius,
  opacity = pointerTokens.glareOpacity,
  tone = "light",
  softness = 72,
  ...props
}: GlareSurfaceProps) {
  const profile = useMotionProfile();
  const { ref, enabled, x, y, handlers } = usePointerMotion<HTMLDivElement>({
    disabled: !profile.pointer,
  });

  const tint =
    tone === "light"
      ? `oklch(1 0 0 / ${Math.min(0.4, opacity * profile.glow).toFixed(3)})`
      : `color-mix(in oklab, var(--accent-default) ${Math.round(Math.min(0.5, opacity * profile.glow) * 100)}%, transparent)`;

  const background = useMotionTemplate`radial-gradient(${size}px circle at calc(50% + ${x}px) calc(50% + ${y}px), ${tint}, transparent ${softness}%)`;

  if (!enabled) {
    return (
      <div
        ref={ref}
        data-slot="glare-surface"
        data-enabled="false"
        className={cn("relative isolate min-w-0", className)}
        {...props}
      >
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      data-slot="glare-surface"
      data-enabled="true"
      className={cn("group/glare relative isolate min-w-0 overflow-hidden", className)}
      {...handlers}
      {...props}
    >
      <motion.span
        aria-hidden="true"
        data-slot="glare-layer"
        className="pointer-events-none absolute inset-0 z-0 opacity-0 mix-blend-soft-light [transition:opacity_var(--motion-normal)_var(--ease-standard)] group-hover/glare:opacity-100"
        style={{ opacity: enabled ? undefined : 0, background }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
